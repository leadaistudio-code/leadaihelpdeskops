package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// statusFn lets the tray reflect the agent's live state.
type statusFn func(text string, ok bool)

// enrollOnce registers this device and caches the returned device key.
func enrollOnce(server, token string) (string, error) {
	var dev struct {
		DeviceKey string `json:"deviceKey"`
	}
	if readJSON(deviceFile(), &dev) && dev.DeviceKey != "" {
		return dev.DeviceKey, nil
	}
	hostname, _ := os.Hostname()
	body, _ := json.Marshal(map[string]string{
		"enrollmentToken": token,
		"hostname":        hostname,
		"os":              osString(),
		"user":            username(),
	})
	res, err := httpClient.Post(server+"/api/agent/enroll", "application/json", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	if res.StatusCode >= 300 {
		b, _ := io.ReadAll(io.LimitReader(res.Body, 200))
		return "", fmt.Errorf("enroll %d: %s", res.StatusCode, string(b))
	}
	if err := json.NewDecoder(res.Body).Decode(&dev); err != nil {
		return "", err
	}
	_ = writeJSON(deviceFile(), map[string]string{"deviceKey": dev.DeviceKey})
	return dev.DeviceKey, nil
}

// reportForever is the main loop: enroll, then on each tick send metrics, run
// any queued remediations, and fire the periodic sub-polls on their cadences.
func reportForever(cfg Config, getPaused func() bool, onStatus statusFn) {
	interval := time.Duration(cfg.Interval) * time.Second
	logLine(fmt.Sprintf("AIops Agent starting — server %s, interval %ds", cfg.Server, cfg.Interval))

	var deviceKey string
	for deviceKey == "" {
		onStatus("Enrolling…", true)
		k, err := enrollOnce(cfg.Server, cfg.Token)
		if err != nil {
			logLine("Enroll failed: " + err.Error() + " — retry in 15s")
			onStatus("Enroll failed (retrying)", false)
			time.Sleep(15 * time.Second)
			continue
		}
		deviceKey = k
		logLine("Enrolled ✓")
	}

	sched := newSchedule()
	for {
		if getPaused != nil && getPaused() {
			onStatus("Paused", false)
			time.Sleep(3 * time.Second)
			continue
		}

		m := collect(cfg.Server)
		if err := postMetrics(cfg.Server, deviceKey, m); err != nil {
			logLine("Report failed: " + err.Error())
			onStatus("Offline — "+err.Error(), false)
		} else {
			summary := fmt.Sprintf("CPU %d%%  Mem %d%%", int(m.CpuPct+0.5), memPct(m))
			if m.DiskPct != nil {
				summary += fmt.Sprintf("  Disk %d%%", int(*m.DiskPct+0.5))
			}
			logLine("Reported ✓  " + summary)
			onStatus(fmt.Sprintf("OK %s · %s", time.Now().Format("15:04:05"), summary), true)

			pollCommands(cfg.Server, deviceKey)
			sched.run(cfg.Server, deviceKey)
		}
		time.Sleep(interval)
	}
}

func memPct(m Metrics) int {
	if m.MemTotalMb == 0 {
		return 0
	}
	return int(float64(m.MemUsedMb)/float64(m.MemTotalMb)*100 + 0.5)
}

func postMetrics(server, deviceKey string, m Metrics) error {
	return postJSON(server, deviceKey, "metrics", m)
}

// pollCommands pulls queued remediations, runs them, and reports the result.
func pollCommands(server, deviceKey string) {
	req, _ := http.NewRequest("GET", server+"/api/agent/commands", nil)
	req.Header.Set("Authorization", "Bearer "+deviceKey)
	res, err := httpClient.Do(req)
	if err != nil {
		return
	}
	defer res.Body.Close()
	if res.StatusCode >= 300 {
		return
	}
	var payload struct {
		Commands []struct {
			ID     string `json:"id"`
			Action string `json:"action"`
		} `json:"commands"`
	}
	if json.NewDecoder(res.Body).Decode(&payload) != nil {
		return
	}
	for _, c := range payload.Commands {
		logLine("Running remediation: " + c.Action)
		ok, out := execAction(c.Action)
		status := "DONE"
		if !ok {
			status = "FAILED"
		}
		_ = postJSON(server, deviceKey, "commands/result", map[string]any{
			"id": c.ID, "status": status, "result": clip(out, 2000),
		})
	}
}

func clip(s string, n int) string {
	if len(s) > n {
		return s[:n]
	}
	return s
}

// schedule tracks the cadence of the periodic sub-polls so heavy ones (boot,
// software, hardware) don't run every tick.
type schedule struct {
	lastBoot, lastSoftware, lastHardware, lastCrash time.Time
}

func newSchedule() *schedule {
	return &schedule{lastCrash: time.Now()}
}

func (s *schedule) run(server, deviceKey string) {
	now := time.Now()

	// Security posture: every tick (cheap enough, and important).
	sec := collectSecurity()
	_ = postJSON(server, deviceKey, "security", sec)

	// Crashes: since the last check (event log / journal), every tick.
	sinceSec := int(now.Sub(s.lastCrash).Seconds()) + 5
	if sinceSec < 10 {
		sinceSec = 10
	}
	s.lastCrash = now
	for _, c := range collectCrashes(sinceSec) {
		_ = postJSON(server, deviceKey, "crashes", c)
	}

	// Software usage: every 5 minutes.
	if now.Sub(s.lastSoftware) > 5*time.Minute {
		s.lastSoftware = now
		if apps := collectSoftware(); len(apps) > 0 {
			_ = postJSON(server, deviceKey, "software", map[string]any{"action": "BULK_USAGE", "softwareNames": apps})
		}
	}

	// Hardware health: every 15 minutes.
	if now.Sub(s.lastHardware) > 15*time.Minute {
		s.lastHardware = now
		for _, h := range collectHardware() {
			_ = postJSON(server, deviceKey, "hardware", h)
		}
	}

	// Boot time: once a day.
	if now.Sub(s.lastBoot) > 24*time.Hour {
		s.lastBoot = now
		if total, osBoot, ok := collectBoot(); ok {
			_ = postJSON(server, deviceKey, "boot", map[string]any{"totalBootSec": total, "osBootSec": osBoot})
		}
	}
}

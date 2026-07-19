//go:build linux

package main

import (
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// platformExtras gathers Linux/EC2 telemetry: WiFi (iwgetid), packet loss (ping
// to gateway), GPU (lspci), drives (df), gateway, running services.
func platformExtras(server string) Extras {
	var x Extras
	x.Info = map[string]any{}

	x.BatteryPct = linuxBattery()

	if ssid := sh("iwgetid -r 2>/dev/null"); ssid != "" {
		x.WifiSsid = sptr(ssid)
		if sig := sh("cat /proc/net/wireless 2>/dev/null | tail -1 | awk '{print $4}'"); sig != "" {
			if f, err := strconv.ParseFloat(strings.TrimSuffix(sig, "."), 64); err == nil {
				x.WifiSignalDbm = iptr(int(f))
			}
		}
	}

	gw := firstLine(sh("ip route show default 2>/dev/null | awk '{print $3}' | head -1"))
	if gw != "" {
		x.Info["defaultGateway"] = gw
		if loss, rtt, ok := pingStats(gw); ok {
			x.PacketLossPct = fptr(loss)
			if rtt >= 0 {
				x.Info["gatewayRttMs"] = rtt
			}
		}
	}

	if gpu := sh("lspci 2>/dev/null | grep -iE 'vga|3d|display' | head -1 | sed 's/.*: //'"); gpu != "" {
		x.Info["gpuName"] = gpu
	}
	if svc := sh("systemctl list-units --state=running --type=service --no-legend 2>/dev/null | wc -l"); svc != "" {
		if n, err := strconv.Atoi(firstLine(svc)); err == nil {
			x.Info["runningServices"] = n
		}
	}
	// Drives via df.
	if raw := sh("df -B1 --output=target,avail,size -x tmpfs -x devtmpfs -x overlay 2>/dev/null | tail -n +2"); raw != "" {
		var drives []map[string]any
		for _, line := range strings.Split(raw, "\n") {
			f := strings.Fields(line)
			if len(f) < 3 {
				continue
			}
			avail, _ := strconv.ParseFloat(f[1], 64)
			size, _ := strconv.ParseFloat(f[2], 64)
			drives = append(drives, map[string]any{
				"id":      f[0],
				"freeGB":  round1(avail / 1e9),
				"totalGB": round1(size / 1e9),
			})
		}
		x.Info["drives"] = drives
	}
	return x
}

func linuxBattery() *int {
	b, err := os.ReadFile("/sys/class/power_supply/BAT0/capacity")
	if err != nil {
		return nil
	}
	if n, err := strconv.Atoi(strings.TrimSpace(string(b))); err == nil {
		return &n
	}
	return nil
}

var reLinuxLoss = regexp.MustCompile(`(\d+)%\s*packet loss`)
var reLinuxRtt = regexp.MustCompile(`=\s*[\d.]+/([\d.]+)/`)

func pingStats(target string) (float64, int, bool) {
	out := runCmd(8*time.Second, "ping", "-c", "4", "-w", "6", target)
	if out == "" {
		return 0, -1, false
	}
	loss, rtt := 0.0, -1
	if m := reLinuxLoss.FindStringSubmatch(out); m != nil {
		if n, err := strconv.Atoi(m[1]); err == nil {
			loss = float64(n)
		}
	}
	if m := reLinuxRtt.FindStringSubmatch(out); m != nil {
		if f, err := strconv.ParseFloat(m[1], 64); err == nil {
			rtt = int(f + 0.5)
		}
	}
	return loss, rtt, true
}

func collectSecurity() Security {
	var s Security
	if strings.Contains(sh("ufw status 2>/dev/null"), "active") {
		s.Firewall = true
	} else if n, _ := strconv.Atoi(firstLine(sh("iptables -L -n 2>/dev/null | wc -l"))); n > 8 {
		s.Firewall = true
	}
	av := sh("systemctl is-active clamav-daemon 2>/dev/null; systemctl is-active falcon-sensor 2>/dev/null; systemctl is-active amazon-ssm-agent 2>/dev/null")
	s.AvUpdated = strings.Contains(av, "active")
	if n, _ := strconv.Atoi(firstLine(sh("lsblk -o TYPE 2>/dev/null | grep -c crypt"))); n > 0 {
		s.Bitlocker = true
	}
	return s
}

func collectCrashes(sinceSec int) []Crash {
	raw := sh("journalctl --since \"" + strconv.Itoa(sinceSec) + " seconds ago\" -p err..emerg --no-pager -o short 2>/dev/null | tail -20")
	if raw == "" {
		return nil
	}
	var out []Crash
	for _, line := range strings.Split(raw, "\n") {
		c := Crash{AppName: "Unknown", AppVersion: "Unknown", EventType: "CRASH"}
		switch {
		case regexp.MustCompile(`(?i)kernel panic|BUG:|Oops:`).MatchString(line):
			c.EventType, c.AppName = "BSOD", "Linux Kernel"
		case regexp.MustCompile(`(?i)oom-kill|Out of memory`).MatchString(line):
			c.AppName = "OOM Victim"
			if m := regexp.MustCompile(`(?i)[Kk]illed? process \d+ \(([^)]+)\)`).FindStringSubmatch(line); m != nil {
				c.AppName = m[1]
			}
		case regexp.MustCompile(`(?i)segfault|SIGSEGV|SIGABRT`).MatchString(line):
			if m := regexp.MustCompile(`(\S+)\[\d+\]`).FindStringSubmatch(line); m != nil {
				c.AppName = m[1]
			}
		default:
			continue
		}
		out = append(out, c)
	}
	return out
}

func collectSoftware() []string {
	raw := sh("ps -eo comm --no-headers | sort -u | grep -v '^\\[' | head -100")
	if raw == "" {
		return nil
	}
	var apps []string
	for _, a := range strings.Split(raw, "\n") {
		if a = strings.TrimSpace(a); a != "" {
			apps = append(apps, a)
		}
	}
	return apps
}

func collectBoot() (int, int, bool) {
	raw := sh("systemd-analyze 2>/dev/null | head -1")
	total := regexp.MustCompile(`=\s*([\d.]+)s`).FindStringSubmatch(raw)
	if total == nil {
		return 0, 0, false
	}
	tf, _ := strconv.ParseFloat(total[1], 64)
	totalSec := int(tf + 0.999)
	osBoot := totalSec - 3
	if k := regexp.MustCompile(`([\d.]+)s\s*\(kernel\)`).FindStringSubmatch(raw); k != nil {
		kf, _ := strconv.ParseFloat(k[1], 64)
		osBoot = int(kf + 0.999)
	}
	if osBoot < 1 {
		osBoot = 1
	}
	return totalSec, osBoot, true
}

func collectHardware() []HardwarePred {
	var out []HardwarePred
	smart := sh("smartctl -H /dev/sda 2>/dev/null | grep -iE 'overall-health|SMART Health'")
	if smart != "" {
		prob := 0.8
		if regexp.MustCompile(`(?i)PASSED|OK`).MatchString(smart) {
			prob = 0.05
		}
		out = append(out, HardwarePred{Component: "DISK", Probability: prob, Status: statusFor(prob)})
	} else if n, _ := strconv.Atoi(firstLine(sh("dmesg 2>/dev/null | grep -ci 'I/O error\\|medium error\\|bad sector'"))); n > 0 {
		out = append(out, HardwarePred{Component: "DISK", Probability: 0.6, Status: "WARNING"})
	}
	if n, _ := strconv.Atoi(firstLine(sh("dmesg 2>/dev/null | grep -ci 'memory error\\|EDAC\\|mce.*memory'"))); n > 0 {
		out = append(out, HardwarePred{Component: "MEMORY", Probability: 0.7, Status: "WARNING"})
	}
	if n, _ := strconv.Atoi(firstLine(sh("dmesg 2>/dev/null | grep -ci 'cpu.*throttl\\|thermal'"))); n > 0 {
		out = append(out, HardwarePred{Component: "CPU", Probability: 0.5, Status: "WARNING"})
	}
	return out
}

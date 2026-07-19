package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

const appName = "AIops Agent"

// stateDir is where config, device key, and logs live (per-user, no admin).
func stateDir() string {
	if runtime.GOOS == "windows" {
		base := os.Getenv("LOCALAPPDATA")
		if base == "" {
			base, _ = os.UserHomeDir()
		}
		return filepath.Join(base, "leadaistudio-dex")
	}
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".leadaistudio-dex")
}

func configFile() string  { return filepath.Join(stateDir(), "config.json") }
func deviceFile() string  { return filepath.Join(stateDir(), "device.json") }
func logFile() string     { return filepath.Join(stateDir(), "agent.log") }
func batteryFile() string { return filepath.Join(stateDir(), "battery.json") }

func ensureDir() { _ = os.MkdirAll(stateDir(), 0o755) }

// Config is the agent's server connection settings.
type Config struct {
	Server   string `json:"server"`
	Token    string `json:"token"`
	Interval int    `json:"interval"`
}

func readJSON(path string, v any) bool {
	b, err := os.ReadFile(path)
	if err != nil {
		return false
	}
	return json.Unmarshal(b, v) == nil
}

func writeJSON(path string, v any) error {
	ensureDir()
	b, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return os.WriteFile(path, b, 0o600)
}

// resolveConfig merges CLI flags over the on-disk config and a sidecar file
// shipped next to the exe (aiops-agent.config.json), mirroring the JS agent.
func resolveConfig(args map[string]string) Config {
	var cfg Config
	cfg.Server = args["server"]
	cfg.Token = args["token"]
	if v := args["interval"]; v != "" {
		fmt.Sscanf(v, "%d", &cfg.Interval)
	}

	if cfg.Server == "" || cfg.Token == "" {
		var disk Config
		if readJSON(configFile(), &disk) || readSidecarConfig(&disk) {
			if cfg.Server == "" {
				cfg.Server = disk.Server
			}
			if cfg.Token == "" {
				cfg.Token = disk.Token
			}
			if cfg.Interval == 0 {
				cfg.Interval = disk.Interval
			}
		}
	}
	if cfg.Interval == 0 {
		cfg.Interval = 30
	}
	cfg.Server = strings.TrimRight(cfg.Server, "/")
	return cfg
}

func readSidecarConfig(v *Config) bool {
	exe, err := os.Executable()
	if err != nil {
		return false
	}
	for _, name := range []string{"aiops-agent.config.json", "dex-agent.config.json"} {
		if readJSON(filepath.Join(filepath.Dir(exe), name), v) {
			return true
		}
	}
	return false
}

func logLine(msg string) {
	line := fmt.Sprintf("[%s] %s\r\n", time.Now().Format("2006-01-02 15:04:05"), msg)
	ensureDir()
	if f, err := os.OpenFile(logFile(), os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644); err == nil {
		_, _ = f.WriteString(line)
		_ = f.Close()
	}
}

// httpClient is shared and short-timeout — the agent must never hang on a
// slow/dead server.
var httpClient = &http.Client{Timeout: 15 * time.Second}

// postJSON sends an authenticated JSON POST to /api/agent/<path>. Errors are
// swallowed by callers that treat telemetry as best-effort.
func postJSON(server, deviceKey, path string, body any) error {
	b, err := json.Marshal(body)
	if err != nil {
		return err
	}
	req, err := http.NewRequest("POST", server+"/api/agent/"+path, bytes.NewReader(b))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+deviceKey)
	res, err := httpClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode >= 300 {
		return fmt.Errorf("%s %d", path, res.StatusCode)
	}
	return nil
}

// parseArgs turns "--k=v" / "--flag" into a map (flag → "true").
func parseArgs(argv []string) map[string]string {
	out := map[string]string{}
	for _, a := range argv {
		if !strings.HasPrefix(a, "--") {
			continue
		}
		a = a[2:]
		if i := strings.IndexByte(a, '='); i >= 0 {
			out[a[:i]] = a[i+1:]
		} else {
			out[a] = "true"
		}
	}
	return out
}

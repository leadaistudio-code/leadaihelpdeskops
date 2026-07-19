package main

import (
	"context"
	"encoding/json"
	"os/exec"
	"strings"
	"time"
)

// runCmd runs a command with a timeout and a hidden console window (Windows),
// returning trimmed stdout or "" on any error. The agent treats all shell-outs
// as best-effort.
func runCmd(timeout time.Duration, name string, args ...string) string {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	cmd := exec.CommandContext(ctx, name, args...)
	hideWindow(cmd)
	out, err := cmd.Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(out))
}

func ps(script string) string { return runCmd(12*time.Second, "powershell", "-NoProfile", "-Command", script) }
func sh(script string) string { return runCmd(12*time.Second, "sh", "-c", script) }

func iptr(i int) *int        { return &i }
func sptr(s string) *string  { return &s }
func fptr(f float64) *float64 { return &f }

// firstLine returns the first non-empty trimmed line of s.
func firstLine(s string) string {
	for _, ln := range strings.Split(s, "\n") {
		if t := strings.TrimSpace(ln); t != "" {
			return t
		}
	}
	return ""
}

// parseStringList decodes PowerShell's ConvertTo-Json output, which is an array
// for many items, a bare string for one, or empty for none.
func parseStringList(raw string) []string {
	raw = strings.TrimSpace(raw)
	if raw == "" || raw == "[]" || raw == `""` {
		return nil
	}
	var arr []string
	if json.Unmarshal([]byte(raw), &arr) == nil {
		return arr
	}
	var one string
	if json.Unmarshal([]byte(raw), &one) == nil && one != "" {
		return []string{one}
	}
	return nil
}

// statusFor maps a failure probability to the server's status vocabulary.
func statusFor(prob float64) string {
	if prob > 0.5 {
		return "WARNING"
	}
	return "RESOLVED"
}

package main

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

const taskName = "AIops Agent"
const systemdUnit = "aiops-agent.service"

// silentInstall persists config and registers the agent to auto-start: a
// scheduled task on Windows, a systemd service (or crontab fallback) on Linux.
func silentInstall(cfg Config) {
	_ = writeJSON(configFile(), cfg)
	exe, _ := os.Executable()

	if runtime.GOOS == "windows" {
		cmd := `"` + exe + `" --run`
		runCmd(30*time.Second, "schtasks", "/Create", "/TN", taskName, "/TR", cmd, "/SC", "ONLOGON", "/F")
		runCmd(30*time.Second, "schtasks", "/Run", "/TN", taskName)
		logLine("Installed (Windows scheduled task).")
		return
	}
	installSystemd(exe)
}

// firstRunSetup persists config and (on Windows) adds Startup + Desktop
// shortcuts, so a double-clicked exe keeps running across logons.
func firstRunSetup(cfg Config) {
	_ = writeJSON(configFile(), cfg)
	if runtime.GOOS != "windows" {
		return
	}
	exe, _ := os.Executable()
	for _, lnk := range shortcutPaths() {
		makeShortcut(lnk, exe)
	}
	logLine("Added Startup + Desktop shortcuts.")
}

func uninstall() {
	if runtime.GOOS == "windows" {
		runCmd(30*time.Second, "schtasks", "/Delete", "/TN", taskName, "/F")
		for _, lnk := range shortcutPaths() {
			_ = os.Remove(lnk)
		}
	} else {
		sh("systemctl stop " + systemdUnit + " 2>/dev/null; systemctl disable " + systemdUnit + " 2>/dev/null")
		_ = os.Remove("/etc/systemd/system/" + systemdUnit)
		sh("systemctl --user stop " + systemdUnit + " 2>/dev/null; systemctl --user disable " + systemdUnit + " 2>/dev/null")
		home, _ := os.UserHomeDir()
		_ = os.Remove(filepath.Join(home, ".config", "systemd", "user", systemdUnit))
		sh("crontab -l 2>/dev/null | grep -v 'aiops-agent' | crontab -")
		sh("systemctl daemon-reload 2>/dev/null; systemctl --user daemon-reload 2>/dev/null")
	}
	logLine("AIops Agent uninstalled.")
}

func shortcutPaths() []string {
	appdata := os.Getenv("APPDATA")
	home, _ := os.UserHomeDir()
	if appdata == "" {
		appdata = home
	}
	return []string{
		filepath.Join(appdata, "Microsoft", "Windows", "Start Menu", "Programs", "Startup", appName+".lnk"),
		filepath.Join(home, "Desktop", appName+".lnk"),
	}
}

func makeShortcut(linkPath, exe string) {
	script := strings.Join([]string{
		`$s=(New-Object -ComObject WScript.Shell).CreateShortcut("` + linkPath + `")`,
		`$s.TargetPath="` + exe + `"`,
		`$s.WorkingDirectory="` + filepath.Dir(exe) + `"`,
		`$s.IconLocation="` + exe + `,0"`,
		`$s.WindowStyle=7`,
		`$s.Description="AIops Agent"`,
		`$s.Save()`,
	}, ";")
	ps(script)
}

func installSystemd(exe string) {
	unit := strings.Join([]string{
		"[Unit]",
		"Description=AIops Agent (LeadAIStudio)",
		"After=network-online.target",
		"Wants=network-online.target",
		"",
		"[Service]",
		"ExecStart=" + exe + " --run",
		"Restart=always",
		"RestartSec=10",
		"WorkingDirectory=" + stateDir(),
		"",
		"[Install]",
		"WantedBy=multi-user.target",
		"",
	}, "\n")

	if os.WriteFile("/etc/systemd/system/"+systemdUnit, []byte(unit), 0o644) == nil {
		sh("systemctl daemon-reload && systemctl enable " + systemdUnit + " && systemctl start " + systemdUnit)
		logLine("Installed (systemd service).")
		return
	}
	// Not root — try a user service.
	home, _ := os.UserHomeDir()
	userDir := filepath.Join(home, ".config", "systemd", "user")
	if os.MkdirAll(userDir, 0o755) == nil && os.WriteFile(filepath.Join(userDir, systemdUnit), []byte(unit), 0o644) == nil {
		sh("systemctl --user daemon-reload && systemctl --user enable " + systemdUnit + " && systemctl --user start " + systemdUnit)
		logLine("Installed (systemd user service).")
		return
	}
	// Last resort — crontab @reboot.
	sh("(crontab -l 2>/dev/null | grep -v 'aiops-agent'; echo '@reboot " + exe + " --run') | crontab -")
	logLine("Installed (crontab @reboot).")
}

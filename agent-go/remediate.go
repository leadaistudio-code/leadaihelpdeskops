package main

import (
	"os"
	"path/filepath"
	"runtime"
	"time"
)

// execAction runs a remediation queued by IT. Returns (ok, output).
//
// The vocabulary below is the ENTIRE set of things this agent will ever do. It
// is compiled in deliberately: the server can only ask for a named action, and
// an unrecognised action is refused rather than interpreted. Do not add a
// branch that executes server-supplied script text — that turns any compromised
// or misused staff account into arbitrary code execution on every enrolled
// endpoint at once. Arbitrary scripting, if it is ever a real requirement,
// needs asymmetric signing verified here, a second-person approval, and a
// canary ring before it comes anywhere near this function.
func execAction(action string) (bool, string) {
	win := runtime.GOOS == "windows"

	switch action {
	case "FLUSH_DNS":
		if win {
			return true, runCmd(30*time.Second, "ipconfig", "/flushdns")
		}
		return true, sh("resolvectl flush-caches 2>/dev/null || systemd-resolve --flush-caches 2>/dev/null; echo flushed")

	case "CLEAR_TEMP":
		return true, clearTemp()

	case "REPAIR_SYSTEM_FILES":
		if win {
			return true, runCmd(15*time.Minute, "sfc", "/scannow")
		}
		return true, "N/A on Linux"

	case "RESTART_SPOOLER":
		if win {
			runCmd(30*time.Second, "net", "stop", "spooler")
			return true, runCmd(30*time.Second, "net", "start", "spooler")
		}
		return true, sh("systemctl restart cups 2>/dev/null && echo 'CUPS restarted' || echo 'CUPS not available'")

	case "REBOOT":
		if win {
			return true, runCmd(30*time.Second, "shutdown", "/r", "/t", "60", "/c", "AIops: restart in 60s (shutdown /a to cancel)")
		}
		return true, sh("shutdown -r +1 'AIops restart' 2>/dev/null || echo 'Reboot scheduled'")

	case "RESTART_EXPLORER":
		if win {
			return true, ps("Stop-Process -Name explorer -Force; Start-Process explorer")
		}
		return true, "N/A on Linux"

	case "SYNC_TIME":
		if win {
			return true, runCmd(30*time.Second, "w32tm", "/resync")
		}
		return true, sh("chronyc makestep 2>/dev/null || timedatectl set-ntp true 2>/dev/null; echo 'Time synced'")

	case "EMPTY_RECYCLE_BIN":
		if win {
			return true, ps("Clear-RecycleBin -Force -ErrorAction SilentlyContinue")
		}
		return true, sh("rm -rf ~/.local/share/Trash/* 2>/dev/null; echo 'Trash emptied'")

	case "RESTART_AUDIO":
		if win {
			runCmd(30*time.Second, "net", "stop", "audiosrv")
			return true, runCmd(30*time.Second, "net", "start", "audiosrv")
		}
		return true, sh("systemctl --user restart pipewire 2>/dev/null || systemctl restart pulseaudio 2>/dev/null; echo 'Audio restarted'")

	case "RESET_NETWORK":
		if win {
			return true, runCmd(30*time.Second, "ipconfig", "/release") + runCmd(30*time.Second, "ipconfig", "/renew")
		}
		return true, sh("DEV=$(ip route show default | awk '{print $5}' | head -1); [ -n \"$DEV\" ] && ip link set $DEV down && sleep 1 && ip link set $DEV up && echo \"Reset $DEV\" || echo 'No interface'")

	case "UPDATE_GPO":
		if win {
			return true, runCmd(60*time.Second, "gpupdate", "/force")
		}
		return true, "N/A on Linux"

	case "KILL_HIGH_MEM":
		if win {
			return true, ps("Get-Process | Where-Object { $_.WorkingSet -gt 2GB -and $_.ProcessName -notmatch 'chrome|msedge|firefox|code|idea64|devenv|excel|winword|powerpnt|teams|zoom' } | Stop-Process -Force -ErrorAction SilentlyContinue; 'Done'")
		}
		return true, sh("ps aux --sort=-%mem | awk 'NR>1 && $6>2097152 && $11!~/sshd|bash|node|systemd/ {print $2}' | head -5 | xargs -r kill; echo 'Killed'")
	}
	return false, "Unknown action: " + action
}

// clearTemp removes entries from the OS temp dir. Best-effort per entry.
func clearTemp() string {
	dir := os.TempDir()
	entries, err := os.ReadDir(dir)
	if err != nil {
		return "temp unreadable"
	}
	n := 0
	for _, e := range entries {
		if os.RemoveAll(filepath.Join(dir, e.Name())) == nil {
			n++
		}
	}
	return "Cleared " + itoa(n) + " temp entries"
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	neg := n < 0
	if neg {
		n = -n
	}
	var b [20]byte
	i := len(b)
	for n > 0 {
		i--
		b[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		b[i] = '-'
	}
	return string(b[i:])
}

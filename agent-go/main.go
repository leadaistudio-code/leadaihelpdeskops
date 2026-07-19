// AIops Agent (LeadAIStudio) — native Go rewrite.
//
// A tiny single binary that streams real endpoint telemetry to the AIOps
// dashboard and runs IT-queued remediations. Windows shows a system-tray icon;
// Linux runs headless (systemd/EC2 fleets).
//
// Usage:
//   aiops-agent --install --server=https://app --token=enr_xxx [--interval=30]
//   aiops-agent --run          (used by the scheduled task / service)
//   aiops-agent --uninstall
//   aiops-agent                (double-click: uses sidecar config, then runs)
package main

import (
	"fmt"
	"os"
	"sync"
)

const agentVersion = "2.0.0"

// Live state shared with the tray.
var (
	stateMu    sync.Mutex
	paused     bool
	statusText = "Starting…"
	statusOk   bool
)

func setStatus(text string, ok bool) {
	stateMu.Lock()
	statusText, statusOk = text, ok
	stateMu.Unlock()
	trayRefresh()
}

func getPaused() bool {
	stateMu.Lock()
	defer stateMu.Unlock()
	return paused
}

func togglePause() {
	stateMu.Lock()
	paused = !paused
	stateMu.Unlock()
	trayRefresh()
}

func main() {
	args := parseArgs(os.Args[1:])

	if args["version"] != "" {
		fmt.Println("AIops Agent (Go) " + agentVersion)
		return
	}
	if args["uninstall"] != "" {
		uninstall()
		fmt.Println("Uninstalled.")
		return
	}

	cfg := resolveConfig(args)

	if args["install"] != "" {
		if cfg.Server == "" || cfg.Token == "" {
			fmt.Println("Need --server and --token to install.")
			os.Exit(1)
		}
		silentInstall(cfg)
		fmt.Println("Installed. The agent will run at every logon.")
		return
	}

	if cfg.Server == "" || cfg.Token == "" {
		logLine("Missing server/token")
		fmt.Println("Missing config. Run:\n  aiops-agent --install --server=https://your-app --token=enr_xxxxxxxx")
		return
	}

	// A plain double-click (no --run from the scheduler) registers autostart
	// first, so the agent survives a logoff.
	if args["run"] == "" {
		firstRunSetup(cfg)
	}

	runAgent(cfg) // platform-specific: tray on Windows, headless on Linux.
}

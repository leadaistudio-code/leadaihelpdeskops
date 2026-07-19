//go:build windows

package main

import (
	"os"
	"os/exec"

	"fyne.io/systray"
)

var (
	mStatus *systray.MenuItem
	mPause  *systray.MenuItem
)

// runAgent starts the report loop in the background and shows the tray (blocks).
func runAgent(cfg Config) {
	go reportForever(cfg, getPaused, setStatus)
	systray.Run(func() { onReady(cfg) }, func() {})
}

func onReady(cfg Config) {
	systray.SetIcon(trayIcon())
	systray.SetTitle("")
	systray.SetTooltip("LeadAIStudio DEX Agent")

	mStatus = systray.AddMenuItem("Starting…", "Agent status")
	mStatus.Disable()
	systray.AddSeparator()
	mDash := systray.AddMenuItem("Open Dashboard", "Open the AIOps dashboard")
	mLogs := systray.AddMenuItem("View Logs", "Open the agent log")
	mPause = systray.AddMenuItem("Pause reporting", "Pause/resume telemetry")
	systray.AddSeparator()
	mQuit := systray.AddMenuItem("Quit", "Stop the agent")

	go func() {
		for {
			select {
			case <-mDash.ClickedCh:
				openExternal(cfg.Server)
			case <-mLogs.ClickedCh:
				openExternal(logFile())
			case <-mPause.ClickedCh:
				togglePause()
			case <-mQuit.ClickedCh:
				systray.Quit()
				os.Exit(0)
			}
		}
	}()
	trayRefresh()
}

// trayRefresh mirrors the live status into the tray menu.
func trayRefresh() {
	if mStatus == nil {
		return
	}
	stateMu.Lock()
	t, p := statusText, paused
	stateMu.Unlock()
	mStatus.SetTitle(t)
	if mPause != nil {
		if p {
			mPause.SetTitle("Resume reporting")
		} else {
			mPause.SetTitle("Pause reporting")
		}
	}
}

func openExternal(target string) {
	cmd := exec.Command("cmd", "/c", "start", "", target)
	hideWindow(cmd)
	_ = cmd.Start()
}

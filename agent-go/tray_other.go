//go:build !windows

package main

// Non-Windows fleets (Linux/EC2 servers) run headless — no tray. runAgent just
// runs the report loop, which blocks forever.
func runAgent(cfg Config) {
	reportForever(cfg, getPaused, setStatus)
}

func trayRefresh() {}

# AIops Agent — native Go rewrite

A tiny single-binary endpoint agent that streams **real** telemetry to the
LeadAIStudio AIOps dashboard and runs IT-queued remediations. Replaces the old
Electron/Node build (99 MB installer / 67 MB exe) with a stripped Go binary
(~6–9 MB, or ~3–4 MB after UPX).

> **Status: unbuilt.** This was written without a Go toolchain in the authoring
> environment, so it has **not been compiled or run**. Build it (below), fix any
> compile nits `go build` surfaces, then test against a dev tenant before you
> swap the download over. The old JS agent in `../agent/` still works as a
> fallback until then.

## Why it's smaller
The old agent bundled a whole Chromium (Electron) just to draw a tray icon and a
status popup. This version is native Go: the Windows tray uses the pure-Go
`fyne.io/systray` (no C compiler needed), and Linux runs headless (systemd/EC2).
There is no runtime to ship — just the binary.

## What it collects (real, not placeholder)
`gopsutil` provides real cross-platform CPU / memory / disk / uptime / network
throughput / top processes / temperatures. Platform code adds the rest:

- **Fixed fakes:** real WiFi SSID + signal via `netsh` / `iwgetid` (was hardcoded
  `"Corp-Wifi"`), real packet loss + gateway RTT by pinging the default gateway
  (was `Math.random()`). Dropped the random `persona` and random survey spam.
- **New in `extendedInfo`:** top processes by memory, network send/recv Kbps,
  gateway RTT, available memory, swap %, disk free/total GB, OS/kernel version,
  process count, GPU, drives, running-service count.
- **Unchanged sub-polls:** security posture, app crashes / BSOD, software usage,
  boot time, hardware health — same endpoints and cadence as the old agent.

The server stores the extra fields in `DeviceMetric.extendedInfo` (a JSON blob),
so no server schema change is required to start capturing them. Surfacing them in
the DEX UI is a separate follow-up.

## Build
```powershell
# Windows (PowerShell). Requires Go 1.22+.
cd agent-go
./build.ps1        # → dist/aiops-agent.exe  and  dist/aiops-agent-linux
```
```bash
# or by hand
go mod tidy
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -trimpath -ldflags "-s -w -H=windowsgui" -o dist/aiops-agent.exe .
CGO_ENABLED=0 GOOS=linux   GOARCH=amd64 go build -trimpath -ldflags "-s -w"               -o dist/aiops-agent-linux .
```

## Run / install
```
aiops-agent --install --server=https://your-app --token=enr_xxxxxxxx [--interval=30]
aiops-agent --uninstall
aiops-agent                 # double-click: reads aiops-agent.config.json sidecar, then runs
```
Windows: registers a logon scheduled task + shows a tray icon (status, open
dashboard, view logs, pause, quit). Linux: installs a systemd service (or user
service / crontab fallback) and runs headless.

## Wiring it into the app (after you've built + tested)
The download route (`src/app/api/agent/download/route.ts`) currently serves
`agent/dist/aiops-agent.exe`. Point it at the new `agent-go/dist/aiops-agent.exe`
once you're happy with it.

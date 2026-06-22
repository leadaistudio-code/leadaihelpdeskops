# AIops Agent (LeadAIStudio)

A lightweight endpoint agent that runs in the **Windows system tray**, enrolls
the device with your tenant, and streams **real** telemetry (CPU, memory, disk,
battery, uptime, latency) to the AIOps dashboard — and runs IT-queued
remediations. It's a standalone **`aiops-agent.exe`** (the Node runtime is
embedded; nothing else to install) and runs **windowless** (no console).

## Install on a laptop (zero-touch)

From **DEX → Enroll a device** (admins), click **Download AIops Agent
(setup.zip)** — a ZIP containing `aiops-agent.exe` + `aiops-agent.config.json`
(your server URL + token baked in).

1. Unzip on the laptop (keep both files together).
2. Double-click `aiops-agent.exe`.

It runs silently in the **system tray** — right-click the icon for **status**,
**view logs**, **open dashboard**, **pause**, or **quit**. It auto-starts on
logon and adds a Desktop shortcut. Remove it with `aiops-agent.exe --uninstall`.

Logs are written to `%LOCALAPPDATA%\leadaistudio-dex\agent.log`.

## Silent deploy (RMM / Intune)

```bat
aiops-agent.exe --install --server="https://your-app.com" --token="enr_xxxxxxxx"
```

Registers a hidden logon task (no tray, fully background). Or run from source on
a machine with Node 18+:

```bash
node src/dex-agent.cjs --server="https://your-app.com" --token="enr_xxxxxxxx"
```

## How it works

1. **Enroll** — the agent presents your tenant's **enrollment token** to
   `POST /api/agent/enroll` and receives a unique, secret **device key**
   (stored locally; the token is not reused after that).
2. **Report** — every ~30s it posts a metrics sample to
   `POST /api/agent/metrics`, authenticated with `Authorization: Bearer <deviceKey>`.
3. The device appears live on the DEX dashboard for your tenant and goes
   **offline** automatically if it stops reporting for 2 minutes.

## Building the .exe yourself

The exe is a build artifact (not committed). To produce it:

```bash
cd agent
npm install
npm run build          # → dist/dex-agent.exe   (Windows x64)
npm run build:all      # → win + macOS + Linux binaries
```

This bundles [`src/dex-agent.cjs`](src/dex-agent.cjs) with the Node runtime via
`@yao-pkg/pkg`. The source is plain Node (no native deps), so it's easy to audit.

## From source (no .exe)

If you'd rather run from source on a machine that already has Node 18+:

```bash
node src/dex-agent.cjs --server="https://your-app.com" --token="enr_xxxxxxxx"
```

## Going to production (MSI + fleet rollout)

`dex-agent.exe --install` already gives a real, no-admin background install. For
a managed fleet you'd typically wrap the exe in an **MSI** (WiX) and deploy via
**Intune / Jamf / Group Policy / your RMM**, passing the enrollment token as an
install parameter, and run it as a **Windows service** instead of a logon task.
The enrollment + ingest API and dashboard are already production-shaped
(per-device keys, tenant scoping, rate limiting); only packaging and fleet
deployment are environment-specific.

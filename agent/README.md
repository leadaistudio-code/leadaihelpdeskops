# AIops Agent (LeadAIStudio)

A lightweight endpoint agent that runs in the **Windows system tray** or as a
**headless Linux daemon**, enrolls the device with your tenant, and streams
**real** telemetry (CPU, memory, disk, battery, uptime, latency, security,
crashes, hardware health) to the AIOps dashboard — and runs IT-queued
remediations. It's a standalone **`aiops-agent.exe`** on Windows (the Node
runtime is embedded; nothing else to install) and runs **windowless** (no
console). On Linux it runs as a **systemd service** or from source.

## Quick start — Windows laptop (zero-touch)

From **DEX → Enroll a device** (admins), click **Download AIops Agent
(setup.zip)** — a ZIP containing `aiops-agent.exe` + `aiops-agent.config.json`
(your server URL + token baked in).

1. Unzip on the laptop (keep both files together).
2. Double-click `aiops-agent.exe`.

It runs silently in the **system tray** — right-click the icon for **status**,
**view logs**, **open dashboard**, **pause**, or **quit**. It auto-starts on
logon and adds a Desktop shortcut. Remove it with `aiops-agent.exe --uninstall`.

Logs are written to `%LOCALAPPDATA%\leadaistudio-dex\agent.log`.

## Quick start — Linux / AWS EC2

### From source (Node 18+ required)

```bash
# SSH into the EC2 instance, then:
node src/telemetry.cjs --server="https://your-app.com" --token="enr_xxxxxxxx"
```

### Silent install (runs as a systemd service)

```bash
# As root — installs a system-wide service
node src/telemetry.cjs --install --server="https://your-app.com" --token="enr_xxxxxxxx"

# As non-root — installs a user-level systemd service (falls back to crontab)
node src/telemetry.cjs --install --server="https://your-app.com" --token="enr_xxxxxxxx"
```

The agent auto-enrolls, then reports every 30 seconds. It appears on your DEX
dashboard alongside Windows devices.

Logs are written to `~/.leadaistudio-dex/agent.log`.

To uninstall:

```bash
node src/telemetry.cjs --uninstall
```

### Fleet deployment (User Data / Ansible / SSM)

Add to your EC2 **User Data** script for automatic enrollment on launch:

```bash
#!/bin/bash
# Install Node.js (if not present)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Download and install the agent
cd /opt
git clone https://your-repo.com/agent.git aiops-agent
cd aiops-agent
node src/telemetry.cjs --install \
  --server="https://your-helpdesk.com" \
  --token="enr_xxxxxxxx"
```

Or via **AWS Systems Manager Run Command**:

```bash
node /opt/aiops-agent/src/telemetry.cjs --install \
  --server="https://your-helpdesk.com" \
  --token="enr_xxxxxxxx"
```

## Silent deploy — Windows (RMM / Intune)

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

## Telemetry collected

| Category | Windows | Linux / EC2 |
|---|---|---|
| **CPU, memory, uptime** | `os` module (cross-platform) | `os` module (cross-platform) |
| **Disk usage** | `fs.statfsSync` | `fs.statfsSync` |
| **Disk health** | `Get-PhysicalDisk` | `smartctl` / `dmesg` I/O errors |
| **Battery** | `Win32_Battery` WMI | `/sys/class/power_supply/BAT0` |
| **Network latency** | HTTP HEAD to server | HTTP HEAD to server |
| **WiFi** | Demo values | `iwgetid` / `/proc/net/wireless` |
| **Extended info** | GPU, drives, gateway, services via WMI | `lspci`, `df`, `ip route`, `systemctl` |
| **Security** | Firewall, Defender, BitLocker | `ufw`/`iptables`, AV daemons, LUKS |
| **Boot time** | Windows Diagnostics events | `systemd-analyze` |
| **Software** | Running windowed processes | `ps` process list |
| **Crashes** | Event Log (App crashes, BSODs) | `journalctl` (panics, OOM, segfaults) |
| **Hardware** | Physical disk + battery WMI | `smartctl`, `dmesg` (disk/mem/thermal) |
| **Remediations** | PowerShell + native commands | Bash + `systemctl` + native commands |

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

On Linux, `--install` creates a **systemd service** automatically. For managed
EC2 fleets, embed the install command in your **AMI**, **User Data**, or push
via **AWS SSM Run Command** / **Ansible**.

The enrollment + ingest API and dashboard are already production-shaped
(per-device keys, tenant scoping, rate limiting); only packaging and fleet
deployment are environment-specific.

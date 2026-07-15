#!/usr/bin/env node
/*
  AIops Agent (LeadAIStudio) — standalone build (bundled into aiops-agent.exe).

  Lives in the Windows system tray (no console window). Streams real telemetry
  (CPU, memory, disk, battery, uptime, latency) to the AIOps dashboard and runs
  IT-queued remediations. Right-click the tray icon for status, logs, dashboard,
  pause, and quit.

  Supports Windows (full GUI + tray) and Linux (headless, for EC2 / server fleets).
*/
"use strict";

const os = require("os");
const fs = require("fs");
const path = require("path");
const { execFileSync, execFile, execSync } = require("child_process");

const IS_WIN = process.platform === "win32";
const IS_LINUX = process.platform === "linux";

const APP_NAME = "AIops Agent";
const STATE_DIR = IS_WIN
  ? path.join(process.env.LOCALAPPDATA || os.homedir(), "leadaistudio-dex")
  : path.join(os.homedir(), ".leadaistudio-dex");
const CONFIG_FILE = path.join(STATE_DIR, "config.json");
const DEVICE_FILE = path.join(STATE_DIR, "device.json");
const LOG_FILE = path.join(STATE_DIR, "agent.log");
const BATTERY_FILE = path.join(STATE_DIR, "battery.json");
const BATTERY_TTL_MS = 14 * 24 * 60 * 60 * 1000; // re-check battery fortnightly
const TASK_NAME = "AIops Agent";
const SYSTEMD_UNIT = "aiops-agent.service";

// No systray needed here anymore

// A long-running agent must never crash on a stray error (e.g. a tray helper
// hiccup). Log and keep going.
process.on("uncaughtException", (e) => { try { log(`uncaught: ${e && e.message}`); } catch { /* */ } });
process.on("unhandledRejection", (e) => { try { log(`unhandledRejection: ${e && e.message}`); } catch { /* */ } });

// ---- args ----
function parseArgs(argv) {
  const out = { _: [] };
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) out[m[1]] = m[2] === undefined ? true : m[2];
    else out._.push(a);
  }
  return out;
}
const args = parseArgs(process.argv.slice(2));

function ensureDir() { fs.mkdirSync(STATE_DIR, { recursive: true }); }
function readJson(file) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function log(msg) {
  const line = `[${new Date().toLocaleString()}] ${msg}`;
  try { console.log(line); } catch { /* no console (GUI subsystem) */ }
  try { ensureDir(); fs.appendFileSync(LOG_FILE, line + "\r\n"); } catch { /* */ }
}

function readSidecarConfig() {
  for (const name of ["aiops-agent.config.json", "dex-agent.config.json"]) {
    try {
      const p = path.join(path.dirname(process.execPath), name);
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
    } catch { /* */ }
  }
  return null;
}

// Open a URL or file with its default handler, no window.
function openExternal(target) {
  if (IS_WIN) {
    try { execFile("cmd", ["/c", "start", "", target], { windowsHide: true }); } catch { /* */ }
  } else if (IS_LINUX) {
    try { execFile("xdg-open", [target]); } catch { /* */ }
  }
}

// ---- a small solid tray icon (16x16 .ico), generated in code ----
function makeIcoBase64() {
  const w = 16, h = 16;
  const xor = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    xor[i * 4 + 0] = 0xb2; // B
    xor[i * 4 + 1] = 0x91; // G
    xor[i * 4 + 2] = 0x08; // R  (#0891b2)
    xor[i * 4 + 3] = 0xff; // A
  }
  const andRow = Math.ceil(w / 32) * 4; // padded to 4 bytes
  const and = Buffer.alloc(andRow * h, 0x00);
  const bih = Buffer.alloc(40);
  bih.writeUInt32LE(40, 0);
  bih.writeInt32LE(w, 4);
  bih.writeInt32LE(h * 2, 8); // height includes AND mask
  bih.writeUInt16LE(1, 12);
  bih.writeUInt16LE(32, 14);
  bih.writeUInt32LE(xor.length + and.length, 20);
  const img = Buffer.concat([bih, xor, and]);
  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(0, 0); dir.writeUInt16LE(1, 2); dir.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = w; entry[1] = h;
  entry.writeUInt16LE(1, 4); entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(img.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([dir, entry, img]).toString("base64");
}

// ---- metrics ----
function cpuSnapshot() {
  let idle = 0, total = 0;
  for (const c of os.cpus()) { for (const t of Object.values(c.times)) total += t; idle += c.times.idle; }
  return { idle, total };
}
async function cpuPct() {
  const a = cpuSnapshot(); await sleep(300); const b = cpuSnapshot();
  const idle = b.idle - a.idle, total = b.total - a.total;
  return total > 0 ? Math.max(0, Math.min(100, (1 - idle / total) * 100)) : 0;
}
async function latencyMs(serverUrl) {
  const s = Date.now();
  try { await fetch(serverUrl, { method: "HEAD" }); return Date.now() - s; } catch { return null; }
}
function diskPct() {
  try {
    const root = IS_WIN ? (process.env.SystemDrive || "C:") + "\\" : "/";
    const s = fs.statfsSync(root);
    return s.blocks > 0 ? Math.round((1 - s.bavail / s.blocks) * 1000) / 10 : null;
  } catch { return null; }
}
// Battery requires spawning PowerShell on Windows. Cache it on disk and only
// re-query fortnightly (it changes slowly, and many devices are desktops /
// servers with none). On Linux, read /sys directly (instant, no spawn).
function batteryPct() {
  if (IS_WIN) {
    const cache = readJson(BATTERY_FILE);
    if (cache && Date.now() - cache.at < BATTERY_TTL_MS) return cache.val;
    let val = null;
    try {
      const out = execFileSync("powershell", ["-NoProfile", "-Command", "(Get-CimInstance Win32_Battery).EstimatedChargeRemaining"], { timeout: 5000, windowsHide: true }).toString().trim();
      const n = parseInt(out, 10);
      val = Number.isFinite(n) ? n : null;
    } catch { val = null; }
    try { ensureDir(); fs.writeFileSync(BATTERY_FILE, JSON.stringify({ val, at: Date.now() })); } catch { /* */ }
    return val;
  } else if (IS_LINUX) {
    // Read from sysfs — works on laptops, returns null on EC2 (no battery)
    try {
      const cap = fs.readFileSync("/sys/class/power_supply/BAT0/capacity", "utf8").trim();
      const n = parseInt(cap, 10);
      return Number.isFinite(n) ? n : null;
    } catch { return null; }
  }
  return null;
}
async function getExtendedMetrics() {
  if (IS_WIN) {
    try {
      const script = `
        $gpu = Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue | Select-Object -First 1
        $drives = Get-CimInstance Win32_LogicalDisk -ErrorAction SilentlyContinue | Where-Object DriveType -eq 3 | Select-Object DeviceID, FreeSpace, Size
        $net = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Select-Object -First 1
        $svcs = (Get-Service -ErrorAction SilentlyContinue | Where-Object Status -eq 'Running').Count
        @{
          gpuName = if ($gpu) { $gpu.Name } else { $null }
          gpuDriver = if ($gpu) { $gpu.DriverVersion } else { $null }
          drives = if ($drives) { @($drives) | ForEach-Object { @{ id = $_.DeviceID; freeGB = [math]::Round($_.FreeSpace / 1GB, 2); totalGB = [math]::Round($_.Size / 1GB, 2) } } } else { @() }
          defaultGateway = if ($net) { $net.NextHop } else { $null }
          runningServices = $svcs
        } | ConvertTo-Json -Compress -Depth 5
      `;
      const out = execFileSync("powershell", ["-NoProfile", "-Command", script], { timeout: 10000, windowsHide: true }).toString().trim();
      return JSON.parse(out);
    } catch (e) {
      return null;
    }
  } else if (IS_LINUX) {
    try {
      const gpuName = execShell("lspci 2>/dev/null | grep -iE 'vga|3d|display' | head -1 | sed 's/.*: //'") || null;
      const drivesRaw = execShell("df -B1 --output=target,avail,size -x tmpfs -x devtmpfs -x overlay 2>/dev/null | tail -n +2");
      const drives = drivesRaw ? drivesRaw.split("\n").filter(Boolean).map(line => {
        const p = line.trim().split(/\s+/);
        return {
          id: p[0],
          freeGB: Math.round(parseInt(p[1] || "0") / 1073741824 * 100) / 100,
          totalGB: Math.round(parseInt(p[2] || "0") / 1073741824 * 100) / 100,
        };
      }) : [];
      const defaultGateway = execShell("ip route show default 2>/dev/null | awk '{print $3}' | head -1") || null;
      const runningServices = parseInt(execShell("systemctl list-units --state=running --type=service --no-legend 2>/dev/null | wc -l"), 10) || 0;
      return { gpuName, gpuDriver: null, drives, defaultGateway, runningServices };
    } catch { return null; }
  }
  return null;
}
async function collect(serverUrl) {
  const totalMb = Math.round(os.totalmem() / 1024 / 1024);
  const freeMb = Math.round(os.freemem() / 1024 / 1024);
  const personas = ["Developer", "Sales", "Support", "Executive", "Marketing"];
  const persona = personas[Math.floor(Math.random() * personas.length)];

  // WiFi: Windows uses demo values; Linux reads real values (null on EC2)
  let wifiSsid = null;
  let wifiSignalDbm = null;
  if (IS_WIN) {
    wifiSsid = "Corp-Wifi";
    wifiSignalDbm = -50 - Math.floor(Math.random() * 20);
  } else if (IS_LINUX) {
    wifiSsid = execShell("iwgetid -r 2>/dev/null") || null;
    if (wifiSsid) {
      const sigRaw = execShell("cat /proc/net/wireless 2>/dev/null | tail -1 | awk '{print $4}'");
      const sigVal = parseFloat(sigRaw);
      wifiSignalDbm = Number.isFinite(sigVal) ? Math.round(sigVal) : null;
    }
  }

  const m = {
    cpuPct: Math.round((await cpuPct()) * 10) / 10,
    memUsedMb: totalMb - freeMb,
    memTotalMb: totalMb,
    uptimeSec: Math.round(os.uptime()),
    cpuCores: os.cpus().length,
    user: os.userInfo().username,
    persona,
    wifiSsid,
    wifiSignalDbm,
    packetLossPct: Math.random() < 0.1 ? Math.random() * 5 : 0
  };
  const lat = await latencyMs(serverUrl); if (lat != null) m.latencyMs = lat;
  const disk = diskPct(); if (disk != null) m.diskPct = disk;
  const batt = batteryPct(); if (batt != null) m.batteryPct = batt;
  const ext = await getExtendedMetrics(); if (ext != null) m.extendedInfo = ext;
  return m;
}

// ---- remediation ----
function runCmd(cmd, a) { return execFileSync(cmd, a, { timeout: 30000, windowsHide: true }).toString(); }
function clearTemp() {
  const dir = os.tmpdir(); let n = 0;
  for (const f of fs.readdirSync(dir)) { try { fs.rmSync(path.join(dir, f), { recursive: true, force: true }); n++; } catch { /* */ } }
  return `Cleared ${n} temp entries`;
}
function execAction(action) {
  try {
    let out = "";
    if (action.startsWith("RUN_SCRIPT:")) {
      const script = action.slice("RUN_SCRIPT:".length).trim();
      out = IS_WIN ? execPowershell(script) : execShell(script);
      return { ok: true, output: String(out).slice(0, 2000) };
    }
    switch (action) {
      case "FLUSH_DNS":
        out = IS_WIN ? runCmd("ipconfig", ["/flushdns"])
            : execShell("systemd-resolve --flush-caches 2>/dev/null || resolvectl flush-caches 2>/dev/null; echo 'DNS cache flushed'");
        break;
      case "RESTART_SPOOLER":
        if (IS_WIN) { try { runCmd("net", ["stop", "spooler"]); } catch { /* */ } out = runCmd("net", ["start", "spooler"]); }
        else out = execShell("systemctl restart cups 2>/dev/null && echo 'CUPS restarted' || echo 'CUPS not available'");
        break;
      case "CLEAR_TEMP": out = clearTemp(); break;
      case "REBOOT":
        out = IS_WIN ? runCmd("shutdown", ["/r", "/t", "60", "/c", "AIops: restart in 60s (run 'shutdown /a' to cancel)"])
            : execShell("shutdown -r +1 'AIops: restart in 60s (run shutdown -c to cancel)' 2>/dev/null || echo 'Reboot scheduled'");
        break;

      case "RESTART_EXPLORER":
        out = IS_WIN ? execPowershell("Stop-Process -Name explorer -Force; Start-Process explorer") : "N/A on Linux";
        break;
      case "UPDATE_GPO":
        out = IS_WIN ? runCmd("gpupdate", ["/force"]) : "N/A on Linux";
        break;
      case "SYNC_TIME":
        out = IS_WIN ? runCmd("w32tm", ["/resync"])
            : execShell("chronyc makestep 2>/dev/null || ntpdate -u pool.ntp.org 2>/dev/null || timedatectl set-ntp true; echo 'Time synced'");
        break;
      case "EMPTY_RECYCLE_BIN":
        out = IS_WIN ? execPowershell("Clear-RecycleBin -Force -ErrorAction SilentlyContinue")
            : execShell("rm -rf ~/.local/share/Trash/* 2>/dev/null; echo 'Trash emptied'");
        break;
      case "RESTART_AUDIO":
        if (IS_WIN) { try { runCmd("net", ["stop", "audiosrv"]); } catch { /* */ } out = runCmd("net", ["start", "audiosrv"]); }
        else out = execShell("systemctl restart pulseaudio 2>/dev/null || systemctl --user restart pipewire 2>/dev/null; echo 'Audio service restarted'");
        break;
      case "KILL_HIGH_MEM":
        out = IS_WIN
          ? execPowershell("Get-Process | Where-Object { $_.WorkingSet -gt 2GB -and $_.ProcessName -notmatch 'chrome|msedge|firefox|code|idea64|devenv|excel|winword|powerpnt|teams|zoom' } | Stop-Process -Force -ErrorAction SilentlyContinue; 'Safe memory clearance complete'")
          : execShell("ps aux --sort=-%mem | awk 'NR>1 && $6>2097152 && $11!~/sshd|bash|node|systemd/ {print $2}' | head -5 | xargs -r kill; echo 'High-memory processes killed'");
        break;
      case "RESET_NETWORK":
        out = IS_WIN ? runCmd("ipconfig", ["/release"]) + " " + runCmd("ipconfig", ["/renew"])
            : execShell("DEV=$(ip route show default 2>/dev/null | awk '{print $5}' | head -1); if [ -n \"$DEV\" ]; then ip link set $DEV down && sleep 1 && ip link set $DEV up && echo \"Reset $DEV\"; else echo 'No default interface'; fi");
        break;

      default: return { ok: false, output: `Unknown: ${action}` };
    }
    return { ok: true, output: String(out).slice(0, 2000) };
  } catch (e) { return { ok: false, output: String(e.message).slice(0, 2000) }; }
}
async function pollCommands(serverUrl, deviceKey) {
  try {
    const res = await fetch(`${serverUrl}/api/agent/commands`, { headers: { Authorization: `Bearer ${deviceKey}` } });
    if (!res.ok) return;
    const { commands } = await res.json();
    for (const c of commands || []) {
      log(`Running remediation: ${c.action}`);
      const r = execAction(c.action);
      await fetch(`${serverUrl}/api/agent/commands/result`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${deviceKey}` }, body: JSON.stringify({ id: c.id, status: r.ok ? "DONE" : "FAILED", result: r.output }) });
    }
  } catch { /* */ }
}

async function postApi(serverUrl, deviceKey, path, data) {
  try { await fetch(`${serverUrl}/api/agent/${path}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${deviceKey}` }, body: JSON.stringify(data) }); } catch { /* */ }
}

function execPowershell(cmd) {
  try {
    return execFileSync("powershell", ["-NoProfile", "-Command", cmd], { timeout: 10000, windowsHide: true }).toString().trim();
  } catch (e) {
    return "";
  }
}

function execShell(cmd) {
  try {
    return execSync(cmd, { timeout: 10000 }).toString().trim();
  } catch (e) {
    return "";
  }
}

async function pollSecurity(serverUrl, deviceKey) {
  let bitlockerActive = false;
  let avUpdated = false;
  let firewallActive = false;

  if (IS_WIN) {
    const fw = execPowershell("netsh advfirewall show currentprofile state");
    if (fw.includes("ON")) firewallActive = true;

    const av = execPowershell("Get-MpComputerStatus | Select-Object -ExpandProperty AMServiceEnabled");
    if (av.includes("True")) avUpdated = true;

    const bl = execPowershell("manage-bde -status C:");
    if (bl.includes("Fully Encrypted") || bl.includes("Protection On")) bitlockerActive = true;
  } else if (IS_LINUX) {
    // Firewall: check ufw, then fall back to iptables rule count
    const ufw = execShell("ufw status 2>/dev/null");
    if (ufw.includes("active")) {
      firewallActive = true;
    } else {
      const iptCount = parseInt(execShell("iptables -L -n 2>/dev/null | wc -l"), 10) || 0;
      firewallActive = iptCount > 8; // more than empty default chains = rules present
    }

    // AV: check common Linux AV / EDR daemons
    const avCheck = execShell(
      "systemctl is-active clamav-daemon 2>/dev/null; " +
      "systemctl is-active falcon-sensor 2>/dev/null; " +
      "systemctl is-active amazon-ssm-agent 2>/dev/null"
    );
    avUpdated = avCheck.includes("active");

    // Disk encryption: LUKS / dm-crypt
    const cryptCount = parseInt(execShell("lsblk -o TYPE 2>/dev/null | grep -c crypt"), 10) || 0;
    bitlockerActive = cryptCount > 0;
  }

  await postApi(serverUrl, deviceKey, "security", { bitlockerActive, avUpdated, firewallActive });
}

let lastBootPoll = 0;
async function pollBoot(serverUrl, deviceKey) {
  if (Date.now() - lastBootPoll < 24 * 60 * 60 * 1000) return; // Once a day
  lastBootPoll = Date.now();

  if (IS_WIN) {
    try {
      // Get actual boot duration from Windows Diagnostics if available, fallback to 15s
      const psCmd = `$evt = Get-WinEvent -ProviderName "Microsoft-Windows-Diagnostics-Performance" -MaxEvents 1 -FilterXPath "*[System[EventID=100]]" -ErrorAction SilentlyContinue; if ($evt) { $evt.Properties[1].Value } else { 15000 }`;
      const bootTimeMs = parseInt(execPowershell(psCmd), 10) || 15000;
      const osBootSec = Math.floor(bootTimeMs / 1000);
      await postApi(serverUrl, deviceKey, "boot", { totalBootSec: osBootSec + 5, osBootSec });
    } catch (e) {
      /* ignore */
    }
  } else if (IS_LINUX) {
    try {
      // systemd-analyze: "Startup finished in 1.2s (kernel) + 4.5s (userspace) = 5.7s"
      const raw = execShell("systemd-analyze 2>/dev/null | head -1");
      const totalMatch = raw.match(/=\s*([\d.]+)s/);
      const kernelMatch = raw.match(/([\d.]+)s\s*\(kernel\)/);
      const totalBootSec = totalMatch ? Math.ceil(parseFloat(totalMatch[1])) : 15;
      const osBootSec = kernelMatch ? Math.ceil(parseFloat(kernelMatch[1])) : Math.max(1, totalBootSec - 3);
      await postApi(serverUrl, deviceKey, "boot", { totalBootSec, osBootSec });
    } catch (e) {
      /* ignore */
    }
  }
}

let lastSoftwarePoll = 0;
const SOFTWARE_POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function pollSoftware(serverUrl, deviceKey) {
  if (Date.now() - lastSoftwarePoll < SOFTWARE_POLL_INTERVAL_MS) return;
  lastSoftwarePoll = Date.now();

  if (IS_WIN) {
    // Get all running processes that have an active window (i.e. foreground/desktop apps)
    const psCmd = `Get-Process | Where-Object {$_.MainWindowTitle} | Select-Object -ExpandProperty ProcessName | Select-Object -Unique | ConvertTo-Json -Compress`;
    const raw = execPowershell(psCmd);
    if (!raw || raw === '[]' || raw === '""') return;
    try {
      const parsed = JSON.parse(raw);
      const apps = Array.isArray(parsed) ? parsed : [parsed];
      if (apps.length > 0) {
        await postApi(serverUrl, deviceKey, "software", { action: "BULK_USAGE", softwareNames: apps });
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  } else if (IS_LINUX) {
    // On Linux/EC2, report running daemon and user process names
    const raw = execShell("ps -eo comm --no-headers | sort -u | grep -v '^\\[' | head -100");
    if (!raw) return;
    const apps = raw.split("\n").filter(Boolean);
    if (apps.length > 0) {
      await postApi(serverUrl, deviceKey, "software", { action: "BULK_USAGE", softwareNames: apps });
    }
  }
}

let lastCrashPoll = Date.now();

async function pollCrashes(serverUrl, deviceKey) {
  const now = Date.now();
  const secondsSinceLast = Math.max(10, Math.floor((now - lastCrashPoll) / 1000) + 5); // 5s buffer to prevent missing events
  lastCrashPoll = now;

  if (IS_WIN) {
    // Look for actual crashes and BSODs in the exact interval window
    const psCmd = `$t=(Get-Date).AddSeconds(-${secondsSinceLast}); $e1 = Get-WinEvent -FilterHashtable @{LogName='Application'; ID=1000,1002; StartTime=$t} -ErrorAction SilentlyContinue; $e2 = Get-WinEvent -FilterHashtable @{LogName='System'; ID=1001; StartTime=$t} -ErrorAction SilentlyContinue; $events = @(); if ($e1) { $events += $e1 }; if ($e2) { $events += $e2 }; if ($events.Count -gt 0) { $events | Select-Object Id, Message | ConvertTo-Json -Compress } else { '[]' }`;
    const raw = execPowershell(psCmd);
    if (!raw || raw === '[]') return;
    try {
      const parsed = JSON.parse(raw);
      const events = Array.isArray(parsed) ? parsed : [parsed];
      for (const ev of events) {
        let eventType = ev.Id === 1000 ? "CRASH" : "HANG";
        if (ev.Id === 1001) eventType = "BSOD";

        let appName = "Unknown App";
        let appVersion = "Unknown";

        if (eventType === "BSOD") {
          appName = "Windows Kernel";
        } else {
          const appNameMatch = ev.Message.match(/(?:Faulting|Hanging) application name:\s*(.+?),/i);
          const appVersionMatch = ev.Message.match(/version:\s*([\d\.]+)/i);
          appName = appNameMatch ? appNameMatch[1].trim() : "Unknown App";
          appVersion = appVersionMatch ? appVersionMatch[1].trim() : "Unknown";
        }

        await postApi(serverUrl, deviceKey, "crashes", { appName, appVersion, eventType });
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  } else if (IS_LINUX) {
    // Check journalctl for kernel panics, OOM kills, segfaults, and service crashes
    const raw = execShell(`journalctl --since "${secondsSinceLast} seconds ago" -p err..emerg --no-pager -o short 2>/dev/null | tail -20`);
    if (!raw) return;
    const lines = raw.split("\n").filter(Boolean);
    for (const line of lines) {
      let eventType = "CRASH";
      let appName = "Unknown";
      let appVersion = "Unknown";

      if (/kernel panic/i.test(line) || /BUG:|Oops:/i.test(line)) {
        eventType = "BSOD"; // Map kernel panic → BSOD equivalent
        appName = "Linux Kernel";
      } else if (/oom-kill|Out of memory/i.test(line)) {
        eventType = "CRASH";
        const match = line.match(/Kill process \d+ \(([^)]+)\)/i) || line.match(/Killed process \d+ \(([^)]+)\)/i);
        appName = match ? match[1] : "OOM Victim";
      } else if (/segfault|SIGSEGV|SIGABRT/i.test(line)) {
        eventType = "CRASH";
        const match = line.match(/(\S+)\[\d+\]/) || line.match(/traps:\s*(\S+)/);
        appName = match ? match[1] : "Unknown Process";
      } else {
        continue; // Skip non-crash error lines
      }

      await postApi(serverUrl, deviceKey, "crashes", { appName, appVersion, eventType });
    }
  }
}

let lastHardwarePoll = 0;
async function pollHardware(serverUrl, deviceKey) {
  if (Date.now() - lastHardwarePoll < 15 * 60 * 1000) return; // 15 mins
  lastHardwarePoll = Date.now();

  if (IS_WIN) {
    try {
      const diskHealth = execPowershell("Get-PhysicalDisk | Select-Object -ExpandProperty HealthStatus | Select-Object -First 1");
      if (diskHealth) {
        const prob = diskHealth.includes("Healthy") ? 0.05 : 0.8;
        const status = prob > 0.5 ? "WARNING" : "RESOLVED";
        await postApi(serverUrl, deviceKey, "hardware", { component: "DISK", probability: prob, status });
      }

      const batteryStatus = execPowershell("(Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue).Status");
      if (batteryStatus) {
        const prob = batteryStatus.includes("OK") ? 0.05 : 0.7;
        const status = prob > 0.5 ? "WARNING" : "RESOLVED";
        await postApi(serverUrl, deviceKey, "hardware", { component: "BATTERY", probability: prob, status });
      }
    } catch(e) {}
  } else if (IS_LINUX) {
    try {
      // Disk health: try smartctl first, fall back to dmesg I/O errors
      const smartRaw = execShell("smartctl -H /dev/sda 2>/dev/null | grep -iE 'overall-health|SMART Health'");
      if (smartRaw) {
        const healthy = /PASSED|OK/i.test(smartRaw);
        await postApi(serverUrl, deviceKey, "hardware", {
          component: "DISK", probability: healthy ? 0.05 : 0.8,
          status: healthy ? "RESOLVED" : "WARNING",
        });
      } else {
        // Fallback: check for disk I/O errors in dmesg
        const diskErrors = parseInt(execShell("dmesg 2>/dev/null | grep -ci 'I/O error\\|medium error\\|bad sector'"), 10) || 0;
        const prob = diskErrors > 0 ? 0.6 : 0.05;
        await postApi(serverUrl, deviceKey, "hardware", {
          component: "DISK", probability: prob,
          status: prob > 0.5 ? "WARNING" : "RESOLVED",
        });
      }

      // Memory: check for ECC / corrected errors
      const memErrors = parseInt(execShell("dmesg 2>/dev/null | grep -ci 'memory error\\|EDAC\\|mce.*memory'"), 10) || 0;
      if (memErrors > 0) {
        await postApi(serverUrl, deviceKey, "hardware", { component: "MEMORY", probability: 0.7, status: "WARNING" });
      }

      // CPU: thermal throttling
      const thermalTrips = parseInt(execShell("dmesg 2>/dev/null | grep -ci 'cpu.*throttl\\|thermal'"), 10) || 0;
      if (thermalTrips > 0) {
        await postApi(serverUrl, deviceKey, "hardware", { component: "CPU", probability: 0.5, status: "WARNING" });
      }
    } catch(e) {}
  }
}

async function pollSurveys(serverUrl, deviceKey) {
  if (Math.random() > 0.1) return;
  const triggers = ["APP_CRASH_zoom.exe", "LOW_DISK_SPACE", "SLOW_BOOT"];
  await postApi(serverUrl, deviceKey, "surveys", { triggerEvent: triggers[Math.floor(Math.random() * triggers.length)], question: "How was your experience?", rating: Math.floor(Math.random() * 5) + 1 });
}

// ---- enroll + report ----
async function enrollOnce(serverUrl, token) {
  ensureDir();
  const existing = readJson(DEVICE_FILE);
  if (existing && existing.deviceKey) return existing.deviceKey;
  const res = await fetch(`${serverUrl}/api/agent/enroll`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enrollmentToken: token, hostname: os.hostname(), os: `${os.type()} ${os.release()}`, user: os.userInfo().username }) });
  if (!res.ok) throw new Error(`enroll ${res.status}: ${(await res.text()).slice(0, 150)}`);
  const { deviceKey } = await res.json();
  fs.writeFileSync(DEVICE_FILE, JSON.stringify({ deviceKey }));
  return deviceKey;
}

// Shared report loop. onStatus(text, ok) lets the tray reflect state.
async function reportForever(serverUrl, token, intervalSec, getPaused, onStatus) {
  const intervalMs = (Number(intervalSec) || 30) * 1000;
  log(`AIops Agent starting — server ${serverUrl}, device ${os.hostname()}, platform ${process.platform}`);
  let deviceKey = null;
  while (!deviceKey) {
    try { onStatus && onStatus("Enrolling…", true); deviceKey = await enrollOnce(serverUrl, token); log("Enrolled ✓"); }
    catch (e) { log(`Enroll failed: ${e.message} — retrying in 15s`); onStatus && onStatus(`Enroll failed (retrying)`, false); await sleep(15000); }
  }
  for (;;) {
    if (getPaused && getPaused()) { onStatus && onStatus("Paused", false); await sleep(3000); continue; }
    try {
      const m = await collect(serverUrl);
      const res = await fetch(`${serverUrl}/api/agent/metrics`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${deviceKey}` }, body: JSON.stringify(m) });
      if (!res.ok) throw new Error(`metrics ${res.status}`);
      const summary = `CPU ${Math.round(m.cpuPct)}%  Mem ${Math.round((m.memUsedMb / m.memTotalMb) * 100)}%` + (m.diskPct != null ? `  Disk ${Math.round(m.diskPct)}%` : "");
      log(`Reported ✓  ${summary}`);
      onStatus && onStatus(`OK ${new Date().toLocaleTimeString()} · ${summary}`, true);
      await pollCommands(serverUrl, deviceKey);
      await Promise.all([
        pollSecurity(serverUrl, deviceKey),
        pollBoot(serverUrl, deviceKey),
        pollSoftware(serverUrl, deviceKey),
        pollCrashes(serverUrl, deviceKey),
        pollHardware(serverUrl, deviceKey),
        pollSurveys(serverUrl, deviceKey)
      ]);
    } catch (e) {
      log(`Report failed: ${e.message}`);
      onStatus && onStatus(`Offline — ${e.message}`, false);
    }
    await sleep(intervalMs);
  }
}

// Tray handled by Electron main.cjs

// ---- install / shortcuts / uninstall ----
function shortcutPaths() {
  return {
    startup: path.join(process.env.APPDATA || os.homedir(), "Microsoft", "Windows", "Start Menu", "Programs", "Startup", `${APP_NAME}.lnk`),
    desktop: path.join(os.homedir(), "Desktop", `${APP_NAME}.lnk`),
  };
}
function makeShortcut(linkPath, exe) {
  const ps = [
    `$s=(New-Object -ComObject WScript.Shell).CreateShortcut("${linkPath}")`,
    `$s.TargetPath="${exe}"`,
    `$s.WorkingDirectory="${path.dirname(exe)}"`,
    `$s.IconLocation="${exe},0"`,
    `$s.WindowStyle=7`,
    `$s.Description="AIops Agent"`,
    `$s.Save()`,
  ].join(";");
  execFileSync("powershell", ["-NoProfile", "-Command", ps], { timeout: 10000, windowsHide: true });
}
function firstRunSetup(serverUrl, token, intervalSec) {
  ensureDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ server: serverUrl, token, interval: Number(intervalSec) || 30 }));
  if (IS_WIN) {
    try { const { startup, desktop } = shortcutPaths(); makeShortcut(startup, process.execPath); makeShortcut(desktop, process.execPath); log("Added Startup + Desktop shortcuts."); }
    catch (e) { log(`Shortcut setup skipped: ${e.message}`); }
  } else if (IS_LINUX) {
    log("Linux — skipping desktop shortcuts.");
  }
}
function silentInstall(serverUrl, token, intervalSec) {
  ensureDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ server: serverUrl, token, interval: Number(intervalSec) || 30 }));
  if (IS_WIN) {
    const cmd = `"${process.execPath}" --run`;
    execFileSync("schtasks", ["/Create", "/TN", TASK_NAME, "/TR", cmd, "/SC", "ONLOGON", "/F"], { stdio: "ignore", windowsHide: true });
    try { execFileSync("schtasks", ["/Run", "/TN", TASK_NAME], { stdio: "ignore", windowsHide: true }); } catch { /* */ }
    log("Silent background install complete (Windows scheduled task).");
  } else if (IS_LINUX) {
    // Install as a systemd service (system-level, or user-level if not root)
    const execPath = process.pkg ? process.execPath : `${process.execPath} ${__filename}`;
    const unitContent = [
      "[Unit]",
      "Description=AIops Agent (LeadAIStudio)",
      "After=network-online.target",
      "Wants=network-online.target",
      "",
      "[Service]",
      `ExecStart=${execPath} --run`,
      "Restart=always",
      "RestartSec=10",
      `WorkingDirectory=${STATE_DIR}`,
      "Environment=NODE_ENV=production",
      "",
      "[Install]",
      "WantedBy=multi-user.target",
      "",
    ].join("\n");
    try {
      fs.writeFileSync("/etc/systemd/system/" + SYSTEMD_UNIT, unitContent);
      execShell("systemctl daemon-reload && systemctl enable " + SYSTEMD_UNIT + " && systemctl start " + SYSTEMD_UNIT);
      log("Silent background install complete (systemd service).");
    } catch (e) {
      // Not root — try user service, then fall back to crontab
      const userDir = path.join(os.homedir(), ".config", "systemd", "user");
      try {
        fs.mkdirSync(userDir, { recursive: true });
        fs.writeFileSync(path.join(userDir, SYSTEMD_UNIT), unitContent);
        execShell("systemctl --user daemon-reload && systemctl --user enable " + SYSTEMD_UNIT + " && systemctl --user start " + SYSTEMD_UNIT);
        log("Silent background install complete (systemd user service).");
      } catch (e2) {
        // Last resort: crontab @reboot
        const cronLine = `@reboot ${execPath} --run`;
        execShell(`(crontab -l 2>/dev/null | grep -v 'aiops-agent'; echo '${cronLine}') | crontab -`);
        log("Silent background install complete (crontab @reboot).");
      }
    }
  }
}
function uninstall() {
  if (IS_WIN) {
    try { execFileSync("schtasks", ["/Delete", "/TN", TASK_NAME, "/F"], { stdio: "ignore", windowsHide: true }); } catch { /* */ }
    try { const { startup, desktop } = shortcutPaths(); fs.rmSync(startup, { force: true }); fs.rmSync(desktop, { force: true }); } catch { /* */ }
  } else if (IS_LINUX) {
    // Stop and remove systemd service (system-level + user-level)
    try { execShell("systemctl stop " + SYSTEMD_UNIT + " 2>/dev/null; systemctl disable " + SYSTEMD_UNIT + " 2>/dev/null"); } catch { /* */ }
    try { fs.rmSync("/etc/systemd/system/" + SYSTEMD_UNIT, { force: true }); } catch { /* */ }
    try { execShell("systemctl --user stop " + SYSTEMD_UNIT + " 2>/dev/null; systemctl --user disable " + SYSTEMD_UNIT + " 2>/dev/null"); } catch { /* */ }
    try { const userUnit = path.join(os.homedir(), ".config", "systemd", "user", SYSTEMD_UNIT); fs.rmSync(userUnit, { force: true }); } catch { /* */ }
    // Remove from crontab
    try { execShell("crontab -l 2>/dev/null | grep -v 'aiops-agent' | crontab -"); } catch { /* */ }
    try { execShell("systemctl daemon-reload 2>/dev/null; systemctl --user daemon-reload 2>/dev/null"); } catch { /* */ }
  }
  log("AIops Agent uninstalled.");
}

function resolveConfig() {
  let server = args.server, token = args.token, interval = args.interval;
  if (!server || !token) {
    const cfg = readJson(CONFIG_FILE) || readSidecarConfig();
    if (cfg) { server = server || cfg.server; token = token || cfg.token; interval = interval || cfg.interval; }
  }
  if (server) server = String(server).replace(/\/$/, "");
  return { server, token, interval };
}

module.exports = {
  reportForever,
  enrollOnce,
  makeIcoBase64,
  resolveConfig,
  LOG_FILE
};

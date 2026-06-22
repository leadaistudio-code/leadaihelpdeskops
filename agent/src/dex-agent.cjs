#!/usr/bin/env node
/*
  AIops Agent (LeadAIStudio) — standalone build (bundled into aiops-agent.exe).

  Lives in the Windows system tray (no console window). Streams real telemetry
  (CPU, memory, disk, battery, uptime, latency) to the AIOps dashboard and runs
  IT-queued remediations. Right-click the tray icon for status, logs, dashboard,
  pause, and quit.
*/
"use strict";

const os = require("os");
const fs = require("fs");
const path = require("path");
const { execFileSync, execFile } = require("child_process");

const APP_NAME = "AIops Agent";
const STATE_DIR = path.join(process.env.LOCALAPPDATA || os.homedir(), "leadaistudio-dex");
const CONFIG_FILE = path.join(STATE_DIR, "config.json");
const DEVICE_FILE = path.join(STATE_DIR, "device.json");
const LOG_FILE = path.join(STATE_DIR, "agent.log");
const BATTERY_FILE = path.join(STATE_DIR, "battery.json");
const BATTERY_TTL_MS = 14 * 24 * 60 * 60 * 1000; // re-check battery fortnightly
const TASK_NAME = "AIops Agent";

let SysTray = null;
try { SysTray = require("systray2").default; } catch { /* tray unavailable → headless */ }

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
  try { execFile("cmd", ["/c", "start", "", target], { windowsHide: true }); } catch { /* */ }
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
    const root = process.platform === "win32" ? (process.env.SystemDrive || "C:") + "\\" : "/";
    const s = fs.statfsSync(root);
    return s.blocks > 0 ? Math.round((1 - s.bavail / s.blocks) * 1000) / 10 : null;
  } catch { return null; }
}
// Battery requires spawning PowerShell. Cache it on disk and only re-query
// fortnightly (it changes slowly, and many devices are desktops with none) —
// so there is effectively no recurring spawn. Window is always hidden.
function batteryPct() {
  if (process.platform !== "win32") return null;
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
}
async function collect(serverUrl) {
  const totalMb = Math.round(os.totalmem() / 1024 / 1024);
  const freeMb = Math.round(os.freemem() / 1024 / 1024);
  const m = { cpuPct: Math.round((await cpuPct()) * 10) / 10, memUsedMb: totalMb - freeMb, memTotalMb: totalMb, uptimeSec: Math.round(os.uptime()), cpuCores: os.cpus().length, user: os.userInfo().username };
  const lat = await latencyMs(serverUrl); if (lat != null) m.latencyMs = lat;
  const disk = diskPct(); if (disk != null) m.diskPct = disk;
  const batt = batteryPct(); if (batt != null) m.batteryPct = batt;
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
  const isWin = process.platform === "win32";
  try {
    let out = "";
    switch (action) {
      case "FLUSH_DNS": out = isWin ? runCmd("ipconfig", ["/flushdns"]) : "unsupported"; break;
      case "RESTART_SPOOLER": if (isWin) { try { runCmd("net", ["stop", "spooler"]); } catch { /* */ } out = runCmd("net", ["start", "spooler"]); } break;
      case "CLEAR_TEMP": out = clearTemp(); break;
      case "REBOOT": out = isWin ? runCmd("shutdown", ["/r", "/t", "60", "/c", "AIops: restart in 60s (run 'shutdown /a' to cancel)"]) : "unsupported"; break;
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
  log(`AIops Agent starting — server ${serverUrl}, device ${os.hostname()}`);
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
    } catch (e) {
      log(`Report failed: ${e.message}`);
      onStatus && onStatus(`Offline — ${e.message}`, false);
    }
    await sleep(intervalMs);
  }
}

// ---- tray ----
async function runTray(serverUrl, token, intervalSec) {
  if (!SysTray) { log("Tray unavailable; running headless."); return reportForever(serverUrl, token, intervalSec, null, null); }

  let paused = false;
  const ICON = makeIcoBase64();
  const order = ["status", "host", "sep1", "dash", "logs", "pause", "sep2", "quit"];
  const items = {
    status: { title: "Status: starting…", tooltip: "", enabled: false },
    host: { title: `Device: ${os.hostname()}`, tooltip: "", enabled: false },
    sep1: SysTray.separator,
    dash: { title: "Open Dashboard", tooltip: "", enabled: true },
    logs: { title: "View Logs", tooltip: "", enabled: true },
    pause: { title: "Pause reporting", tooltip: "", enabled: true },
    sep2: SysTray.separator,
    quit: { title: "Quit", tooltip: "", enabled: true },
  };
  const menuItems = order.map((k) => items[k]);

  let systray;
  try {
    systray = new SysTray({
      menu: { icon: ICON, isTemplateIcon: false, title: "", tooltip: "AIops Agent", items: menuItems },
      copyDir: true, // extract the tray helper out of the packaged exe
    });
  } catch (e) {
    log(`Tray init failed: ${e.message}; running headless.`);
    return reportForever(serverUrl, token, intervalSec, null, null);
  }

  const updateItem = (key, patch) => {
    const idx = order.indexOf(key);
    const item = { ...menuItems[idx], ...patch };
    menuItems[idx] = item;
    try { systray.sendAction({ type: "update-item", item, seq_id: idx }); } catch { /* */ }
  };

  systray.onClick((action) => {
    const t = action.item && action.item.title;
    if (t === "Open Dashboard") openExternal(serverUrl);
    else if (t === "View Logs") openExternal(LOG_FILE);
    else if (t && t.startsWith("Pause")) { paused = true; updateItem("pause", { title: "Resume reporting" }); }
    else if (t && t.startsWith("Resume")) { paused = false; updateItem("pause", { title: "Pause reporting" }); }
    else if (t === "Quit") { try { systray.kill(false); } catch { /* */ } process.exit(0); }
  });

  try { await systray.ready(); } catch (e) {
    log(`Tray failed to start: ${e.message}; running headless.`);
    return reportForever(serverUrl, token, intervalSec, null, null);
  }

  await reportForever(serverUrl, token, intervalSec, () => paused, (text, ok) => {
    updateItem("status", { title: `Status: ${ok ? "🟢" : "🔴"} ${text}`.slice(0, 120) });
  });
}

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
  if (process.platform === "win32") {
    try { const { startup, desktop } = shortcutPaths(); makeShortcut(startup, process.execPath); makeShortcut(desktop, process.execPath); log("Added Startup + Desktop shortcuts."); }
    catch (e) { log(`Shortcut setup skipped: ${e.message}`); }
  }
}
function silentInstall(serverUrl, token, intervalSec) {
  ensureDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ server: serverUrl, token, interval: Number(intervalSec) || 30 }));
  const cmd = `"${process.execPath}" --run`;
  execFileSync("schtasks", ["/Create", "/TN", TASK_NAME, "/TR", cmd, "/SC", "ONLOGON", "/F"], { stdio: "ignore", windowsHide: true });
  try { execFileSync("schtasks", ["/Run", "/TN", TASK_NAME], { stdio: "ignore", windowsHide: true }); } catch { /* */ }
  log("Silent background install complete.");
}
function uninstall() {
  if (process.platform === "win32") {
    try { execFileSync("schtasks", ["/Delete", "/TN", TASK_NAME, "/F"], { stdio: "ignore", windowsHide: true }); } catch { /* */ }
    try { const { startup, desktop } = shortcutPaths(); fs.rmSync(startup, { force: true }); fs.rmSync(desktop, { force: true }); } catch { /* */ }
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

(async () => {
  if (args.uninstall) return uninstall();

  const { server, token, interval } = resolveConfig();

  if (args.install) {
    if (!server || !token) { log("--install needs --server and --token (or a config file)."); process.exit(1); }
    return silentInstall(server, token, interval);
  }

  if (!server || !token) { log("No configuration found. Keep aiops-agent.config.json next to the exe, or pass --server/--token."); process.exit(1); }

  // First interactive launch (double-click) → set up shortcuts so it persists.
  const interactive = !args.run && !args.server && !args.token;
  if (interactive && !readJson(CONFIG_FILE)) firstRunSetup(server, token, interval);

  // --run (the silent task) is headless; everything else gets the tray.
  if (args.run) return reportForever(server, token, interval, null, null);
  return runTray(server, token, interval);
})().catch((e) => { log(`Fatal: ${e.message}`); process.exit(1); });

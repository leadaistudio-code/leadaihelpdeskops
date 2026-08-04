//go:build windows

package main

import (
	"encoding/json"
	"regexp"
	"strconv"
	"strings"
	"time"
)

const batteryTTL = 14 * 24 * time.Hour

// platformExtras gathers Windows-specific telemetry: real WiFi (netsh), real
// packet loss (ping to gateway), GPU, drives, gateway, running services.
func platformExtras(server string) Extras {
	var x Extras
	x.Info = map[string]any{}

	x.BatteryPct = windowsBattery()

	// Real WiFi via netsh (replaces the old hardcoded "Corp-Wifi").
	if ssid, dbm, ok := windowsWifi(); ok {
		x.WifiSsid = &ssid
		if dbm != 0 {
			x.WifiSignalDbm = &dbm
		}
	}

	// Real packet loss + gateway latency by pinging the default gateway.
	gw := firstLine(ps(`(Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Select-Object -First 1).NextHop`))
	if gw != "" {
		x.Info["defaultGateway"] = gw
		if loss, rtt, ok := pingStats(gw); ok {
			x.PacketLossPct = fptr(loss)
			if rtt >= 0 {
				x.Info["gatewayRttMs"] = rtt
			}
		}
	}

	// GPU, drives, running services — one PowerShell round-trip.
	script := `
	$gpu = Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue | Select-Object -First 1
	$drives = Get-CimInstance Win32_LogicalDisk -ErrorAction SilentlyContinue | Where-Object DriveType -eq 3 | Select-Object DeviceID, FreeSpace, Size
	$svcs = (Get-Service -ErrorAction SilentlyContinue | Where-Object Status -eq 'Running').Count
	@{
	  gpuName = if ($gpu) { $gpu.Name } else { $null }
	  gpuDriver = if ($gpu) { $gpu.DriverVersion } else { $null }
	  drives = if ($drives) { @($drives) | ForEach-Object { @{ id = $_.DeviceID; freeGB = [math]::Round($_.FreeSpace/1GB,2); totalGB = [math]::Round($_.Size/1GB,2) } } } else { @() }
	  runningServices = $svcs
	} | ConvertTo-Json -Compress -Depth 5`
	if out := ps(script); out != "" {
		var info map[string]any
		if json.Unmarshal([]byte(out), &info) == nil {
			for k, v := range info {
				x.Info[k] = v
			}
		}
	}
	return x
}

func windowsBattery() *int {
	var cache struct {
		Val *int  `json:"val"`
		At  int64 `json:"at"`
	}
	if readJSON(batteryFile(), &cache) && time.Since(time.UnixMilli(cache.At)) < batteryTTL {
		return cache.Val
	}
	var val *int
	if out := ps(`(Get-CimInstance Win32_Battery).EstimatedChargeRemaining`); out != "" {
		if n, err := strconv.Atoi(firstLine(out)); err == nil {
			val = &n
		}
	}
	_ = writeJSON(batteryFile(), map[string]any{"val": val, "at": time.Now().UnixMilli()})
	return val
}

var reSignal = regexp.MustCompile(`(?i)signal\s*:\s*(\d+)%`)
var reSSID = regexp.MustCompile(`(?im)^\s*SSID\s*:\s*(.+)$`)

func windowsWifi() (string, int, bool) {
	out := runCmd(6*time.Second, "netsh", "wlan", "show", "interfaces")
	if out == "" {
		return "", 0, false
	}
	mSsid := reSSID.FindStringSubmatch(out)
	if mSsid == nil {
		return "", 0, false
	}
	ssid := strings.TrimSpace(mSsid[1])
	dbm := 0
	if mSig := reSignal.FindStringSubmatch(out); mSig != nil {
		if pct, err := strconv.Atoi(mSig[1]); err == nil {
			dbm = pct/2 - 100 // netsh reports quality %; approximate dBm
		}
	}
	return ssid, dbm, ssid != ""
}

func collectSecurity() Security {
	var s Security
	if strings.Contains(strings.ToUpper(ps("netsh advfirewall show currentprofile state")), "ON") {
		s.Firewall = true
	}
	if strings.Contains(ps("Get-MpComputerStatus | Select-Object -ExpandProperty AMServiceEnabled"), "True") {
		s.AvUpdated = true
	}
	bl := ps("manage-bde -status C:")
	if strings.Contains(bl, "Fully Encrypted") || strings.Contains(bl, "Protection On") {
		s.Bitlocker = true
	}
	return s
}

func collectCrashes(sinceSec int) []Crash {
	script := `$t=(Get-Date).AddSeconds(-` + strconv.Itoa(sinceSec) + `); $e1=Get-WinEvent -FilterHashtable @{LogName='Application';ID=1000,1002;StartTime=$t} -ErrorAction SilentlyContinue; $e2=Get-WinEvent -FilterHashtable @{LogName='System';ID=1001;StartTime=$t} -ErrorAction SilentlyContinue; $ev=@(); if($e1){$ev+=$e1}; if($e2){$ev+=$e2}; if($ev.Count -gt 0){$ev|Select-Object Id,Message|ConvertTo-Json -Compress}else{'[]'}`
	raw := ps(script)
	if raw == "" || raw == "[]" {
		return nil
	}
	var events []struct {
		Id      int    `json:"Id"`
		Message string `json:"Message"`
	}
	if json.Unmarshal([]byte(raw), &events) != nil {
		// Single object (not array) — wrap and retry.
		var one struct {
			Id      int    `json:"Id"`
			Message string `json:"Message"`
		}
		if json.Unmarshal([]byte(raw), &one) != nil {
			return nil
		}
		events = append(events, one)
	}
	reName := regexp.MustCompile(`(?i)(?:Faulting|Hanging) application name:\s*(.+?),`)
	reVer := regexp.MustCompile(`(?i)version:\s*([\d.]+)`)
	var out []Crash
	for _, ev := range events {
		c := Crash{AppName: "Unknown App", AppVersion: "Unknown", EventType: "HANG"}
		switch ev.Id {
		case 1000:
			c.EventType = "CRASH"
		case 1001:
			c.EventType = "BSOD"
			c.AppName = "Windows Kernel"
		}
		if ev.Id != 1001 {
			if m := reName.FindStringSubmatch(ev.Message); m != nil {
				c.AppName = strings.TrimSpace(m[1])
			}
			if m := reVer.FindStringSubmatch(ev.Message); m != nil {
				c.AppVersion = strings.TrimSpace(m[1])
			}
		}
		out = append(out, c)
	}
	return out
}

func collectSoftware() []string {
	raw := ps(`Get-Process | Where-Object {$_.MainWindowTitle} | Select-Object -ExpandProperty ProcessName | Select-Object -Unique | ConvertTo-Json -Compress`)
	return parseStringList(raw)
}

// collectBoot reads the real startup measurements Windows records in the
// Diagnostics-Performance log (event 100) plus Group Policy processing time
// (event 8001).
//
// The previous implementation was three kinds of made up: it fell back to a
// hardcoded 15000ms when the event was missing, added a flat "+5" as a stand-in
// for BIOS time, and read Properties[1] — which is BootStartTime, a timestamp,
// not a duration. It also never collected login time at all, so that column
// could never populate no matter what the dashboard did.
//
// Fields are addressed by NAME from the event XML rather than by index. The
// property order of event 100 is long, undocumented, and has changed between
// Windows releases; the element names have not.
func collectBoot() (BootProfile, bool) {
	const q = `$e = Get-WinEvent -LogName 'Microsoft-Windows-Diagnostics-Performance/Operational' -MaxEvents 1 -FilterXPath "*[System[EventID=100]]" -ErrorAction SilentlyContinue
if (-not $e) { exit }
$x = [xml]$e.ToXml()
function V($n) { ($x.Event.EventData.Data | Where-Object { $_.Name -eq $n }).'#text' }
"{0}|{1}|{2}|{3}" -f (V 'BootTime'), (V 'MainPathBootTime'), (V 'BootPostBootTime'), (V 'OSLoaderDuration')`

	parts := strings.Split(firstLine(ps(q)), "|")
	if len(parts) < 4 {
		return BootProfile{}, false
	}

	// Durations are milliseconds. A missing or unparseable field stays nil.
	msToSec := func(raw string) *int {
		ms, err := strconv.Atoi(strings.TrimSpace(raw))
		if err != nil || ms <= 0 {
			return nil
		}
		sec := (ms + 999) / 1000
		return &sec
	}

	total := msToSec(parts[0])
	if total == nil {
		// No measured total boot time means no boot profile. Reporting an
		// invented one is worse than reporting nothing.
		return BootProfile{}, false
	}

	return BootProfile{
		TotalBootSec: *total,
		// OSLoaderDuration is the pre-OS/firmware handoff phase — the closest
		// real analogue to "BIOS time" Windows exposes.
		BiosSec:   msToSec(parts[3]),
		OsBootSec: msToSec(parts[1]),
		// BootPostBootTime is the post-logon phase: the wait between signing in
		// and having a usable desktop. That is what users mean by "login time".
		ProfileLoadSec: msToSec(parts[2]),
		GpoSec:         collectGpoSec(),
	}, true
}

// collectGpoSec reads Group Policy processing time from event 8001, whose
// message states the elapsed seconds directly. Returns nil when unavailable —
// a machine that is not domain-joined has no GPO phase, and that is not a zero.
func collectGpoSec() *int {
	raw := firstLine(ps(`$e = Get-WinEvent -LogName 'Microsoft-Windows-GroupPolicy/Operational' -MaxEvents 1 -FilterXPath "*[System[EventID=8001]]" -ErrorAction SilentlyContinue
if (-not $e) { exit }
$x = [xml]$e.ToXml()
($x.Event.EventData.Data | Where-Object { $_.Name -eq 'PolicyElaspedTimeInSeconds' }).'#text'`))
	sec, err := strconv.Atoi(strings.TrimSpace(raw))
	if err != nil || sec < 0 {
		return nil
	}
	return &sec
}

var reWinLoss = regexp.MustCompile(`\((\d+)%\s*loss\)`)
var reWinAvg = regexp.MustCompile(`(?i)Average\s*=\s*(\d+)ms`)

// pingStats sends 4 pings and parses Windows ping output for loss % and avg RTT.
func pingStats(target string) (float64, int, bool) {
	out := runCmd(8*time.Second, "ping", "-n", "4", target)
	if out == "" {
		return 0, -1, false
	}
	loss, rtt := 0.0, -1
	if m := reWinLoss.FindStringSubmatch(out); m != nil {
		if n, err := strconv.Atoi(m[1]); err == nil {
			loss = float64(n)
		}
	}
	if m := reWinAvg.FindStringSubmatch(out); m != nil {
		if n, err := strconv.Atoi(m[1]); err == nil {
			rtt = n
		}
	}
	return loss, rtt, true
}


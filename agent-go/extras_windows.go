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

func collectBoot() (int, int, bool) {
	raw := ps(`$evt=Get-WinEvent -ProviderName "Microsoft-Windows-Diagnostics-Performance" -MaxEvents 1 -FilterXPath "*[System[EventID=100]]" -ErrorAction SilentlyContinue; if($evt){$evt.Properties[1].Value}else{15000}`)
	ms, err := strconv.Atoi(firstLine(raw))
	if err != nil || ms <= 0 {
		return 0, 0, false
	}
	osBoot := ms / 1000
	return osBoot + 5, osBoot, true
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

func collectHardware() []HardwarePred {
	var out []HardwarePred
	if h := ps("Get-PhysicalDisk | Select-Object -ExpandProperty HealthStatus | Select-Object -First 1"); h != "" {
		prob := 0.8
		if strings.Contains(h, "Healthy") {
			prob = 0.05
		}
		out = append(out, HardwarePred{Component: "DISK", Probability: prob, Status: statusFor(prob)})
	}
	if b := ps("(Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue).Status"); b != "" {
		prob := 0.7
		if strings.Contains(b, "OK") {
			prob = 0.05
		}
		out = append(out, HardwarePred{Component: "BATTERY", Probability: prob, Status: statusFor(prob)})
	}
	return out
}

package main

import (
	"net/http"
	"os"
	"os/user"
	"runtime"
	"sort"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	psnet "github.com/shirou/gopsutil/v3/net"
	"github.com/shirou/gopsutil/v3/process"
)

// Metrics maps to the server's /api/agent/metrics schema. Known columns are
// top-level; everything richer goes in ExtendedInfo (a JSON blob the server
// stores as-is), so we can send "maximum information" without a schema change.
type Metrics struct {
	CpuPct        float64        `json:"cpuPct"`
	MemUsedMb     int            `json:"memUsedMb"`
	MemTotalMb    int            `json:"memTotalMb"`
	UptimeSec     int            `json:"uptimeSec"`
	CpuCores      int            `json:"cpuCores"`
	User          string         `json:"user"`
	DiskPct       *float64       `json:"diskPct,omitempty"`
	LatencyMs     *int           `json:"latencyMs,omitempty"`
	BatteryPct    *int           `json:"batteryPct,omitempty"`
	WifiSsid      *string        `json:"wifiSsid,omitempty"`
	WifiSignalDbm *int           `json:"wifiSignalDbm,omitempty"`
	PacketLossPct *float64       `json:"packetLossPct,omitempty"`
	ExtendedInfo  map[string]any `json:"extendedInfo,omitempty"`
}

// Extras is the platform-specific slice of telemetry, filled by
// platformExtras() in extras_windows.go / extras_linux.go.
type Extras struct {
	BatteryPct    *int
	WifiSsid      *string
	WifiSignalDbm *int
	PacketLossPct *float64
	Info          map[string]any // merged into ExtendedInfo
}

func procRoot() string {
	if runtime.GOOS == "windows" {
		if d := os.Getenv("SystemDrive"); d != "" {
			return d + "\\"
		}
		return "C:\\"
	}
	return "/"
}

func latencyMs(serverURL string) *int {
	start := time.Now()
	req, err := http.NewRequest("HEAD", serverURL, nil)
	if err != nil {
		return nil
	}
	res, err := httpClient.Do(req)
	if err != nil {
		return nil
	}
	res.Body.Close()
	ms := int(time.Since(start).Milliseconds())
	return &ms
}

func username() string {
	if u, err := user.Current(); err == nil && u.Username != "" {
		return u.Username
	}
	return os.Getenv("USERNAME")
}

// collect gathers one full metrics sample. gopsutil gives real, cross-platform
// numbers; platformExtras() adds OS-specific detail. No fabricated values.
func collect(serverURL string) Metrics {
	ext := map[string]any{}

	// CPU over a 1s window (also the window we measure network throughput over).
	netBefore := netTotals()
	var cpuPct float64
	if pcts, err := cpu.Percent(time.Second, false); err == nil && len(pcts) > 0 {
		cpuPct = round1(pcts[0])
	}
	netAfter := netTotals()

	m := Metrics{
		CpuPct:   cpuPct,
		CpuCores: runtime.NumCPU(),
		User:     username(),
	}

	if vm, err := mem.VirtualMemory(); err == nil {
		m.MemTotalMb = int(vm.Total / 1024 / 1024)
		m.MemUsedMb = int(vm.Used / 1024 / 1024)
		ext["memAvailableMb"] = int(vm.Available / 1024 / 1024)
	}
	if sm, err := mem.SwapMemory(); err == nil && sm.Total > 0 {
		ext["swapUsedPct"] = round1(sm.UsedPercent)
	}

	if up, err := host.Uptime(); err == nil {
		m.UptimeSec = int(up)
	}

	if du, err := disk.Usage(procRoot()); err == nil {
		p := round1(du.UsedPercent)
		m.DiskPct = &p
		ext["diskFreeGb"] = round1(float64(du.Free) / 1e9)
		ext["diskTotalGb"] = round1(float64(du.Total) / 1e9)
	}

	m.LatencyMs = latencyMs(serverURL)

	// Network throughput over the ~1s CPU window.
	if netBefore != nil && netAfter != nil {
		ext["netSentKbps"] = round1(float64(netAfter.sent-netBefore.sent) * 8 / 1000)
		ext["netRecvKbps"] = round1(float64(netAfter.recv-netBefore.recv) * 8 / 1000)
	}

	// Host + OS detail.
	if hi, err := host.Info(); err == nil {
		ext["osPlatform"] = hi.Platform
		ext["osVersion"] = hi.PlatformVersion
		ext["kernelVersion"] = hi.KernelVersion
		ext["hostname"] = hi.Hostname
		ext["procCount"] = hi.Procs
	}

	// Temperatures (empty on many Windows boxes without WMI thermal zones).
	if temps, err := host.SensorsTemperatures(); err == nil && len(temps) > 0 {
		var maxTemp float64
		for _, t := range temps {
			if t.Temperature > maxTemp {
				maxTemp = t.Temperature
			}
		}
		if maxTemp > 0 {
			ext["maxTempC"] = round1(maxTemp)
		}
	}

	// Top processes by memory (reliable cross-platform); CPU% is approximate.
	ext["topProcesses"] = topProcesses(5)

	// Platform-specific: real WiFi, packet loss, GPU, drives, gateway, battery…
	x := platformExtras(serverURL)
	m.BatteryPct = x.BatteryPct
	m.WifiSsid = x.WifiSsid
	m.WifiSignalDbm = x.WifiSignalDbm
	m.PacketLossPct = x.PacketLossPct
	for k, v := range x.Info {
		ext[k] = v
	}

	if len(ext) > 0 {
		m.ExtendedInfo = ext
	}
	return m
}

type netSample struct{ sent, recv uint64 }

func netTotals() *netSample {
	counters, err := psnet.IOCounters(false)
	if err != nil || len(counters) == 0 {
		return nil
	}
	return &netSample{sent: counters[0].BytesSent, recv: counters[0].BytesRecv}
}

type procInfo struct {
	Name  string  `json:"name"`
	MemMb float64 `json:"memMb"`
	CpuPct float64 `json:"cpuPct"`
}

func topProcesses(n int) []procInfo {
	procs, err := process.Processes()
	if err != nil {
		return nil
	}
	var out []procInfo
	for _, p := range procs {
		name, err := p.Name()
		if err != nil || name == "" {
			continue
		}
		mi, err := p.MemoryInfo()
		if err != nil || mi == nil {
			continue
		}
		cp, _ := p.CPUPercent()
		out = append(out, procInfo{
			Name:   name,
			MemMb:  round1(float64(mi.RSS) / 1024 / 1024),
			CpuPct: round1(cp),
		})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].MemMb > out[j].MemMb })
	if len(out) > n {
		out = out[:n]
	}
	return out
}

func round1(f float64) float64 { return float64(int(f*10+0.5)) / 10 }

// osString is a human OS label for enrollment, e.g. "windows 10.0.19045".
func osString() string {
	if hi, err := host.Info(); err == nil && hi != nil {
		return hi.Platform + " " + hi.PlatformVersion
	}
	return runtime.GOOS
}

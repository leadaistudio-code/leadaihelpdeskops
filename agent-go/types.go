package main

// Sub-poll payloads, matching the server's /api/agent/* endpoints.

type Security struct {
	Bitlocker bool `json:"bitlockerActive"`
	AvUpdated bool `json:"avUpdated"`
	Firewall  bool `json:"firewallActive"`
}

type Crash struct {
	AppName    string `json:"appName"`
	AppVersion string `json:"appVersion"`
	EventType  string `json:"eventType"`
}

type HardwarePred struct {
	Component   string  `json:"component"`
	Probability float64 `json:"probability"`
	Status      string  `json:"status"`
}

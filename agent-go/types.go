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

// BootProfile is what the endpoint actually measured about its last startup.
// Every field is optional because not every platform (or every boot) exposes
// every phase — an absent measurement is sent as null, never as an estimate.
type BootProfile struct {
	TotalBootSec   int  `json:"totalBootSec"`
	BiosSec        *int `json:"biosSec,omitempty"`
	OsBootSec      *int `json:"osBootSec,omitempty"`
	ProfileLoadSec *int `json:"profileLoadSec,omitempty"`
	GpoSec         *int `json:"gpoSec,omitempty"`
}

//go:build windows

package main

import (
	"os/exec"
	"syscall"
)

// hideWindow prevents child processes (powershell, netsh, ping) from flashing a
// console window. CREATE_NO_WINDOW (0x08000000) + HideWindow.
func hideWindow(c *exec.Cmd) {
	c.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: 0x08000000}
}

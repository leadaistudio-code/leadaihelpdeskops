//go:build !windows

package main

import "os/exec"

// hideWindow is a no-op off Windows.
func hideWindow(c *exec.Cmd) {}

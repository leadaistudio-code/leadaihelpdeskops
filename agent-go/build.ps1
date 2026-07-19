# Build tiny, stripped AIops Agent binaries for Windows + Linux.
#
#   -s -w         strip symbol table + DWARF  (much smaller)
#   -trimpath     drop local build paths
#   -H=windowsgui Windows: GUI subsystem, so no console window flashes
#   CGO_ENABLED=0 fully static; Windows tray (fyne.io/systray) is pure-Go, and
#                 the Linux build never imports systray (headless), so no C
#                 compiler / GTK is needed on either target.

$ErrorActionPreference = "Stop"
$env:CGO_ENABLED = "0"
New-Item -ItemType Directory -Force -Path dist | Out-Null

Write-Host "go mod tidy…"
go mod tidy

Write-Host "Building Windows amd64…"
$env:GOOS = "windows"; $env:GOARCH = "amd64"
go build -trimpath -ldflags "-s -w -H=windowsgui" -o dist/aiops-agent.exe .

Write-Host "Building Linux amd64…"
$env:GOOS = "linux"; $env:GOARCH = "amd64"
go build -trimpath -ldflags "-s -w" -o dist/aiops-agent-linux .

Get-ChildItem dist | Select-Object Name, @{N = "MB"; E = { [math]::Round($_.Length / 1MB, 1) } }
Write-Host ""
Write-Host "Optional extra shrink (needs upx):  upx --best --lzma dist/aiops-agent.exe"

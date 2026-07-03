# Generates the 6 narration segments using the built-in Windows speech engine.
# ASCII-only spoken text (acronyms spaced for clear pronunciation).
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

# List installed voices, then prefer a clear US voice.
$voices = $synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name }
Write-Host "Installed voices: $($voices -join ', ')"
$prefer = @("Microsoft Zira Desktop", "Microsoft David Desktop", "Microsoft Zira", "Microsoft David")
$chosen = $null
foreach ($p in $prefer) { if ($voices -contains $p) { $chosen = $p; break } }
if (-not $chosen) { $chosen = $voices[0] }
$synth.SelectVoice($chosen)
Write-Host "Using voice: $chosen"
$synth.Rate = 3
$synth.Volume = 100

$outDir = Join-Path $env:TEMP "leadvo"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$lines = @(
  "One platform to run your entire I T helpdesk.",
  "Start in the Command Center. Every incident, K P I, and S L A in one live view, so your team always knows what needs attention first.",
  "Then go proactive. Our A I Ops engine reads live device telemetry, predicts hardware failures before they happen, and with Auto-Pilot, heals them automatically. No ticket required.",
  "Prove your impact with real dashboards. Resolution time, deflection, S L A compliance, and agent performance, updating in real time.",
  "Employees help themselves from a twenty four item service catalog. Hardware, software, and access, routed through automated approvals.",
  "The result. Faster resolutions, lower costs, measurable R O I. Lead A I Studio, A I Ops. Try the interactive demo today."
)

for ($i = 0; $i -lt $lines.Count; $i++) {
  $path = Join-Path $outDir ("seg{0}.wav" -f ($i + 1))
  $synth.SetOutputToWaveFile($path)
  $synth.Speak($lines[$i])
  Write-Host "Wrote $path"
}
$synth.SetOutputToNull()
$synth.Dispose()
Write-Host "DONE $outDir"

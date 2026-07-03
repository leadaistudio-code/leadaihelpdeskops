"""Generate natural neural voiceover segments with edge-tts (free MS voices).
Outputs seg1.mp3..seg6.mp3 into %TEMP%/leadvo and prints each duration."""
import asyncio
import os
import tempfile
import edge_tts

VOICE = "en-US-AndrewMultilingualNeural"  # Warm, confident, authentic.
RATE = "+0%"  # Voice's natural default pace — unhurried but not slow.

LINES = [
    "One platform to run your entire I T helpdesk.",
    "Start in the Command Center. Every incident, K P I, and S L A in one live view, so your team always knows what needs attention first.",
    "Then go proactive. Our A I Ops engine reads live device telemetry, predicts hardware failures before they happen, and with Auto-Pilot, heals them automatically. No ticket required.",
    "Prove your impact with real dashboards. Resolution time, deflection, S L A compliance, and agent performance, updating in real time.",
    "Employees help themselves from a twenty four item service catalog. Hardware, software, and access, routed through automated approvals.",
    "The result. Faster resolutions, lower costs, measurable R O I. Lead A I Studio, A I Ops. Try the interactive demo today.",
]

OUT_DIR = os.path.join(tempfile.gettempdir(), "leadvo")
os.makedirs(OUT_DIR, exist_ok=True)


async def main():
    for i, text in enumerate(LINES, start=1):
        path = os.path.join(OUT_DIR, f"seg{i}.mp3")
        communicate = edge_tts.Communicate(text, VOICE, rate=RATE)
        await communicate.save(path)
        print(f"Wrote {path}")
    print(f"DONE {OUT_DIR} voice={VOICE} rate={RATE}")


asyncio.run(main())

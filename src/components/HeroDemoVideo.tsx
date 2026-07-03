"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

// Click-to-play hero demo. No autoplay: shows the poster + a play button, and
// only starts (with sound) on a user gesture. Also responds to a global
// "leadai:play-demo" event so the hero "Watch Demo" button can trigger it.
export default function HeroDemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const start = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.currentTime = 0;
    // Called from a user gesture, so unmuted playback is allowed. Fall back to
    // muted if a browser still blocks it.
    v.play()
      .then(() => setPlaying(true))
      .catch(() => {
        v.muted = true;
        v.play().catch(() => {});
        setPlaying(true);
      });
  };

  useEffect(() => {
    const handler = () => start();
    window.addEventListener("leadai:play-demo", handler);
    return () => window.removeEventListener("leadai:play-demo", handler);
  }, []);

  return (
    <div className="relative bg-slate-950 aspect-video">
      <video
        ref={videoRef}
        src="/leadaistudio-demo.mp4"
        poster="/leadaistudio-demo-poster.jpg"
        controls
        playsInline
        preload="metadata"
        className="w-full h-full block"
      />

      {!playing && (
        <button
          type="button"
          onClick={start}
          aria-label="Play the 60-second product demo"
          className="group absolute inset-0 flex flex-col items-center justify-center bg-slate-950/30 hover:bg-slate-950/20 transition-colors cursor-pointer"
        >
          <span className="flex items-center justify-center w-20 h-20 rounded-full bg-white/95 shadow-2xl ring-1 ring-black/5 group-hover:scale-110 transition-transform">
            <Play className="w-9 h-9 text-blue-600 fill-blue-600 ml-1" />
          </span>
          <span className="mt-5 px-4 py-2 rounded-full bg-slate-900/80 text-white text-sm font-semibold backdrop-blur">
            Watch the 60-second narrated tour
          </span>
        </button>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import ReactDOM from "react-dom";

// Click-to-play hero demo. No autoplay: shows the poster + a play button, and
// only starts (with sound) on a user gesture. Also responds to a global
// "leadai:play-demo" event so the hero "Watch Demo" button can trigger it.
export default function HeroDemoVideo() {
  ReactDOM.preload("/leadaistudio-demo-poster.jpg", { as: "image", fetchPriority: "high" });

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
    <div className="relative bg-[#f7f7f7] aspect-video">
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
          className="group absolute inset-0 flex flex-col items-center justify-center bg-black/5 hover:bg-black/10 transition-colors cursor-pointer"
        >
          <span className="flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-[0_12px_32px_-8px_rgba(0,0,0,0.25)] ring-1 ring-black/5 group-hover:scale-110 transition-transform">
            <Play className="w-9 h-9 text-[#00926f] fill-[#00926f] ml-1" />
          </span>
          <span className="mt-5 px-4 py-2 rounded-full bg-[#0a0a0a] text-white text-sm font-semibold">
            Watch the 60-second narrated tour
          </span>
        </button>
      )}
    </div>
  );
}

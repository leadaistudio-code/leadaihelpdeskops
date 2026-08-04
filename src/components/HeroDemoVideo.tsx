"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import ReactDOM from "react-dom";

const YOUTUBE_ID = "aWtUwN-3ieo";

// Click-to-play hero demo, embedded from YouTube.
//
// The iframe is NOT rendered until the visitor asks for it. A YouTube embed
// pulls ~1 MB of player JavaScript and blocks the main thread while it boots —
// on the landing page's hero that lands squarely on LCP and INP. Rendering our
// own poster + play button and mounting the iframe only on click ("facade"
// pattern) keeps the page weight where it was, and the player then autoplays
// because the click that mounted it counts as the user gesture.
//
// Also responds to a global "leadai:play-demo" event so the hero's
// "Watch it heal" button can trigger playback from outside this component.
export default function HeroDemoVideo() {
  ReactDOM.preload("/leadaistudio-demo-poster.jpg", { as: "image", fetchPriority: "high" });

  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const handler = () => setPlaying(true);
    window.addEventListener("leadai:play-demo", handler);
    return () => window.removeEventListener("leadai:play-demo", handler);
  }, []);

  // youtube-nocookie.com is YouTube's privacy-preserving host: no tracking
  // cookie until the visitor actually plays something.
  const src =
    `https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}` +
    "?autoplay=1&rel=0&modestbranding=1&playsinline=1";

  return (
    <div className="relative bg-[#f7f7f7] aspect-video">
      {playing ? (
        <iframe
          src={src}
          title="LeadAIStudio product demo"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full block border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label="Play the 60-second product demo"
          className="group absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
        >
          {/* Plain <img>, not next/image: this is a static, known-size poster
              and it is preloaded above, so the optimizer adds nothing here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/leadaistudio-demo-poster.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <span className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />
          <span className="relative flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-[0_12px_32px_-8px_rgba(0,0,0,0.25)] ring-1 ring-black/5 group-hover:scale-110 transition-transform">
            <Play className="w-9 h-9 text-[#00926f] fill-[#00926f] ml-1" />
          </span>
          <span className="relative mt-5 px-4 py-2 rounded-full bg-[#0a0a0a] text-white text-sm font-semibold">
            Watch the 60-second narrated tour
          </span>
        </button>
      )}
    </div>
  );
}

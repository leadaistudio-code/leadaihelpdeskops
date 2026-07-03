import React from "react";
import {
  AbsoluteFill,
  Sequence,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import {
  Zap,
  Ticket,
  ShieldAlert,
  Activity,
  BarChart3,
  Library,
  BrainCircuit,
  AlertTriangle,
  Cpu,
  Laptop,
  Monitor,
  KeyRound,
  BookOpen,
  Network,
  Radio,
  Smartphone,
  Headphones,
  Code,
  Cloud,
  Printer,
  Mouse,
  Video,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

export const FPS = 30;

// Scene timing (frames @ 30fps) — each scene's duration is matched to its
// voiceover segment length (+ a short tail) so narration and visuals stay in
// sync. Audio offsets in public/demo-audio.mp3 are derived from these starts.
const S = {
  intro: { from: 0, dur: 122 },
  command: { from: 122, dur: 316 },
  dex: { from: 438, dur: 388 },
  analytics: { from: 826, dur: 319 },
  catalog: { from: 1145, dur: 295 },
  roi: { from: 1440, dur: 340 },
};
export const DURATION_IN_FRAMES = S.roi.from + S.roi.dur; // 1780 frames = 59.3s

const FONT =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, system-ui, sans-serif";

/* ------------------------------- helpers -------------------------------- */

const fadeInOut = (frame: number, dur: number, fadeIn = 10, fadeOut = 9) =>
  interpolate(frame, [0, fadeIn, dur - fadeOut, dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// Snappier spring entrance.
const useEnter = (delay = 0, damping = 13) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass: 0.6, stiffness: 140 } });
};

function CountUp({
  target,
  suffix = "",
  prefix = "",
  decimals = 0,
  delay = 0,
  duration = 26,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  delay?: number;
  duration?: number;
}) {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [delay, delay + duration], [0, target], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <>
      {prefix}
      {v.toFixed(decimals)}
      {suffix}
    </>
  );
}

// Animated pointer with click ripples — gives the "someone is using it" feel.
const Cursor: React.FC<{ path: { f: number; x: number; y: number }[]; clicks?: number[] }> = ({
  path,
  clicks = [],
}) => {
  const frame = useCurrentFrame();
  const fs = path.map((p) => p.f);
  const x = interpolate(frame, fs, path.map((p) => p.x), { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(frame, fs, path.map((p) => p.y), { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const appear = interpolate(frame, [path[0].f - 6, path[0].f], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Press dip near a click
  const press = clicks.reduce((acc, cf) => {
    const p = interpolate(frame, [cf - 4, cf, cf + 6], [1, 0.8, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return Math.min(acc, p);
  }, 1);
  if (frame < path[0].f - 6) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: appear, zIndex: 60, pointerEvents: "none" }}>
      {clicks.map((cf, i) => {
        if (frame < cf || frame > cf + 20) return null;
        const r = interpolate(frame, [cf, cf + 20], [0, 70], { extrapolateRight: "clamp" });
        const o = interpolate(frame, [cf, cf + 20], [0.45, 0], { extrapolateRight: "clamp" });
        return (
          <div key={i} style={{ position: "absolute", left: 8 - r / 2, top: 8 - r / 2, width: r, height: r, borderRadius: "50%", background: `rgba(96,165,250,${o})` }} />
        );
      })}
      <svg width="32" height="32" viewBox="0 0 24 24" style={{ transform: `scale(${press})`, filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.6))" }}>
        <path d="M5 3l14 7-6 1.6-2.4 6z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/* ----------------------------- shared chrome ---------------------------- */

const Bg: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, DURATION_IN_FRAMES], [0, 40]);
  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        background:
          "radial-gradient(ellipse at 50% -10%, rgba(99,102,241,0.16) 0%, transparent 55%), linear-gradient(160deg, #020617 0%, #0f172a 55%, #1e1b4b 100%)",
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          backgroundPosition: `${drift}px ${drift}px`,
          maskImage: "radial-gradient(ellipse at 50% 40%, black 0%, transparent 80%)",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

const Card: React.FC<{ style?: React.CSSProperties; children: React.ReactNode; glow?: string }> = ({
  style,
  children,
  glow,
}) => (
  <div
    style={{
      background: "rgba(15,23,42,0.62)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 22,
      backdropFilter: "blur(16px)",
      boxShadow: glow ?? "0 8px 40px rgba(0,0,0,0.35)",
      ...style,
    }}
  >
    {children}
  </div>
);

const SceneTitle: React.FC<{ icon: React.ReactNode; kicker: string; title: string; accent: string; badge?: string }> = ({
  icon,
  kicker,
  title,
  accent,
  badge,
}) => {
  const e = useEnter(1);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 26, transform: `translateX(${interpolate(e, [0, 1], [-36, 0])}px)`, opacity: e }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: `${accent}22`, border: `1px solid ${accent}55`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 26px ${accent}33` }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: accent, fontSize: 17, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase" }}>{kicker}</div>
        <div style={{ color: "#fff", fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>{title}</div>
      </div>
      {badge && (
        <div style={{ alignSelf: "flex-start", background: `${accent}1a`, color: accent, border: `1px solid ${accent}44`, borderRadius: 999, padding: "8px 18px", fontSize: 18, fontWeight: 800 }}>
          {badge}
        </div>
      )}
    </div>
  );
};

/* -------------------------------- intro --------------------------------- */

const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame, fps, config: { damping: 11, mass: 0.7, stiffness: 160 } });
  const titleE = spring({ frame: frame - 8, fps, config: { damping: 14, stiffness: 150 } });
  const subE = spring({ frame: frame - 18, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", opacity: fadeInOut(frame, S.intro.dur, 8, 12) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 34, transform: `scale(${interpolate(logo, [0, 1], [0.6, 1])})`, opacity: logo }}>
        <div style={{ width: 78, height: 78, borderRadius: 18, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 50px rgba(37,99,235,0.6)" }}>
          <Zap color="#fff" size={44} />
        </div>
        <div style={{ color: "#fff", fontSize: 52, fontWeight: 800, letterSpacing: -1 }}>
          LeadAIStudio <span style={{ color: "#60a5fa" }}>AIOps</span>
        </div>
      </div>
      <div style={{ color: "#fff", fontSize: 72, fontWeight: 800, letterSpacing: -2, maxWidth: 1300, lineHeight: 1.05, transform: `translateY(${interpolate(titleE, [0, 1], [26, 0])}px)`, opacity: titleE }}>
        One platform to run the entire IT helpdesk.
      </div>
      <div style={{ color: "#94a3b8", fontSize: 28, fontWeight: 500, marginTop: 24, opacity: subE }}>
        Service Desk · DEX & AIOps · Analytics · Catalog · Assets
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------ command --------------------------------- */

const KpiCard: React.FC<{ icon: React.ReactNode; value: React.ReactNode; label: string; color: string; ring: string; delay: number }> = ({
  icon,
  value,
  label,
  color,
  ring,
  delay,
}) => {
  const e = useEnter(delay);
  return (
    <Card style={{ padding: 24, flex: 1, transform: `translateY(${interpolate(e, [0, 1], [26, 0])}px)`, opacity: e }}>
      <div style={{ width: 46, height: 46, borderRadius: 999, background: ring, color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>{icon}</div>
      <div style={{ color, fontSize: 46, fontWeight: 900, letterSpacing: -1 }}>{value}</div>
      <div style={{ color: "#64748b", fontSize: 15, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", marginTop: 2 }}>{label}</div>
    </Card>
  );
};

const CommandScene: React.FC = () => {
  const frame = useCurrentFrame();
  const bars = [40, 65, 50, 80, 55, 92, 70];
  const tickets = [
    { n: "INC0010042", tone: "#fb7185", bg: "rgba(251,113,133,0.1)", ps: "CRITICAL", d: "VPN gateway unreachable — HQ" },
    { n: "INC0010038", tone: "#fbbf24", bg: "rgba(251,191,36,0.1)", ps: "HIGH", d: "Outlook crashes on launch" },
    { n: "INC0010031", tone: "#94a3b8", bg: "rgba(148,163,184,0.1)", ps: "MEDIUM", d: "Printer driver missing" },
    { n: "INC0010024", tone: "#94a3b8", bg: "rgba(148,163,184,0.1)", ps: "LOW", d: "Request a second monitor" },
  ];
  const btnPress = interpolate(frame, [120, 126, 134], [1, 0.92, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ padding: "64px 80px", opacity: fadeInOut(frame, S.command.dur) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <SceneTitle accent="#818cf8" kicker="Command Center" title="Every incident, one console" icon={<Activity color="#818cf8" size={34} />} />
        <div style={{ transform: `scale(${btnPress})`, background: "linear-gradient(90deg,#7c3aed,#4f46e5)", color: "#fff", fontWeight: 800, fontSize: 18, padding: "14px 22px", borderRadius: 14, boxShadow: "0 0 22px rgba(124,58,237,0.45)", marginTop: 6 }}>
          + Create Incident
        </div>
      </div>
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <KpiCard delay={3} color="#fff" ring="rgba(99,102,241,0.2)" icon={<Ticket size={22} />} label="Open Incidents" value={<CountUp target={128} delay={4} />} />
        <KpiCard delay={7} color="#fb7185" ring="rgba(251,113,133,0.2)" icon={<ShieldAlert size={22} />} label="Critical Priority" value={<CountUp target={6} delay={8} />} />
        <KpiCard delay={11} color="#34d399" ring="rgba(52,211,153,0.2)" icon={<Activity size={22} />} label="Assigned to Me" value={<CountUp target={14} delay={12} />} />
        <KpiCard delay={15} color="#38bdf8" ring="rgba(56,189,248,0.2)" icon={<Zap size={22} />} label="SLA Compliance" value={<CountUp target={99.9} decimals={1} suffix="%" delay={16} />} />
      </div>
      <div style={{ display: "flex", gap: 20, flex: 1 }}>
        <Card style={{ padding: 24, width: 420, display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#64748b", fontSize: 15, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 18 }}>Incident Volume · 7 Days</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flex: 1 }}>
            {bars.map((h, i) => {
              const grow = interpolate(frame, [18 + i * 3, 34 + i * 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return <div key={i} style={{ flex: 1, height: `${h * grow}%`, borderRadius: "8px 8px 0 0", background: "linear-gradient(to top,#4f46e5,#38bdf8)" }} />;
            })}
          </div>
        </Card>
        <Card style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "16px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)", color: "#94a3b8", fontSize: 15, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase" }}>My Active Work</div>
          {tickets.map((r, i) => {
            const e = interpolate(frame, [24 + i * 6, 40 + i * 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, padding: "18px 28px", borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: e, transform: `translateX(${interpolate(e, [0, 1], [22, 0])}px)` }}>
                <div style={{ color: "#818cf8", fontWeight: 800, fontSize: 20, width: 180 }}>{r.n}</div>
                <div style={{ background: r.bg, color: r.tone, border: `1px solid ${r.tone}33`, borderRadius: 999, padding: "4px 13px", fontSize: 14, fontWeight: 800, width: 100, textAlign: "center" }}>{r.ps}</div>
                <div style={{ color: "#cbd5e1", fontSize: 20, fontWeight: 500 }}>{r.d}</div>
              </div>
            );
          })}
        </Card>
      </div>
      <Cursor path={[{ f: 70, x: 900, y: 700 }, { f: 118, x: 1640, y: 150 }]} clicks={[124]} />
    </AbsoluteFill>
  );
};

/* -------------------------------- DEX ----------------------------------- */

const DexScene: React.FC = () => {
  const frame = useCurrentFrame();
  const stats = [
    { v: 92, suf: "", l: "Experience Score", c: "#34d399" },
    { v: 1043, suf: "", l: "Devices", c: "#fff" },
    { v: 1019, suf: "", l: "Online", c: "#34d399" },
    { v: 11, suf: "", l: "At Risk", c: "#fbbf24" },
  ];
  // Auto-Pilot flips ON when the narration reaches "...with Auto-Pilot, heals
  // them automatically" — the cursor clicks it for a live, in-product moment.
  const TOGGLE = 316;
  const on = frame >= TOGGLE;
  const knob = interpolate(frame, [TOGGLE, TOGGLE + 8], [4, 30], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const togBg = on ? "#10b981" : "#334155";
  const healthBars = [
    { name: "Healthy", w: 85, c: "#10b981" },
    { name: "Warning", w: 12, c: "#f59e0b" },
    { name: "Critical", w: 3, c: "#ef4444" },
  ];
  const logs = [
    { f: 60, txt: "10:42  Telemetry sync — 1,019 devices reporting", auto: false },
    { f: 78, txt: "10:43  Anomaly: WS-2210 CPU thermal +15% baseline", auto: false },
    { f: TOGGLE + 10, txt: "⚡ Auto-Triggered: Clear Cache queued for WS-8831", auto: true },
    { f: TOGGLE + 26, txt: "⚡ Auto-Triggered: Remote Reboot queued for WS-2210", auto: true },
  ];
  // latency line draw
  const draw = interpolate(frame, [40, 90], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ padding: "56px 80px", opacity: fadeInOut(frame, S.dex.dur) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <SceneTitle accent="#22d3ee" kicker="DEX & AIOps" title="Predict failures. Heal them automatically." icon={<Activity color="#22d3ee" size={34} />} />
        {/* Auto-Pilot toggle */}
        <Card glow={on ? "0 0 26px rgba(16,185,129,0.3)" : undefined} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", marginTop: 4, border: on ? "1px solid rgba(16,185,129,0.5)" : "1px solid rgba(255,255,255,0.1)" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={16} color={on ? "#34d399" : "#64748b"} /> Proactive Auto-Pilot
            </div>
            <div style={{ color: "#94a3b8", fontSize: 14 }}>{on ? "Monitoring & healing automatically" : "Manual remediation"}</div>
          </div>
          <div style={{ position: "relative", width: 54, height: 30, borderRadius: 999, background: togBg, transition: "none" }}>
            <div style={{ position: "absolute", top: 4, left: knob, width: 22, height: 22, borderRadius: 999, background: "#fff" }} />
          </div>
        </Card>
      </div>

      {/* stat row */}
      <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
        {stats.map((s, i) => {
          const e = useEnter(2 + i * 3);
          return (
            <Card key={i} style={{ flex: 1, padding: 20, opacity: e, transform: `translateY(${interpolate(e, [0, 1], [22, 0])}px)` }}>
              <div style={{ color: "#64748b", fontSize: 14, fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", marginBottom: 6 }}>{s.l}</div>
              <div style={{ color: s.c, fontSize: 50, fontWeight: 900, letterSpacing: -2 }}>
                <CountUp target={s.v} delay={2 + i * 3} />{s.suf}
                {s.l === "Experience Score" && <span style={{ fontSize: 22, color: "#64748b" }}> / 100</span>}
              </div>
            </Card>
          );
        })}
      </div>

      {/* predictive panel */}
      <Card glow="0 0 30px rgba(99,102,241,0.15)" style={{ padding: 22, marginBottom: 18, border: "1px solid rgba(99,102,241,0.35)", background: "rgba(49,46,129,0.22)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <BrainCircuit color="#818cf8" size={26} />
          <div style={{ color: "#fff", fontSize: 24, fontWeight: 800 }}>Predictive Intelligence (AIOps)</div>
          <div style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, padding: "3px 10px", fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, opacity: 0.55 + 0.45 * Math.abs(Math.sin(frame / 9)) }}>Scanning</div>
        </div>
        <div style={{ display: "flex", gap: 18 }}>
          {[
            { icon: <AlertTriangle color="#f59e0b" size={22} />, t: "Memory Leak · WS-8831", d: <>Memory exhausts in <b style={{ color: "#fbbf24" }}>~4.2h</b> — restart recommended.</>, delay: 8 },
            { icon: <Cpu color="#fb7185" size={22} />, t: "Thermal Degradation · WS-2210", d: <><b style={{ color: "#fb7185" }}>78% failure</b> probability within 30 days.</>, delay: 12 },
            { icon: <Radio color="#22d3ee" size={22} />, t: "Disk Pressure · WS-4417", d: <>Disk at <b style={{ color: "#22d3ee" }}>94%</b> — auto-cleanup eligible.</>, delay: 16 },
          ].map((c, i) => {
            const e = useEnter(c.delay);
            return (
              <div key={i} style={{ flex: 1, display: "flex", gap: 14, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 18, opacity: e, transform: `translateY(${interpolate(e, [0, 1], [18, 0])}px)` }}>
                {c.icon}
                <div>
                  <div style={{ color: "#fff", fontSize: 19, fontWeight: 800, marginBottom: 5 }}>{c.t}</div>
                  <div style={{ color: "#94a3b8", fontSize: 16 }}>{c.d}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* bottom row: latency + fleet health + remediation log */}
      <div style={{ display: "flex", gap: 18, flex: 1 }}>
        <Card style={{ flex: 1.3, padding: 22, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Radio size={18} color="#22d3ee" />
            <div style={{ color: "#94a3b8", fontSize: 14, fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase" }}>Network Latency (ms)</div>
          </div>
          <svg viewBox="0 0 520 180" style={{ width: "100%", flex: 1 }} preserveAspectRatio="none">
            <defs>
              <linearGradient id="lat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline
              points="0,120 86,100 173,108 260,40 346,150 433,70 520,84"
              fill="none"
              stroke="#22d3ee"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={draw}
            />
          </svg>
        </Card>

        <Card style={{ flex: 1, padding: 22, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Cpu size={18} color="#22d3ee" />
              <div style={{ color: "#94a3b8", fontSize: 14, fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase" }}>Fleet Health</div>
            </div>
            {on && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.18)", color: "#34d399", border: "1px solid rgba(16,185,129,0.35)", borderRadius: 8, padding: "4px 10px", fontSize: 13, fontWeight: 800 }}>
                <ShieldCheck size={14} /> Auto-Healing Active
              </div>
            )}
          </div>
          {healthBars.map((b, i) => {
            const grow = interpolate(frame, [30 + i * 5, 50 + i * 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                  <span>{b.name}</span>
                </div>
                <div style={{ height: 16, borderRadius: 8, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${b.w * grow}%`, background: b.c, borderRadius: 8 }} />
                </div>
              </div>
            );
          })}
        </Card>

        <Card style={{ flex: 1, padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)", color: "#94a3b8", fontSize: 14, fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase" }}>Remediation Log</div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {logs.map((l, i) => {
              const e = interpolate(frame, [l.f, l.f + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return (
                <div key={i} style={{ opacity: e, transform: `translateX(${interpolate(e, [0, 1], [-14, 0])}px)`, color: l.auto ? "#34d399" : "#cbd5e1", fontSize: 15, fontWeight: l.auto ? 700 : 500, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px" }}>
                  {l.txt}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      <Cursor path={[{ f: 250, x: 680, y: 520 }, { f: 312, x: 1690, y: 150 }]} clicks={[TOGGLE]} />
    </AbsoluteFill>
  );
};

/* ----------------------------- analytics -------------------------------- */

const Donut: React.FC<{ pct: number; color: string; label: string; delay: number }> = ({ pct, color, label, delay }) => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [delay, delay + 30], [0, pct / 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const C = 2 * Math.PI * 52;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
      <svg width="150" height="150" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r="52" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="14" />
        <circle cx="65" cy="65" r="52" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - sweep)} transform="rotate(-90 65 65)" />
        <text x="65" y="72" textAnchor="middle" fill="#fff" fontSize="30" fontWeight="900">
          {(sweep * 100).toFixed(1)}%
        </text>
      </svg>
      <div style={{ color: "#64748b", fontSize: 14, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginTop: 4 }}>{label}</div>
    </div>
  );
};

const AnalyticsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const cats = [
    { h: 92, c: "#c026d3", n: "Software" },
    { h: 72, c: "#4f46e5", n: "Access" },
    { h: 58, c: "#059669", n: "Hardware" },
    { h: 42, c: "#d97706", n: "Network" },
    { h: 30, c: "#e11d48", n: "Other" },
  ];
  const priority = [
    { n: "Critical", w: 18, c: "#ef4444" },
    { n: "High", w: 34, c: "#f59e0b" },
    { n: "Medium", w: 60, c: "#6366f1" },
    { n: "Low", w: 44, c: "#64748b" },
  ];
  const agents = [
    { n: "Priya N.", v: 142, c: "#34d399" },
    { n: "Marco D.", v: 128, c: "#38bdf8" },
    { n: "Aisha K.", v: 119, c: "#a78bfa" },
    { n: "Tom R.", v: 97, c: "#fbbf24" },
  ];
  const trendDraw = interpolate(frame, [24, 70], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ padding: "56px 80px", opacity: fadeInOut(frame, S.analytics.dur) }}>
      <SceneTitle accent="#a78bfa" kicker="Analytics" title="Prove your impact with live dashboards" icon={<BarChart3 color="#a78bfa" size={34} />} />
      <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
        {[
          { v: <CountUp target={2.14} decimals={2} delay={4} />, suf: "h MTTR", l: "Avg. Resolution", c: "#34d399" },
          { v: <CountUp target={61} suffix="%" delay={6} />, suf: "", l: "Ticket Deflection", c: "#38bdf8" },
          { v: <CountUp target={1248} delay={8} />, suf: "", l: "Resolved · 30d", c: "#a78bfa" },
          { v: <CountUp target={4.8} decimals={1} delay={10} />, suf: " / 5", l: "CSAT", c: "#fbbf24" },
        ].map((s, i) => {
          const e = useEnter(3 + i * 3);
          return (
            <Card key={i} style={{ flex: 1, padding: 22, opacity: e, transform: `translateY(${interpolate(e, [0, 1], [22, 0])}px)` }}>
              <div style={{ color: "#64748b", fontSize: 14, fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", marginBottom: 8 }}>{s.l}</div>
              <div style={{ color: s.c, fontSize: 44, fontWeight: 900, letterSpacing: -2 }}>{s.v}<span style={{ fontSize: 22 }}>{s.suf}</span></div>
            </Card>
          );
        })}
      </div>
      {/* 4 dashboards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 18, flex: 1 }}>
        <Card style={{ padding: 20, display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#64748b", fontSize: 13, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>Tickets by Category</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flex: 1 }}>
            {cats.map((b, i) => {
              const grow = interpolate(frame, [20 + i * 4, 40 + i * 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return <div key={i} style={{ flex: 1, height: `${b.h * grow}%`, borderRadius: "8px 8px 0 0", background: b.c }} />;
            })}
          </div>
        </Card>

        <Card style={{ padding: 20, display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#64748b", fontSize: 13, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>Resolution Trend</div>
          <svg viewBox="0 0 300 150" style={{ width: "100%", flex: 1 }} preserveAspectRatio="none">
            <polyline points="0,110 50,80 100,92 150,50 200,62 250,28 300,36" fill="none" stroke="#22d3ee" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={trendDraw} />
          </svg>
        </Card>

        <Card style={{ padding: 20, display: "flex" }}>
          <Donut pct={99.9} color="#a78bfa" label="SLA Met" delay={18} />
        </Card>

        <Card style={{ padding: 20, display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#64748b", fontSize: 13, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>Volume by Priority</div>
          {priority.map((p, i) => {
            const grow = interpolate(frame, [24 + i * 4, 44 + i * 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 700, marginBottom: 5 }}>{p.n}</div>
                <div style={{ height: 12, borderRadius: 6, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${p.w * grow}%`, background: p.c, borderRadius: 6 }} />
                </div>
              </div>
            );
          })}
        </Card>
      </div>
      {/* agent leaderboard strip */}
      <Card style={{ marginTop: 18, padding: "16px 22px", display: "flex", alignItems: "center", gap: 28 }}>
        <div style={{ color: "#64748b", fontSize: 13, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", whiteSpace: "nowrap" }}>Top Agents · 30d</div>
        {agents.map((a, i) => {
          const e = useEnter(22 + i * 3);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: e }}>
              <div style={{ width: 34, height: 34, borderRadius: 999, background: `${a.c}22`, color: a.c, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>{i + 1}</div>
              <div>
                <div style={{ color: "#fff", fontSize: 17, fontWeight: 700 }}>{a.n}</div>
                <div style={{ color: a.c, fontSize: 13, fontWeight: 700 }}>{a.v} resolved</div>
              </div>
            </div>
          );
        })}
      </Card>
    </AbsoluteFill>
  );
};

/* ------------------------------- catalog -------------------------------- */

const CatalogScene: React.FC = () => {
  const frame = useCurrentFrame();
  const items = [
    { icon: <Laptop size={24} />, name: "MacBook Pro 16″", cat: "Hardware", c: "#38bdf8" },
    { icon: <Monitor size={24} />, name: "27″ 4K Monitor", cat: "Hardware", c: "#38bdf8" },
    { icon: <Smartphone size={24} />, name: "iPhone 15 Pro", cat: "Mobile", c: "#22d3ee" },
    { icon: <Mouse size={24} />, name: "MX Master Mouse", cat: "Peripherals", c: "#a78bfa" },
    { icon: <Headphones size={24} />, name: "ANC Headset", cat: "Peripherals", c: "#a78bfa" },
    { icon: <Printer size={24} />, name: "Laser Printer", cat: "Hardware", c: "#38bdf8" },
    { icon: <BookOpen size={24} />, name: "Adobe CC", cat: "Software", c: "#fb7185" },
    { icon: <Video size={24} />, name: "Zoom Pro", cat: "Software", c: "#fb7185" },
    { icon: <Code size={24} />, name: "JetBrains Pack", cat: "Software", c: "#fb7185" },
    { icon: <KeyRound size={24} />, name: "VPN Access", cat: "Access", c: "#34d399" },
    { icon: <Network size={24} />, name: "GitHub Enterprise", cat: "Access", c: "#34d399" },
    { icon: <Cloud size={24} />, name: "AWS Console", cat: "Access", c: "#34d399" },
  ];
  // cursor clicks the VPN card (index 9) → "Requested ✓"
  const CLICK = 200;
  return (
    <AbsoluteFill style={{ padding: "56px 80px", opacity: fadeInOut(frame, S.catalog.dur) }}>
      <SceneTitle accent="#a78bfa" kicker="Service Catalog" title="Self-service requests, auto-approved" icon={<Library color="#a78bfa" size={34} />} badge="24 services available" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(3, 1fr)", gap: 18, flex: 1 }}>
        {items.map((it, i) => {
          const e = useEnter(3 + i * 2.5, 14);
          const isTarget = i === 9;
          const requested = isTarget && frame >= CLICK + 6;
          const lift = isTarget ? interpolate(frame, [CLICK - 4, CLICK + 6], [0, -10], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
          return (
            <Card key={i} glow={requested ? "0 0 24px rgba(52,211,153,0.3)" : undefined} style={{ padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between", opacity: e, border: requested ? "1px solid rgba(52,211,153,0.5)" : "1px solid rgba(255,255,255,0.1)", transform: `translateY(${interpolate(e, [0, 1], [34, 0]) + lift}px) scale(${interpolate(e, [0, 1], [0.94, 1])})` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: `${it.c}22`, color: it.c, display: "flex", alignItems: "center", justifyContent: "center" }}>{it.icon}</div>
                {requested && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(52,211,153,0.18)", color: "#34d399", border: "1px solid rgba(52,211,153,0.4)", borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 800 }}>
                    <CheckCircle2 size={13} /> Requested
                  </div>
                )}
              </div>
              <div>
                <div style={{ color: "#fff", fontSize: 21, fontWeight: 800, marginBottom: 4 }}>{it.name}</div>
                <div style={{ color: "#64748b", fontSize: 13, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase" }}>{it.cat}</div>
              </div>
            </Card>
          );
        })}
      </div>
      <Cursor path={[{ f: 120, x: 500, y: 300 }, { f: 196, x: 560, y: 760 }]} clicks={[CLICK]} />
    </AbsoluteFill>
  );
};

/* --------------------------------- ROI ---------------------------------- */

const RoiScene: React.FC = () => {
  const frame = useCurrentFrame();
  const stats = [
    { v: 45, suf: "%", l: "Reduction in MTTR" },
    { v: 60, suf: "%", l: "Ticket Deflection" },
    { v: 1.2, suf: "M", pre: "$", dec: 1, l: "Annual Savings" },
    { v: 99.9, suf: "%", dec: 1, l: "SLA Compliance" },
  ];
  const ctaE = useEnter(56, 13);
  const pulse = 0.4 + 0.3 * Math.abs(Math.sin(frame / 12));
  return (
    <AbsoluteFill style={{ padding: "0 90px", justifyContent: "center", alignItems: "center", textAlign: "center", opacity: fadeInOut(frame, S.roi.dur, 10, 14) }}>
      <div style={{ color: "#60a5fa", fontSize: 20, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", marginBottom: 14, opacity: useEnter(1) }}>Measurable impact</div>
      <div style={{ color: "#fff", fontSize: 60, fontWeight: 800, letterSpacing: -2, marginBottom: 48, opacity: useEnter(4) }}>Real results, on one platform.</div>
      <div style={{ display: "flex", gap: 24, marginBottom: 60 }}>
        {stats.map((s, i) => {
          const e = useEnter(8 + i * 4);
          return (
            <Card key={i} style={{ width: 310, padding: 36, opacity: e, transform: `translateY(${interpolate(e, [0, 1], [36, 0])}px)` }}>
              <div style={{ color: "#fff", fontSize: 72, fontWeight: 900, letterSpacing: -3 }}>
                <CountUp target={s.v} prefix={s.pre ?? ""} suffix={s.suf} decimals={s.dec ?? 0} delay={8 + i * 4} duration={36} />
              </div>
              <div style={{ color: "#60a5fa", fontSize: 19, fontWeight: 700, marginTop: 10 }}>{s.l}</div>
            </Card>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: ctaE, transform: `scale(${interpolate(ctaE, [0, 1], [0.9, 1])})` }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 ${30 + pulse * 40}px rgba(37,99,235,${pulse + 0.3})` }}>
          <Zap color="#fff" size={32} />
        </div>
        <div style={{ color: "#fff", fontSize: 38, fontWeight: 800 }}>
          Try the interactive demo → <span style={{ color: "#60a5fa" }}>leadaistudio.ai</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* --------------------------- persistent overlays ------------------------ */

// Subtle persistent brand watermark, bottom-left (above the progress bar) so it
// never collides with per-scene titles.
const TopBar: React.FC = () => {
  const frame = useCurrentFrame();
  if (!(frame > S.command.from - 8 && frame < S.roi.from + 4)) return null;
  return (
    <div style={{ position: "absolute", bottom: 26, left: 56, display: "flex", alignItems: "center", gap: 10, opacity: 0.55, zIndex: 5 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Zap color="#fff" size={16} />
      </div>
      <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>
        LeadAIStudio <span style={{ color: "#60a5fa" }}>AIOps</span>
      </div>
    </div>
  );
};

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, DURATION_IN_FRAMES], [0, 100], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 5, background: "rgba(255,255,255,0.06)", zIndex: 5 }}>
      <div style={{ height: "100%", width: `${p}%`, background: "linear-gradient(to right,#2563eb,#22d3ee)" }} />
    </div>
  );
};

/* ------------------------------- root comp ------------------------------ */

export const ProductDemo: React.FC = () => {
  return (
    <Bg>
      {/* Narration voiceover, timeline-aligned to the scene starts. */}
      <Audio src={staticFile("demo-audio.mp3")} volume={1} />
      <Sequence from={S.intro.from} durationInFrames={S.intro.dur}><IntroScene /></Sequence>
      <Sequence from={S.command.from} durationInFrames={S.command.dur}><CommandScene /></Sequence>
      <Sequence from={S.dex.from} durationInFrames={S.dex.dur}><DexScene /></Sequence>
      <Sequence from={S.analytics.from} durationInFrames={S.analytics.dur}><AnalyticsScene /></Sequence>
      <Sequence from={S.catalog.from} durationInFrames={S.catalog.dur}><CatalogScene /></Sequence>
      <Sequence from={S.roi.from} durationInFrames={S.roi.dur}><RoiScene /></Sequence>
      <TopBar />
      <ProgressBar />
    </Bg>
  );
};

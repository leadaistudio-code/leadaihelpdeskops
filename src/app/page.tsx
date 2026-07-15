"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import HeroDemoVideo from "@/components/HeroDemoVideo";
import { LogoMark } from "@/components/Logo";

/*
  Landing page — "Mission Control for IT" identity.
  Fully self-contained: all styles are scoped under `.mc-root` so nothing
  leaks into (or is overridden by) the rest of the app or the marketing
  theme system. Motion (canvas telemetry field, 3D tilt, scroll reveals,
  count-ups) is driven by a single effect and respects prefers-reduced-motion.
*/

const CSS = `
.mc-root{
  --canvas:#ffffff; --surface:#f7f7f7; --surface-2:#fafafa; --panel:#ffffff; --panel-2:#f7f7f7;
  --line:#e5e5e5; --line-soft:#ededed; --text:#0a0a0a; --body:#3a3a3c; --muted:#5a5a5c;
  --dimtext:#6b6b6d; --signal:#00926f; --signal-bright:#00d4a4; --signal-deep:#00b48a;
  --signal-tint:#eafaf5; --signal-border:#b7e6d8; --warn:#c37d0d; --crit:#d45656;
  --mono:var(--font-geist-mono),ui-monospace,"SF Mono","Menlo","Cascadia Code",monospace;
  --sans:var(--font-inter),ui-sans-serif,system-ui,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif;
  position:relative; background:var(--canvas); color:var(--text);
  font-family:var(--sans); -webkit-font-smoothing:antialiased; overflow-x:hidden;
}
.mc-root *{box-sizing:border-box}
.mc-root a{color:inherit;text-decoration:none}
.mc-root h1,.mc-root h2,.mc-root h3{margin:0;letter-spacing:-0.025em;font-weight:700;text-wrap:balance;line-height:1.05}
.mc-root .wrap{max-width:1160px;margin:0 auto;padding:0 28px}
.mc-root .eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--signal);font-weight:600}
.mc-root .btn{display:inline-flex;align-items:center;gap:9px;font-weight:600;font-size:14px;border-radius:999px;padding:13px 22px;cursor:pointer;border:1px solid transparent;transition:transform .18s cubic-bezier(.2,.7,.3,1),box-shadow .25s,background .2s,border-color .2s}
.mc-root .btn:active{transform:translateY(1px) scale(.99)}
.mc-root .btn-primary{background:var(--text);color:#ffffff}
.mc-root .btn-primary:hover{background:#1c1c1e}
.mc-root .btn-ghost{background:var(--canvas);border-color:var(--line);color:var(--text)}
.mc-root .btn-ghost:hover{border-color:#d0d0d0;background:var(--surface)}
.mc-root .arrow{transition:transform .2s}
.mc-root .btn:hover .arrow{transform:translateX(4px)}

.mc-root nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(14px);background:rgba(255,255,255,.8);border-bottom:1px solid var(--line-soft)}
.mc-root .navrow{display:flex;align-items:center;justify-content:space-between;height:66px}
.mc-root .brand{display:flex;align-items:center;gap:11px}
.mc-root .logo{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:var(--signal-bright);color:#03130d;font-weight:900;font-family:var(--mono)}
.mc-root .brand b{font-size:15px;letter-spacing:-0.02em}
.mc-root .navlinks{display:flex;gap:30px;font-size:13.5px;color:var(--muted);font-weight:500}
.mc-root .navlinks a{transition:color .18s}
.mc-root .navlinks a:hover{color:var(--text)}
.mc-root .navcta{display:flex;align-items:center;gap:16px}
@media(max-width:860px){.mc-root .navlinks{display:none}.mc-root .navcta .login{display:none}}

.mc-root .hero{position:relative;padding:96px 0 40px;overflow:hidden;background:linear-gradient(180deg,#f4faf8 0%,#ffffff 62%)}
.mc-root #field{position:absolute;inset:0;width:100%;height:100%;z-index:0;opacity:.5}
.mc-root .hero-glow{position:absolute;z-index:1;pointer-events:none}
.mc-root .glow-a{top:-140px;right:-100px;width:640px;height:640px;background:radial-gradient(circle,rgba(0,212,164,.10),transparent 64%)}
.mc-root .glow-b{bottom:-220px;left:-140px;width:620px;height:620px;background:radial-gradient(circle,rgba(135,168,200,.12),transparent 62%)}
.mc-root .hero-grid{position:relative;z-index:2;display:grid;grid-template-columns:1.08fr .92fr;gap:52px;align-items:center}
@media(max-width:960px){.mc-root .hero-grid{grid-template-columns:1fr;gap:40px}}
.mc-root .badge{display:inline-flex;align-items:center;gap:9px;padding:7px 14px;border:1px solid var(--line);border-radius:999px;background:var(--canvas);font-family:var(--mono);font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-weight:600}
.mc-root .dotlive{position:relative;width:7px;height:7px}
.mc-root .dotlive::before{content:"";position:absolute;inset:0;border-radius:50%;background:var(--signal-bright);animation:mc-ping 1.8s cubic-bezier(0,0,.2,1) infinite}
.mc-root .dotlive::after{content:"";position:absolute;inset:0;border-radius:50%;background:var(--signal-bright)}
@keyframes mc-ping{75%,100%{transform:scale(2.6);opacity:0}}
.mc-root h1.hero-h{font-size:clamp(38px,6vw,66px);margin:26px 0 22px;color:var(--text)}
.mc-root h1.hero-h .accent{color:var(--signal)}
.mc-root .hero-sub{font-size:19px;line-height:1.55;color:var(--body);max-width:540px;margin-bottom:32px}
.mc-root .hero-cta{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:26px}
.mc-root .trust{display:flex;gap:20px;flex-wrap:wrap;font-family:var(--mono);font-size:12px;color:var(--dimtext);align-items:center}
.mc-root .trust b{color:var(--body);font-weight:600}
.mc-root .trust .sep{width:4px;height:4px;border-radius:50%;background:var(--line)}

.mc-root .tiltwrap{perspective:1400px}
.mc-root .status{transform-style:preserve-3d;transition:transform .3s cubic-bezier(.2,.7,.3,1);border-radius:16px;border:1px solid var(--line-soft);background:var(--canvas);box-shadow:0 24px 48px -8px rgba(0,0,0,.12);overflow:hidden}
.mc-root .status .bar{display:flex;align-items:center;gap:8px;padding:13px 16px;border-bottom:1px solid var(--line-soft);background:var(--surface-2)}
.mc-root .status .bar .d{width:9px;height:9px;border-radius:50%}
.mc-root .status .bar .t{margin-left:8px;font-family:var(--mono);font-size:11.5px;color:var(--dimtext)}
.mc-root .status .body{padding:20px}
.mc-root .status .row{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.mc-root .status .lbl{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--dimtext)}
.mc-root .status .big{font-size:34px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums;margin:2px 0 18px;color:var(--text)}
.mc-root .status .big .u{font-size:15px;color:var(--signal);font-weight:600;margin-left:4px}
.mc-root .meter{height:7px;border-radius:99px;background:var(--surface);overflow:hidden;margin-bottom:16px}
.mc-root .meter i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--signal-deep),var(--signal-bright));width:0;transition:width 1.4s cubic-bezier(.2,.7,.3,1)}
.mc-root .healthgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0 6px}
.mc-root .hg{border:1px solid var(--line);border-radius:10px;padding:10px;text-align:center;background:var(--surface-2)}
.mc-root .hg .v{font-size:18px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--text)}
.mc-root .hg .k{font-family:var(--mono);font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--dimtext);margin-top:2px}
.mc-root .heal{display:flex;align-items:center;gap:10px;margin-top:16px;padding:11px 13px;border-radius:11px;background:var(--signal-tint);border:1px solid var(--signal-border)}
.mc-root .heal .ic{width:26px;height:26px;border-radius:7px;background:var(--signal-bright);color:#03130d;display:grid;place-items:center;font-weight:900;font-size:13px;flex-shrink:0}
.mc-root .heal .tx{font-size:12.5px;line-height:1.35}
.mc-root .heal .tx b{color:var(--signal)}
.mc-root .heal .tx span{color:var(--muted)}

.mc-root section{position:relative;z-index:2}
.mc-root .sec{padding:88px 0}
.mc-root .center{text-align:center}
.mc-root .kicker{margin-bottom:16px;display:block}
.mc-root h2.big-h{font-size:clamp(28px,4.4vw,44px);margin-bottom:16px;color:var(--text)}
.mc-root .lede{font-size:18px;color:var(--muted);max-width:620px;line-height:1.55}
.mc-root .center .lede{margin:0 auto}

.mc-root .demoframe{max-width:1000px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid var(--line-soft);box-shadow:0 24px 48px -8px rgba(0,0,0,.12)}
.mc-root .demoframe .top{height:44px;background:var(--surface);display:flex;align-items:center;padding:0 16px;gap:7px;border-bottom:1px solid var(--line-soft)}
.mc-root .demoframe .top .d{width:11px;height:11px;border-radius:50%;background:var(--line)}
.mc-root .demoframe .top .url{margin:0 auto;font-family:var(--mono);font-size:12px;color:var(--dimtext)}

.mc-root .logos{border-top:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft);padding:30px 0;background:var(--surface-2)}
.mc-root .logos .cap{text-align:center;font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--dimtext);margin-bottom:20px}
.mc-root .logorow{display:flex;justify-content:center;gap:44px;flex-wrap:wrap;align-items:center}
.mc-root .logorow span{font-size:18px;font-weight:700;letter-spacing:-.02em;color:var(--muted);opacity:.7;transition:opacity .2s,color .2s}
.mc-root .logorow span:hover{opacity:1;color:var(--text)}

.mc-root .split{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:40px}
@media(max-width:820px){.mc-root .split{grid-template-columns:1fr}}
.mc-root .panel{border:1px solid var(--line);border-radius:16px;padding:28px;background:var(--surface-2)}
.mc-root .panel.bad{border-color:rgba(212,86,86,.28)}
.mc-root .panel.good{border-color:var(--signal-border)}
.mc-root .panel .ph{font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:16px;font-weight:600}
.mc-root .panel.bad .ph{color:var(--crit)}
.mc-root .panel.good .ph{color:var(--signal)}
.mc-root .panel ul{list-style:none;margin:0;padding:0}
.mc-root .panel li{display:flex;gap:12px;padding:11px 0;border-bottom:1px solid var(--line-soft);font-size:14.5px;color:var(--muted)}
.mc-root .panel li:last-child{border-bottom:0}
.mc-root .panel li .mk{flex-shrink:0;width:20px;height:20px;border-radius:6px;display:grid;place-items:center;font-size:12px;font-weight:900}
.mc-root .panel.bad .mk{background:rgba(212,86,86,.12);color:var(--crit)}
.mc-root .panel.good .mk{background:var(--signal-tint);color:var(--signal)}
.mc-root .panel.good li{color:var(--body)}

.mc-root .caps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:44px}
@media(max-width:900px){.mc-root .caps{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.mc-root .caps{grid-template-columns:1fr}}
.mc-root .capwrap{perspective:1000px}
.mc-root .cap{transform-style:preserve-3d;transition:transform .25s cubic-bezier(.2,.7,.3,1),border-color .25s,box-shadow .25s;border:1px solid var(--line);border-radius:12px;padding:24px;background:var(--canvas);height:100%;position:relative}
.mc-root .cap:hover{border-color:var(--signal-border);box-shadow:0 4px 12px rgba(0,0,0,.06)}
.mc-root .cap .ic{width:42px;height:42px;border-radius:11px;display:grid;place-items:center;background:var(--signal-tint);border:1px solid var(--signal-border);margin-bottom:16px;transform:translateZ(30px)}
.mc-root .cap .ic svg{width:21px;height:21px;stroke:var(--signal)}
.mc-root .cap h3{font-size:16.5px;margin-bottom:8px;transform:translateZ(18px);color:var(--text)}
.mc-root .cap p{font-size:13.5px;color:var(--muted);line-height:1.55;margin:0}

.mc-root .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-top:48px;position:relative}
@media(max-width:820px){.mc-root .steps{grid-template-columns:1fr;gap:20px}}
.mc-root .step{padding:0 26px;position:relative}
.mc-root .step:not(:last-child)::after{content:"";position:absolute;right:0;top:34px;width:1px;height:70%;background:linear-gradient(var(--line),transparent)}
@media(max-width:820px){.mc-root .step:not(:last-child)::after{display:none}}
.mc-root .step .no{font-family:var(--mono);font-size:12px;color:var(--signal);letter-spacing:.1em;margin-bottom:14px}
.mc-root .step .node{width:52px;height:52px;border-radius:14px;display:grid;place-items:center;border:1px solid var(--signal-border);background:var(--signal-tint);margin-bottom:18px}
.mc-root .step .node svg{width:24px;height:24px;stroke:var(--signal)}
.mc-root .step h3{font-size:18px;margin-bottom:8px;color:var(--text)}
.mc-root .step p{font-size:14px;color:var(--muted);line-height:1.55;margin:0}

.mc-root .roi{border:1px solid var(--line);border-radius:24px;overflow:hidden;position:relative;background:linear-gradient(135deg,#f1fbf7,#f7f7f7)}
.mc-root .roi .inner{padding:56px 44px;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
@media(max-width:860px){.mc-root .roi .inner{grid-template-columns:1fr;gap:36px;padding:40px 28px}}
.mc-root .stats{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mc-root .stat{border:1px solid var(--line);border-radius:16px;padding:22px;background:var(--canvas)}
.mc-root .stat .v{font-size:40px;font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums;line-height:1;color:var(--text)}
.mc-root .stat .k{font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--signal);margin-top:8px}

.mc-root .price-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:44px;align-items:stretch}
@media(max-width:860px){.mc-root .price-grid{grid-template-columns:1fr;max-width:420px;margin-left:auto;margin-right:auto}}
.mc-root .price{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:12px;padding:28px;background:var(--canvas)}
.mc-root .price.pop{border:2px solid var(--signal-bright);box-shadow:0 8px 24px rgba(0,212,164,.08);position:relative}
.mc-root .price.pop::before{content:"Most popular";position:absolute;top:-11px;left:50%;transform:translateX(-50%);font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#03130d;background:var(--signal-bright);padding:4px 12px;border-radius:999px;font-weight:700}
.mc-root .price .pname{font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--signal);margin-bottom:14px}
.mc-root .price .amt{font-size:44px;font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums;line-height:1;color:var(--text)}
.mc-root .price .amt .per{font-size:14px;color:var(--muted);font-weight:500}
.mc-root .price .pdesc{font-size:13.5px;color:var(--muted);margin:10px 0 22px;line-height:1.5}
.mc-root .price ul{list-style:none;margin:0 0 24px;padding:0;flex:1}
.mc-root .price li{display:flex;gap:10px;padding:8px 0;font-size:13.5px;color:var(--body)}
.mc-root .price li .ck{color:var(--signal);flex-shrink:0;font-weight:800}
.mc-root .price .btn{width:100%;justify-content:center}

.mc-root .quote{max-width:820px;margin:0 auto;text-align:center}
.mc-root .quote blockquote{font-size:clamp(22px,3.2vw,30px);font-weight:700;letter-spacing:-.02em;line-height:1.35;margin:0 0 24px;color:var(--text)}
.mc-root .quote .accent{color:var(--signal)}
.mc-root .quote .who{font-family:var(--mono);font-size:13px;color:var(--muted)}
.mc-root .quote .who b{color:var(--text);font-weight:600}

.mc-root .final{text-align:center;padding:20px 0 40px}
.mc-root .final .box{border:1px solid var(--signal-border);border-radius:24px;padding:56px 40px;background:radial-gradient(600px 300px at 50% 0%,var(--signal-tint),transparent 62%),var(--surface-2)}
.mc-root .final h2{font-size:clamp(30px,4.6vw,46px);margin-bottom:16px;color:var(--text)}
.mc-root .final p{color:var(--muted);font-size:18px;margin:0 auto 30px;max-width:520px}
.mc-root .final .hero-cta{justify-content:center}

.mc-root footer{border-top:1px solid var(--line);padding:52px 0 40px;margin-top:20px}
.mc-root .foot{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:28px}
@media(max-width:760px){.mc-root .foot{grid-template-columns:1fr 1fr}}
.mc-root .foot p{color:var(--dimtext);font-size:13px;max-width:280px;margin:14px 0 0;line-height:1.55}
.mc-root .foot h4{font-size:12px;font-family:var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--dimtext);margin:0 0 14px;font-weight:600}
.mc-root .foot a{display:block;color:var(--muted);font-size:13.5px;padding:5px 0;transition:color .15s}
.mc-root .foot a:hover{color:var(--signal)}
.mc-root .footbar{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-top:40px;padding-top:24px;border-top:1px solid var(--line-soft);font-family:var(--mono);font-size:12px;color:var(--dimtext)}

.mc-root .rv{opacity:0;transform:translateY(26px);transition:opacity .7s cubic-bezier(.2,.7,.3,1),transform .7s cubic-bezier(.2,.7,.3,1)}
.mc-root .rv.in{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){
  .mc-root .rv{opacity:1;transform:none;transition:none}
  .mc-root .dotlive::before{animation:none}
  .mc-root .btn,.mc-root .cap,.mc-root .status{transition:none}
}
`;

export default function LandingPage() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion:reduce)").matches;
    const cleanups: Array<() => void> = [];

    // scroll reveals
    const revs = el.querySelectorAll<HTMLElement>(".rv");
    if (reduce) {
      revs.forEach((r) => r.classList.add("in"));
    } else if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
        { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
      );
      revs.forEach((r) => io.observe(r));
      cleanups.push(() => io.disconnect());
    } else {
      revs.forEach((r) => r.classList.add("in"));
    }

    // count-ups
    const animateCount = (node: HTMLElement) => {
      const target = parseFloat(node.getAttribute("data-count") || "0");
      const pre = node.getAttribute("data-prefix") || "";
      const suf = node.getAttribute("data-suffix") || "";
      const dec = (node.getAttribute("data-count") || "").indexOf(".") >= 0 ? 1 : 0;
      const first = node.childNodes[0];
      if (reduce) { if (first) first.nodeValue = pre + target.toFixed(dec) + suf; return; }
      let start: number | null = null;
      const step = (t: number) => {
        if (start === null) start = t;
        const p = Math.min((t - start) / 1400, 1);
        const e = 1 - Math.pow(1 - p, 3);
        if (first) first.nodeValue = pre + (target * e).toFixed(dec) + suf;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const counters = el.querySelectorAll<HTMLElement>("[data-count]");
    const meters = el.querySelectorAll<HTMLElement>(".meter i");
    if ("IntersectionObserver" in window && !reduce) {
      const co = new IntersectionObserver(
        (es) => es.forEach((e) => { if (e.isIntersecting) { animateCount(e.target as HTMLElement); co.unobserve(e.target); } }),
        { threshold: 0.5 }
      );
      counters.forEach((c) => co.observe(c));
      const mo = new IntersectionObserver(
        (es) => es.forEach((e) => { if (e.isIntersecting) { (e.target as HTMLElement).style.width = e.target.getAttribute("data-w") || ""; mo.unobserve(e.target); } }),
        { threshold: 0.5 }
      );
      meters.forEach((m) => mo.observe(m));
      cleanups.push(() => { co.disconnect(); mo.disconnect(); });
    } else {
      counters.forEach(animateCount);
      meters.forEach((m) => { m.style.width = m.getAttribute("data-w") || ""; });
    }

    // 3D tilt
    if (!reduce && window.matchMedia("(pointer:fine)").matches) {
      const tilt = (card: HTMLElement, max: number) => {
        const wrap = card.parentElement;
        if (!wrap) return;
        const move = (ev: MouseEvent) => {
          const r = card.getBoundingClientRect();
          const px = (ev.clientX - r.left) / r.width - 0.5;
          const py = (ev.clientY - r.top) / r.height - 0.5;
          card.style.transform = `rotateY(${px * max}deg) rotateX(${-py * max}deg)`;
        };
        const leave = () => { card.style.transform = ""; };
        wrap.addEventListener("mousemove", move);
        wrap.addEventListener("mouseleave", leave);
        cleanups.push(() => { wrap.removeEventListener("mousemove", move); wrap.removeEventListener("mouseleave", leave); });
      };
      const st = el.querySelector<HTMLElement>(".status");
      if (st) tilt(st, 9);
      el.querySelectorAll<HTMLElement>(".cap").forEach((c) => tilt(c, 7));
    }

    // hero telemetry field
    const cv = el.querySelector<HTMLCanvasElement>("#field");
    if (cv) {
      const ctx = cv.getContext("2d");
      if (ctx) {
        let W = 0, H = 0, dpr = 1, raf = 0, sweep = 0;
        let nodes: Array<{ x: number; y: number; ph: number; sp: number; warn: boolean }> = [];
        const ripples: Array<{ x: number; y: number; r: number }> = [];
        const build = () => {
          nodes = [];
          const gap = 46, cols = Math.ceil(W / gap) + 1, rows = Math.ceil(H / gap) + 1;
          for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++)
            nodes.push({ x: x * gap + (y % 2 ? gap / 2 : 0), y: y * gap, ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 1.2, warn: Math.random() < 0.012 });
        };
        const size = () => {
          dpr = Math.min(window.devicePixelRatio || 1, 2);
          W = cv.clientWidth; H = cv.clientHeight;
          cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          build();
        };
        const staticFrame = () => {
          ctx.clearRect(0, 0, W, H);
          nodes.forEach((n) => { ctx.beginPath(); ctx.arc(n.x, n.y, n.warn ? 1.7 : 1.2, 0, 6.29); ctx.fillStyle = n.warn ? "rgba(245,177,76,.3)" : "rgba(56,232,176,.12)"; ctx.fill(); });
        };
        const frame = (t: number) => {
          ctx.clearRect(0, 0, W, H);
          const tt = t * 0.001;
          for (const n of nodes) {
            const pulse = (Math.sin(tt * n.sp + n.ph) + 1) / 2;
            let a = 0.05 + pulse * 0.16;
            const col = n.warn ? "245,177,76" : "56,232,176";
            if (n.warn) a = 0.14 + pulse * 0.3;
            ctx.beginPath(); ctx.arc(n.x, n.y, n.warn ? 1.7 : 1.2, 0, 6.29);
            ctx.fillStyle = `rgba(${col},${a})`; ctx.fill();
          }
          sweep += 0.4; if (sweep > W + 200) sweep = -200;
          const g = ctx.createLinearGradient(sweep - 120, 0, sweep + 120, 0);
          g.addColorStop(0, "rgba(56,232,176,0)"); g.addColorStop(0.5, "rgba(56,232,176,0.05)"); g.addColorStop(1, "rgba(56,232,176,0)");
          ctx.fillStyle = g; ctx.fillRect(sweep - 120, 0, 240, H);
          if (Math.random() < 0.012 && ripples.length < 4) { const s = nodes[Math.floor(Math.random() * nodes.length)]; if (s) ripples.push({ x: s.x, y: s.y, r: 0 }); }
          for (let j = ripples.length - 1; j >= 0; j--) {
            const rp = ripples[j]; rp.r += 1.1;
            ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, 6.29);
            ctx.strokeStyle = `rgba(56,232,176,${Math.max(0, 0.4 - rp.r / 120)})`; ctx.lineWidth = 1.2; ctx.stroke();
            if (rp.r > 110) ripples.splice(j, 1);
          }
          raf = requestAnimationFrame(frame);
        };
        size();
        if (reduce) staticFrame(); else raf = requestAnimationFrame(frame);
        let rt: ReturnType<typeof setTimeout>;
        const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { cancelAnimationFrame(raf); size(); if (reduce) staticFrame(); else raf = requestAnimationFrame(frame); }, 180); };
        window.addEventListener("resize", onResize);
        cleanups.push(() => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); });
      }
    }

    return () => cleanups.forEach((c) => c());
  }, []);

  const playDemo = () => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.dispatchEvent(new CustomEvent("leadai:play-demo"));
  };

  return (
    <div className="mc-root" ref={root}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <nav>
        <div className="wrap navrow">
          <div className="brand"><LogoMark size={34} /><b>LeadAIStudio</b></div>
          <div className="navlinks">
            <a href="#platform">Platform</a>
            <a href="#heal">Self-healing</a>
            <a href="#roi">ROI</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="navcta">
            <Link className="login" href="/login" style={{ fontSize: "13.5px", color: "var(--muted)", fontWeight: 500 }}>Log in</Link>
            <Link className="btn btn-primary" href="/dashboard">Start free <span className="arrow">→</span></Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <canvas id="field" />
        <div className="hero-glow glow-a" />
        <div className="hero-glow glow-b" />
        <div className="wrap hero-grid">
          <div className="rv">
            <span className="badge"><span className="dotlive" /> Autonomous IT operations</span>
            <h1 className="hero-h">IT that fixes itself —<br /><span className="accent">before anyone files a ticket.</span></h1>
            <p className="hero-sub">One AI-native platform for your service desk, device experience, knowledge, catalog and assets. It watches every endpoint, predicts failures, and quietly heals them — so your team stops firefighting and your people stop waiting.</p>
            <div className="hero-cta">
              <Link className="btn btn-primary" href="/dashboard">Try the interactive demo <span className="arrow">→</span></Link>
              <a className="btn btn-ghost" href="#demo" onClick={(e) => { e.preventDefault(); playDemo(); }}>▶ &nbsp;Watch it heal · 2 min</a>
            </div>
            <div className="trust">
              <span><b>No credit card</b> to start</span><span className="sep" />
              <span><b>SOC 2</b> aligned</span><span className="sep" />
              <span>Live across <b>40,000+</b> endpoints</span>
            </div>
          </div>

          <div className="rv tiltwrap" style={{ transitionDelay: ".12s" }}>
            <div className="status">
              <div className="bar">
                <span className="d" style={{ background: "#ff5f57" }} /><span className="d" style={{ background: "#febc2e" }} /><span className="d" style={{ background: "#28c840" }} />
                <span className="t">dex · fleet health · live</span>
              </div>
              <div className="body">
                <div className="row"><span className="lbl">Fleet experience score</span><span className="lbl" style={{ color: "var(--signal)" }}>● healthy</span></div>
                <div className="big" data-count="96">0<span className="u">/100</span></div>
                <div className="meter"><i data-w="96%" /></div>
                <div className="healthgrid">
                  <div className="hg"><div className="v" data-count="4128">0</div><div className="k">devices</div></div>
                  <div className="hg"><div className="v" style={{ color: "var(--warn)" }} data-count="7">0</div><div className="k">at risk</div></div>
                  <div className="hg"><div className="v" style={{ color: "var(--signal)" }} data-count="19">0</div><div className="k">auto-healed</div></div>
                </div>
                <div className="heal">
                  <div className="ic">✓</div>
                  <div className="tx"><b>WS-8831 remediated.</b> <span>Memory pressure predicted 4.2h out — cache cleared autonomously. No ticket, no downtime.</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* DEMO */}
      <section className="sec" id="demo" style={{ paddingTop: 20, scrollMarginTop: 90 }}>
        <div className="wrap">
          <div className="rv demoframe">
            <div className="top"><span className="d" /><span className="d" /><span className="d" /><span className="url">leadaistudio.ai</span></div>
            <HeroDemoVideo />
          </div>
        </div>
      </section>

      {/* LOGOS */}
      <section className="logos">
        <div className="wrap">
          <div className="cap">Trusted by IT teams at fast-scaling companies</div>
          <div className="logorow">
            <span>Northwind</span><span>Vertex Labs</span><span>Aperture</span><span>Meridian</span><span>Cloudpeak</span><span>Ironclad</span>
          </div>
        </div>
      </section>

      {/* PROBLEM / SHIFT */}
      <section className="sec" id="platform">
        <div className="wrap">
          <div className="rv"><span className="eyebrow kicker">The shift</span>
            <h2 className="big-h">Stop paying for six tools that don&apos;t talk.</h2>
            <p className="lede">Most IT teams run a tangle of disconnected systems and react to problems after employees feel them. LeadAIStudio replaces the tangle with one intelligent system of record.</p></div>
          <div className="split">
            <div className="rv panel bad">
              <div className="ph">✕ &nbsp;The old way</div>
              <ul>
                <li><span className="mk">✕</span> Ticketing, assets, monitoring &amp; chat in separate silos</li>
                <li><span className="mk">✕</span> You learn about outages when tickets pile up</li>
                <li><span className="mk">✕</span> L1 agents drown in password resets and VPN issues</li>
                <li><span className="mk">✕</span> &ldquo;AIOps&rdquo; that&apos;s a dashboard, not a decision</li>
                <li><span className="mk">✕</span> Employees wait hours for a fix that could be instant</li>
              </ul>
            </div>
            <div className="rv panel good" style={{ transitionDelay: ".1s" }}>
              <div className="ph">✓ &nbsp;The LeadAIStudio way</div>
              <ul>
                <li><span className="mk">✓</span> One platform: desk, DEX, knowledge, catalog &amp; assets</li>
                <li><span className="mk">✓</span> Predict failures from live telemetry, hours ahead</li>
                <li><span className="mk">✓</span> An AI agent that resolves L1 end-to-end with context</li>
                <li><span className="mk">✓</span> AIOps that <em>acts</em> — safe runbooks, executed automatically</li>
                <li><span className="mk">✓</span> Most issues fixed before a human ever notices</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="sec" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <div className="rv center"><span className="eyebrow kicker">The platform</span>
            <h2 className="big-h">Everything IT runs on, made autonomous.</h2>
            <p className="lede">Built for scale, complex org structures, and rigorous compliance — with an AI core that turns signals into action.</p></div>
          <div className="caps">
            {CAPS.map((c, i) => (
              <div className="rv capwrap" key={i}>
                <div className="cap">
                  <div className="ic">{c.icon}</div>
                  <h3>{c.title}</h3><p>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW SELF-HEALING WORKS */}
      <section className="sec" id="heal" style={{ background: "linear-gradient(180deg,#ffffff,#f6faf9,#ffffff)" }}>
        <div className="wrap">
          <div className="rv center"><span className="eyebrow kicker">How self-healing works</span>
            <h2 className="big-h">Detect. Decide. Heal.</h2>
            <p className="lede">A continuous loop running on every endpoint you manage — powered by frontier reasoning, bounded by safe runbooks.</p></div>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="rv step" key={i} style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="no">{s.no}</div>
                <div className="node">{s.icon}</div>
                <h3>{s.title}</h3><p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI */}
      <section className="sec" id="roi">
        <div className="wrap">
          <div className="rv roi">
            <div className="inner">
              <div>
                <span className="eyebrow kicker">Measurable impact</span>
                <h2 className="big-h" style={{ fontSize: "clamp(26px,3.6vw,36px)" }}>It pays for itself in the first quarter.</h2>
                <p className="lede" style={{ fontSize: 16, marginBottom: 26 }}>Fewer tickets, less downtime, tighter SLAs. Autonomous remediation turns your most expensive support hours into work that never has to happen.</p>
                <Link className="btn btn-primary" href="/dashboard">Get your custom ROI analysis <span className="arrow">→</span></Link>
              </div>
              <div className="stats">
                <div className="stat"><div className="v" data-count="45" data-suffix="%">0</div><div className="k">Lower MTTR</div></div>
                <div className="stat"><div className="v" data-count="60" data-suffix="%">0</div><div className="k">Ticket deflection</div></div>
                <div className="stat"><div className="v" data-prefix="$" data-count="1.2" data-suffix="M">0</div><div className="k">Annual savings</div></div>
                <div className="stat"><div className="v" data-count="99.9" data-suffix="%">0</div><div className="k">SLA compliance</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="sec" id="pricing" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <div className="rv center"><span className="eyebrow kicker">Pricing</span>
            <h2 className="big-h">Simple plans that scale with your fleet.</h2>
            <p className="lede">Start free. Upgrade when the savings are obvious — usually the first month.</p></div>
          <div className="price-grid">
            <div className="rv price">
              <div className="pname">Starter</div>
              <div className="amt">$0<span className="per"> / forever</span></div>
              <div className="pdesc">For small teams getting their first taste of autonomous IT.</div>
              <ul>
                <li><span className="ck">✓</span> Up to 50 endpoints</li>
                <li><span className="ck">✓</span> AI service desk &amp; knowledge base</li>
                <li><span className="ck">✓</span> Live device telemetry</li>
                <li><span className="ck">✓</span> Community support</li>
              </ul>
              <Link className="btn btn-ghost" href="/dashboard">Start free</Link>
            </div>
            <div className="rv price pop" style={{ transitionDelay: ".08s" }}>
              <div className="pname">Growth</div>
              <div className="amt">$6<span className="per"> / device / mo</span></div>
              <div className="pdesc">For scaling teams that want issues fixed before they land.</div>
              <ul>
                <li><span className="ck">✓</span> Unlimited endpoints</li>
                <li><span className="ck">✓</span> Autonomous remediation &amp; self-heal</li>
                <li><span className="ck">✓</span> Predictive AIOps &amp; dependency maps</li>
                <li><span className="ck">✓</span> SLA engine &amp; visual flow designer</li>
                <li><span className="ck">✓</span> Priority support</li>
              </ul>
              <Link className="btn btn-primary" href="/dashboard">Start free trial <span className="arrow">→</span></Link>
            </div>
            <div className="rv price" style={{ transitionDelay: ".16s" }}>
              <div className="pname">Enterprise</div>
              <div className="amt">Custom</div>
              <div className="pdesc">For MSPs and regulated orgs with strict isolation needs.</div>
              <ul>
                <li><span className="ck">✓</span> Everything in Growth</li>
                <li><span className="ck">✓</span> MSP multi-tenant isolation</li>
                <li><span className="ck">✓</span> SSO, audit logs &amp; SOC 2</li>
                <li><span className="ck">✓</span> Dedicated success engineer</li>
                <li><span className="ck">✓</span> Custom SLAs &amp; onboarding</li>
              </ul>
              <Link className="btn btn-ghost" href="/p/contact">Contact sales</Link>
            </div>
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="sec" style={{ paddingTop: 20 }}>
        <div className="wrap quote rv">
          <blockquote>&ldquo;We cut our L1 volume by more than half in a quarter. The best tickets are the ones <span className="accent">our team never sees</span> — because the platform already fixed them.&rdquo;</blockquote>
          <div className="who"><b>Head of IT Operations</b> · 4,000-seat enterprise</div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="sec final" id="final">
        <div className="wrap">
          <div className="rv box">
            <span className="eyebrow kicker">Start today</span>
            <h2>Give your fleet an IT team that never sleeps.</h2>
            <p>Deploy the agent, watch your experience score climb, and see your first issue heal itself — usually within the first day.</p>
            <div className="hero-cta">
              <Link className="btn btn-primary" href="/dashboard">Start free <span className="arrow">→</span></Link>
              <Link className="btn btn-ghost" href="/p/contact">Book a live demo</Link>
            </div>
            <div className="trust" style={{ justifyContent: "center", marginTop: 24 }}><span><b>No credit card</b></span><span className="sep" /><span>Set up in <b>minutes</b></span><span className="sep" /><span>Cancel anytime</span></div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="foot">
            <div>
              <div className="brand"><LogoMark size={34} /><b>LeadAIStudio</b></div>
              <p>The AI-native platform for autonomous IT operations. Predict, decide, heal — across every endpoint you manage.</p>
            </div>
            <div><h4>Platform</h4><Link href="/p/aiops-telemetry">AIOps telemetry</Link><Link href="/p/flow-designer">Flow designer</Link><Link href="/p/service-catalog">Service catalog</Link><Link href="/p/pricing">Pricing</Link></div>
            <div><h4>Resources</h4><Link href="/guides/cio-autonomous-it">CIO&apos;s Guide to Autonomous IT</Link><Link href="/p/resources">Resource library</Link></div>
            <div><h4>Company</h4><Link href="/p/about">About</Link><Link href="/p/customers">Customers</Link><Link href="/p/contact">Contact sales</Link></div>
          </div>
          <div className="footbar"><span>© 2026 LEADAISTUDIO · ALL RIGHTS RESERVED</span><span><Link href="/p/privacy">PRIVACY</Link> · <Link href="/p/terms">TERMS</Link></span></div>
        </div>
      </footer>
    </div>
  );
}

const CAPS = [
  { title: "Predictive telemetry", desc: "Model hardware degradation from historical performance and trigger proactive maintenance before it breaks.", icon: (<svg fill="none" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4l3 8 4-16 3 8h4" /></svg>) },
  { title: "Autonomous remediation", desc: "On every alert the AI selects a safe runbook and executes it through your device agents — self-healing, not just alerting.", icon: (<svg fill="none" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>) },
  { title: "AI service desk", desc: "An agent that reads the user's tickets and device health, answers from your knowledge base, and files or resolves tickets with full context.", icon: (<svg fill="none" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5M21 12a9 9 0 11-4.2-7.6L21 5" /></svg>) },
  { title: "Dependency mapping", desc: "See how business services map to physical infrastructure, so incident impact and blast radius are obvious in a glance.", icon: (<svg fill="none" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 7a2 2 0 100-4 2 2 0 000 4zM19 21a2 2 0 100-4 2 2 0 000 4zM5 7v6a4 4 0 004 4h8" /></svg>) },
  { title: "Visual flow designer", desc: "Build approval chains, routing rules and SLA policies in a drag-and-drop canvas — no scripting, no waiting on vendors.", icon: (<svg fill="none" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4M15 3h4a2 2 0 012 2v4M9 21H5a2 2 0 01-2-2v-4M15 21h4a2 2 0 002-2v-4" /></svg>) },
  { title: "MSP-grade isolation", desc: "Strict per-tenant domain separation isolates every client environment — purpose-built for managed service providers.", icon: (<svg fill="none" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 4.4-3 8.5-7 9.5-4-1-7-5.1-7-9.5V7l7-4z" /></svg>) },
];

const STEPS = [
  { no: "01 / SENSE", title: "Detect", desc: "Lightweight agents stream CPU, memory, disk, battery and latency every few seconds. Trends surface risk long before a user feels it.", icon: (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2 12h3l2-7 4 18 3-11h4l2 4h2" /></svg>) },
  { no: "02 / REASON", title: "Decide", desc: "The AI weighs the signal against the fleet, predicts the failure window, and chooses the right remediation — or escalates to a human with full context.", icon: (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3a5 5 0 00-5 5c0 1.6.7 2.8 1.6 3.7C9.6 12.8 10 13.6 10 15h4c0-1.4.4-2.2 1.4-3.3C16.3 10.8 17 9.6 17 8a5 5 0 00-5-5zM10 19h4M11 21h2" /></svg>) },
  { no: "03 / ACT", title: "Heal", desc: "Approved runbooks execute on the endpoint — clear cache, flush DNS, restart services — and the incident closes itself, logged end to end.", icon: (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>) },
];

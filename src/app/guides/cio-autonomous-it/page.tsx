import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Layers,
  CalendarRange,
  LineChart,
  ArrowLeft,
} from "lucide-react";
import { GuideLeadForm } from "@/components/GuideLeadForm";

export const metadata: Metadata = {
  title: "The CIO's Guide to Autonomous IT Operations | Lead AI Studio",
  description:
    "A 24-page framework for moving from reactive ticketing to predictive, self-healing infrastructure — with a maturity model and a 90-day rollout plan.",
};

const HIGHLIGHTS = [
  {
    icon: Layers,
    title: "A 5-level maturity model",
    body: "Locate exactly where each of your service domains sits today — from reactive to fully autonomous.",
  },
  {
    icon: CalendarRange,
    title: "A 90-day rollout plan",
    body: "A week-by-week path to take one domain from instrumented to self-healing in a single quarter.",
  },
  {
    icon: LineChart,
    title: "KPIs & an ROI model",
    body: "The handful of metrics that prove the program to your CFO — deflection, MTTR, and recovered capacity.",
  },
];

const CONTENTS = [
  "The reactive trap and the real cost of firefighting",
  "What \"autonomous IT\" actually means for each stakeholder",
  "The four pillars: observe, reason, act, learn",
  "The Autonomous IT Maturity Model, levels 0–4 in depth",
  "A self-assessment scorecard to baseline honestly",
  "A reference architecture and the telemetry foundation",
  "AIOps and the role of LLM agents (with guardrails)",
  "The 90-day rollout plan, phase by phase",
];

export default function CioGuidePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/40">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mt-8 grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-start">
          {/* Left: the pitch */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              <BookOpen className="h-3.5 w-3.5" />
              CIO Playbook · Free PDF
            </span>

            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              The CIO&apos;s Guide to Autonomous IT Operations
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              A 24-page framework for moving from reactive ticketing to predictive, self-healing
              infrastructure — with a maturity model and a 90-day rollout plan.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {HIGHLIGHTS.map((h) => (
                <div
                  key={h.title}
                  className="rounded-2xl border border-slate-200 bg-white/70 p-5 backdrop-blur"
                >
                  <h.icon className="h-6 w-6 text-indigo-600" />
                  <h3 className="mt-3 text-sm font-semibold text-slate-900">{h.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{h.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                What&apos;s inside
              </h2>
              <ul className="mt-4 space-y-2.5">
                {CONTENTS.map((c) => (
                  <li key={c} className="flex items-start gap-3 text-sm text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: the gated form (sticky on desktop) */}
          <div className="lg:sticky lg:top-10">
            <GuideLeadForm source="guide-page" />
          </div>
        </div>
      </div>
    </main>
  );
}

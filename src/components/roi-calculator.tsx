"use client";

import { useMemo, useState } from "react";
import { TrendingUp, Clock, Ticket, Wallet } from "lucide-react";

// Industry benchmarks used for the model. Conservative, defensible defaults
// so the number we show holds up in a procurement review.
const DEFLECTION_RATE = 0.6; // share of L1 tickets resolved autonomously
const MTTR_REDUCTION = 0.45; // reduction in mean time to resolution
const MINUTES_PER_TICKET = 18; // avg agent handle time for an L1 ticket
const PLATFORM_COST_PER_EMPLOYEE_YEAR = 18; // list price assumption for payback

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1000)}K`;
  return `$${Math.round(n)}`;
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function Field({
  label,
  value,
  min,
  max,
  step,
  prefix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-[#3a3a3c]">{label}</label>
        <span className="text-sm font-bold text-[#00926f] tabular-nums">
          {prefix}
          {formatNumber(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none bg-[#e5e5e5] accent-[#00d4a4] cursor-pointer"
      />
    </div>
  );
}

export default function RoiCalculator() {
  const [employees, setEmployees] = useState(2000);
  const [ticketsPerEmployee, setTicketsPerEmployee] = useState(1.4); // per month
  const [costPerTicket, setCostPerTicket] = useState(22); // fully loaded L1 cost

  const results = useMemo(() => {
    const monthlyTickets = employees * ticketsPerEmployee;
    const annualTickets = monthlyTickets * 12;

    const deflectedTickets = annualTickets * DEFLECTION_RATE;
    const deflectionSavings = deflectedTickets * costPerTicket;

    // Remaining tickets still cost money, but they resolve faster, freeing
    // agent capacity we value at the same per-ticket cost.
    const remainingTickets = annualTickets - deflectedTickets;
    const efficiencySavings = remainingTickets * costPerTicket * MTTR_REDUCTION;

    const annualSavings = deflectionSavings + efficiencySavings;
    const hoursSaved = (deflectedTickets * MINUTES_PER_TICKET) / 60;

    const platformCost = employees * PLATFORM_COST_PER_EMPLOYEE_YEAR;
    const paybackMonths = Math.max(
      0.5,
      platformCost / (annualSavings / 12)
    );

    return {
      annualSavings,
      deflectedTickets,
      hoursSaved,
      paybackMonths,
    };
  }, [employees, ticketsPerEmployee, costPerTicket]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
      {/* Inputs */}
      <div className="bg-white border border-[#e5e5e5] rounded-xl p-8">
        <h3 className="text-lg font-bold text-[#0a0a0a] mb-1">Your environment</h3>
        <p className="text-sm text-[#6b6b6d] mb-8">
          Drag the sliders to match your organization. Numbers update instantly.
        </p>
        <div className="space-y-8">
          <Field
            label="Number of employees"
            value={employees}
            min={100}
            max={50000}
            step={100}
            onChange={setEmployees}
          />
          <Field
            label="IT tickets per employee / month"
            value={ticketsPerEmployee}
            min={0.5}
            max={5}
            step={0.1}
            onChange={setTicketsPerEmployee}
          />
          <Field
            label="Fully-loaded cost per L1 ticket"
            value={costPerTicket}
            min={8}
            max={60}
            step={1}
            prefix="$"
            onChange={setCostPerTicket}
          />
        </div>
        <p className="text-xs text-[#6b6b6d] mt-8 leading-relaxed">
          Model assumes {Math.round(DEFLECTION_RATE * 100)}% L1 deflection and a{" "}
          {Math.round(MTTR_REDUCTION * 100)}% MTTR reduction — the median results
          across deployed LeadAIStudio enterprises.
        </p>
      </div>

      {/* Results */}
      <div className="bg-white border-2 border-[#00d4a4] rounded-xl p-8 shadow-[0_8px_24px_rgba(0,212,164,0.08)] text-[#0a0a0a] flex flex-col">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#00926f] mb-2">
          Estimated first-year impact
        </p>
        <div className="text-5xl font-semibold mb-1 tabular-nums tracking-[-0.02em]">
          {formatCurrency(results.annualSavings)}
        </div>
        <p className="text-[#6b6b6d] text-sm mb-8">in projected annual savings</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Metric
            icon={<Ticket className="w-4 h-4" />}
            value={formatNumber(results.deflectedTickets)}
            label="Tickets deflected / yr"
          />
          <Metric
            icon={<Clock className="w-4 h-4" />}
            value={formatNumber(results.hoursSaved)}
            label="Agent hours freed"
          />
          <Metric
            icon={<TrendingUp className="w-4 h-4" />}
            value={`${results.paybackMonths.toFixed(1)} mo`}
            label="Payback period"
          />
        </div>

        <div className="mt-auto bg-[#f7f7f7] border border-[#e5e5e5] rounded-xl p-5 flex items-start gap-3">
          <Wallet className="w-5 h-5 text-[#00926f] shrink-0 mt-0.5" />
          <p className="text-sm text-[#3a3a3c] leading-relaxed">
            Most customers reach full payback in under a quarter, then compound
            savings every year after.
          </p>
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-[#f7f7f7] border border-[#e5e5e5] rounded-xl p-4">
      <div className="w-7 h-7 rounded bg-[#00d4a4]/15 text-[#00926f] flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="text-xl font-bold tabular-nums text-[#0a0a0a]">{value}</div>
      <div className="text-xs text-[#6b6b6d] mt-1 leading-snug">{label}</div>
    </div>
  );
}

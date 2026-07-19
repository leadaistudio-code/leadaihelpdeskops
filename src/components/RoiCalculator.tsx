"use client";

import { useState } from "react";

// Honest, transparent ROI estimate. Replaces the old fabricated stat tiles
// ("$1.2M annual savings" etc.). Every number here is computed from the
// visitor's own inputs with the assumptions shown on screen — no hidden claims.

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function RoiCalculator() {
  const [endpoints, setEndpoints] = useState(250);
  const [tickets, setTickets] = useState(400);
  const [costPerTicket, setCostPerTicket] = useState(22);
  const [deflection, setDeflection] = useState(30);

  const deflected = Math.round((tickets * deflection) / 100);
  const grossMonthly = deflected * costPerTicket;
  const platformMonthly = endpoints * 6; // Growth plan: $6 / device / mo
  const netMonthly = grossMonthly - platformMonthly;
  const netAnnual = netMonthly * 12;

  const num = (v: string, fallback = 0) => {
    const n = Number(v.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : fallback;
  };

  return (
    <div className="roicalc">
      <div className="roicalc-inputs">
        <label className="roicalc-field">
          <span>Endpoints you manage</span>
          <input inputMode="numeric" value={endpoints} onChange={(e) => setEndpoints(num(e.target.value))} />
        </label>
        <label className="roicalc-field">
          <span>Support tickets / month</span>
          <input inputMode="numeric" value={tickets} onChange={(e) => setTickets(num(e.target.value))} />
        </label>
        <label className="roicalc-field">
          <span>Loaded cost to resolve a ticket</span>
          <input inputMode="numeric" value={`$${costPerTicket}`} onChange={(e) => setCostPerTicket(num(e.target.value))} />
        </label>
        <label className="roicalc-field">
          <span>
            Ticket deflection rate <b>{deflection}%</b>
          </span>
          <input
            type="range"
            min={10}
            max={50}
            value={deflection}
            onChange={(e) => setDeflection(num(e.target.value))}
            aria-label="Ticket deflection rate"
          />
          <small>An assumption you control — the share of L1 tickets self-service resolves before an agent touches them.</small>
        </label>
      </div>

      <div className="roicalc-out">
        <div className="roicalc-headline">
          <div className="roicalc-big">${fmt(Math.max(0, netAnnual))}</div>
          <div className="roicalc-cap">estimated net savings / year</div>
        </div>
        <ul className="roicalc-break">
          <li><span>{fmt(deflected)}</span> tickets deflected / month</li>
          <li><span>${fmt(grossMonthly)}</span> agent time saved / month</li>
          <li><span>− ${fmt(platformMonthly)}</span> platform cost / month ({fmt(endpoints)} × $6)</li>
          <li className="roicalc-net"><span>${fmt(Math.max(0, netMonthly))}</span> net / month</li>
        </ul>
        <p className="roicalc-note">
          An estimate from your inputs, not a guarantee. Deflection depends on your knowledge base and issue mix.
        </p>
      </div>
    </div>
  );
}

import PDFDocument from "pdfkit";

// ---------------------------------------------------------------------------
// "The CIO's Guide to Autonomous IT Operations" — a 24-page lead-magnet PDF
// rendered on the fly with pdfkit. The cover is personalised for the lead who
// requested it. Uses only pdfkit's built-in Helvetica family (no embedded
// fonts) so it works in a serverless/Node runtime without font files.
// ---------------------------------------------------------------------------

export type GuideLead = {
  name: string;
  company: string;
  jobTitle: string;
};

// Brand palette.
const INK = "#0F172A";
const PRIMARY = "#4F46E5";
const ACCENT = "#6366F1";
const MUTED = "#64748B";
const LINE = "#E2E8F0";
const TINT = "#EEF2FF";
const WHITE = "#FFFFFF";

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 56;
const CONTENT_W = PAGE.width - MARGIN * 2;

const BRAND = "Lead AI Studio";
const TITLE = "The CIO's Guide to Autonomous IT Operations";

type Doc = InstanceType<typeof PDFDocument>;

// ---- low-level helpers ----------------------------------------------------

function rule(doc: Doc, y: number, color = LINE) {
  doc.save().moveTo(MARGIN, y).lineTo(PAGE.width - MARGIN, y).lineWidth(1).strokeColor(color).stroke().restore();
}

function eyebrow(doc: Doc, text: string) {
  doc.fillColor(PRIMARY).font("Helvetica-Bold").fontSize(10).text(text.toUpperCase(), MARGIN, doc.y, {
    characterSpacing: 1.5,
  });
  doc.moveDown(0.4);
}

function heading(doc: Doc, text: string) {
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(22).text(text, MARGIN, doc.y, { width: CONTENT_W });
  doc.moveDown(0.6);
}

function subheading(doc: Doc, text: string) {
  doc.moveDown(0.4);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(13).text(text, MARGIN, doc.y, { width: CONTENT_W });
  doc.moveDown(0.3);
}

function paragraph(doc: Doc, text: string) {
  doc.fillColor("#334155").font("Helvetica").fontSize(11).text(text, MARGIN, doc.y, {
    width: CONTENT_W,
    align: "left",
    lineGap: 3,
  });
  doc.moveDown(0.6);
}

function bullet(doc: Doc, text: string, label?: string) {
  const x = MARGIN;
  const startY = doc.y;
  doc.save().circle(x + 3, startY + 6, 2.2).fill(ACCENT).restore();
  const indent = x + 14;
  doc.fillColor("#334155").font("Helvetica").fontSize(11);
  if (label) {
    doc.font("Helvetica-Bold").fillColor(INK).text(label + "  ", indent, startY, { continued: true, width: CONTENT_W - 14 });
    doc.font("Helvetica").fillColor("#334155").text(text, { width: CONTENT_W - 14, lineGap: 2 });
  } else {
    doc.text(text, indent, startY, { width: CONTENT_W - 14, lineGap: 2 });
  }
  doc.moveDown(0.45);
}

// A soft tinted callout box. Returns nothing; advances doc.y past the box.
function callout(doc: Doc, title: string, body: string) {
  const padX = 16;
  const padY = 14;
  const innerW = CONTENT_W - padX * 2;
  const titleH = title ? 16 : 0;
  doc.font("Helvetica").fontSize(11);
  const bodyH = doc.heightOfString(body, { width: innerW, lineGap: 3 });
  const boxH = padY * 2 + titleH + bodyH;
  const y = doc.y;
  doc.save().roundedRect(MARGIN, y, CONTENT_W, boxH, 8).fill(TINT).restore();
  doc.save().roundedRect(MARGIN, y, 4, boxH, 2).fill(PRIMARY).restore();
  let ty = y + padY;
  if (title) {
    doc.fillColor(PRIMARY).font("Helvetica-Bold").fontSize(11).text(title, MARGIN + padX, ty, { width: innerW });
    ty += titleH;
  }
  doc.fillColor("#334155").font("Helvetica").fontSize(11).text(body, MARGIN + padX, ty, { width: innerW, lineGap: 3 });
  doc.y = y + boxH;
  doc.moveDown(0.8);
}

// ---- page chrome ----------------------------------------------------------

// Starts a fresh content page with a running header and resets the cursor.
function contentPage(doc: Doc, section: string) {
  doc.addPage();
  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8).text(BRAND.toUpperCase(), MARGIN, 36, {
    characterSpacing: 1.2,
  });
  doc.fillColor(MUTED).font("Helvetica").fontSize(8).text(section, MARGIN, 36, {
    width: CONTENT_W,
    align: "right",
  });
  rule(doc, 52);
  doc.x = MARGIN;
  doc.y = 76;
}

// ---- composite components -------------------------------------------------

function maturityRow(doc: Doc, level: string, name: string, desc: string) {
  const rowY = doc.y;
  const badge = 30;
  doc.save().roundedRect(MARGIN, rowY, badge, badge, 6).fill(PRIMARY).restore();
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(13).text(level, MARGIN, rowY + 8, {
    width: badge,
    align: "center",
  });
  const tx = MARGIN + badge + 12;
  const tw = CONTENT_W - badge - 12;
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(12).text(name, tx, rowY + 1, { width: tw });
  doc.fillColor(MUTED).font("Helvetica").fontSize(10).text(desc, tx, doc.y + 1, { width: tw, lineGap: 1.5 });
  doc.moveDown(0.7);
}

// A 90-day phase header band.
function phaseBand(doc: Doc, days: string, title: string) {
  const h = 46;
  const y = doc.y;
  doc.save().roundedRect(MARGIN, y, CONTENT_W, h, 8).fill(INK).restore();
  doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(9).text(days.toUpperCase(), MARGIN + 16, y + 10, {
    characterSpacing: 1.2,
  });
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(15).text(title, MARGIN + 16, y + 22);
  doc.y = y + h;
  doc.moveDown(0.8);
}

// ---- the document ---------------------------------------------------------

export function buildCioGuidePdf(lead: GuideLead): Promise<Buffer> {
  const doc = new PDFDocument({
    size: [PAGE.width, PAGE.height],
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    bufferPages: true,
    info: {
      Title: TITLE,
      Author: BRAND,
      Subject: "A framework for moving from reactive ticketing to predictive, self-healing infrastructure.",
      Keywords: "AIOps, autonomous IT, ITSM, maturity model, CIO",
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  renderCover(doc, lead);
  renderContents(doc);
  renderForeword(doc, lead);
  renderExecSummary(doc);
  renderReactiveTrap(doc);
  renderCostOfReactive(doc);
  renderWhatIsAutonomous(doc);
  renderFourPillars(doc);
  renderMaturityOverview(doc);
  renderLevel(doc, "0", "Reactive", "level0");
  renderLevel(doc, "1", "Instrumented", "level1");
  renderLevel(doc, "2", "Proactive", "level2");
  renderLevel(doc, "3", "Predictive", "level3");
  renderLevel(doc, "4", "Autonomous", "level4");
  renderScorecard(doc);
  renderArchitecture(doc);
  renderTelemetry(doc);
  renderAgents(doc);
  renderRolloutOverview(doc);
  renderPhase1(doc);
  renderPhase2(doc);
  renderPhase3(doc);
  renderMetrics(doc);
  renderNextSteps(doc, lead);

  stampFooters(doc);
  doc.end();
  return done;
}

// Add page numbers + footer rule to every page except the cover.
function stampFooters(doc: Doc) {
  const range = doc.bufferedPageRange();
  const total = range.count;
  for (let i = 1; i < total; i++) {
    doc.switchToPage(range.start + i);
    // Writing in the footer zone sits below the page's bottom margin, which
    // would make pdfkit auto-add a blank page per footer. Zero the bottom
    // margin while we stamp so the text stays on the current page.
    doc.page.margins.bottom = 0;
    const fy = PAGE.height - 44;
    rule(doc, fy, LINE);
    doc.fillColor(MUTED).font("Helvetica").fontSize(8).text(TITLE, MARGIN, fy + 8, { width: CONTENT_W * 0.7 });
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8).text(`${i + 1} / ${total}`, MARGIN, fy + 8, {
      width: CONTENT_W,
      align: "right",
    });
  }
}

// ---- pages ----------------------------------------------------------------

function renderCover(doc: Doc, lead: GuideLead) {
  // Dark hero band across the top two-thirds.
  doc.save().rect(0, 0, PAGE.width, 560).fill(INK).restore();
  doc.save().rect(0, 540, PAGE.width, 20).fill(PRIMARY).restore();

  doc.fillColor("#A5B4FC").font("Helvetica-Bold").fontSize(11).text(BRAND.toUpperCase(), MARGIN, 80, {
    characterSpacing: 2,
  });

  doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(12).text("CIO PLAYBOOK", MARGIN, 150, {
    characterSpacing: 2,
  });
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(40).text(
    "The CIO's Guide to Autonomous IT Operations",
    MARGIN,
    176,
    { width: CONTENT_W, lineGap: 2 }
  );

  doc.fillColor("#CBD5E1").font("Helvetica").fontSize(14).text(
    "A 24-page framework for moving from reactive ticketing to predictive, self-healing infrastructure — with a maturity model and a 90-day rollout plan.",
    MARGIN,
    doc.y + 18,
    { width: CONTENT_W * 0.92, lineGap: 4 }
  );

  // Three chips.
  const chips = ["Maturity Model", "90-Day Rollout", "ROI & KPIs"];
  let cx = MARGIN;
  const chipY = 470;
  doc.font("Helvetica-Bold").fontSize(10);
  for (const c of chips) {
    const w = doc.widthOfString(c) + 24;
    doc.save().roundedRect(cx, chipY, w, 26, 13).lineWidth(1).strokeColor("#475569").stroke().restore();
    doc.fillColor("#E2E8F0").text(c, cx + 12, chipY + 8);
    cx += w + 10;
  }

  // Personalised "prepared for" block below the band.
  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(9).text("PREPARED FOR", MARGIN, 600, {
    characterSpacing: 1.5,
  });
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(16).text(lead.name, MARGIN, doc.y + 4);
  doc.fillColor(MUTED).font("Helvetica").fontSize(12).text(`${lead.jobTitle} · ${lead.company}`, MARGIN, doc.y + 2);

  doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(
    `© ${BRAND}. This guide is provided for ${lead.company} for internal strategic use.`,
    MARGIN,
    PAGE.height - 70,
    { width: CONTENT_W }
  );
}

function renderContents(doc: Doc) {
  contentPage(doc, "Contents");
  eyebrow(doc, "What's inside");
  heading(doc, "Contents");

  const items: [string, string][] = [
    ["01", "Foreword"],
    ["02", "Executive summary"],
    ["03", "The reactive trap"],
    ["04", "The real cost of reactive IT"],
    ["05", "What \"autonomous IT\" actually means"],
    ["06", "The four pillars of autonomous operations"],
    ["07", "The Autonomous IT Maturity Model"],
    ["08", "Levels 0–4, in depth"],
    ["09", "Maturity self-assessment scorecard"],
    ["10", "Reference architecture"],
    ["11", "The telemetry foundation"],
    ["12", "AIOps and the role of LLM agents"],
    ["13", "The 90-day rollout plan"],
    ["14", "Measuring success: KPIs & ROI"],
    ["15", "Your next steps"],
  ];
  for (const [n, label] of items) {
    const y = doc.y;
    doc.fillColor(PRIMARY).font("Helvetica-Bold").fontSize(11).text(n, MARGIN, y, { width: 28 });
    doc.fillColor(INK).font("Helvetica").fontSize(12).text(label, MARGIN + 34, y, { width: CONTENT_W - 34 });
    doc.moveDown(0.55);
  }
}

function renderForeword(doc: Doc, lead: GuideLead) {
  contentPage(doc, "Foreword");
  eyebrow(doc, "Foreword");
  heading(doc, "The mandate has changed");
  paragraph(
    doc,
    `${lead.name}, the role of IT has quietly inverted. For two decades, service desks were measured by how quickly they could react — how fast a ticket was acknowledged, routed, and closed. That model made sense when incidents were rare and infrastructure was static. It no longer holds.`
  );
  paragraph(
    doc,
    "Today's estates are sprawling, ephemeral, and interdependent. A single degraded dependency can cascade across hundreds of services before a human ever opens a ticket. Reacting faster is not the answer; the answer is to stop reacting at all wherever possible — to detect, diagnose, and remediate before a person is ever involved."
  );
  paragraph(
    doc,
    "This guide lays out a pragmatic path from the reactive ticket queue you run today to an autonomous operation that prevents, predicts, and heals. It is deliberately concrete: a five-level maturity model to locate where you are, and a 90-day plan to take the first decisive steps."
  );
  callout(
    doc,
    "How to use this guide",
    "Read Part One with your leadership team to align on vocabulary and ambition. Use the scorecard on page 16 to baseline honestly. Then hand the 90-day plan to the engineering lead who will own execution."
  );
}

function renderExecSummary(doc: Doc) {
  contentPage(doc, "Executive summary");
  eyebrow(doc, "Executive summary");
  heading(doc, "The five-minute version");
  bullet(doc, "Reactive ticketing optimises the wrong thing. Speed-to-close rewards firefighting and hides systemic failure. The goal is fewer tickets, not faster ones.", "The problem.");
  bullet(doc, "Autonomy is a spectrum, not a switch. Most organisations sit at Level 1–2: instrumented but still human-driven. The leap to value is Level 3 (predictive) and Level 4 (self-healing).", "The model.");
  bullet(doc, "Telemetry is the foundation. You cannot automate what you cannot observe. Unified, high-quality event and topology data is the prerequisite for every later stage.", "The foundation.");
  bullet(doc, "LLM agents change the economics. Tasks that were too varied to script — triage, correlation, summarisation, first-line remediation — are now automatable with guardrails.", "The catalyst.");
  bullet(doc, "90 days is enough to prove it. A focused first quarter can move one service domain to Level 3 and demonstrate hard ROI: deflected tickets, reduced MTTR, and recovered engineering hours.", "The plan.");
  callout(
    doc,
    "The headline number",
    "Organisations that reach Level 3 typically deflect 30–50% of inbound tickets and cut mean-time-to-resolution by 40–60% on instrumented services within two quarters."
  );
}

function renderReactiveTrap(doc: Doc) {
  contentPage(doc, "Part One · The problem");
  eyebrow(doc, "Part one · the problem");
  heading(doc, "The reactive trap");
  paragraph(
    doc,
    "Reactive IT is a local optimum. Each individual improvement — a faster routing rule, a bigger on-call rota, a tighter SLA — makes the existing model run better without questioning whether the model itself is right. Teams get very good at closing tickets and never ask why the tickets exist."
  );
  subheading(doc, "Three symptoms you already recognise");
  bullet(doc, "The same incident recurs under different ticket numbers because nobody owns the underlying fix — only the queue.", "Repeat offenders.");
  bullet(doc, "Engineers spend their most productive hours on triage and status updates rather than on eliminating root causes.", "Toil tax.");
  bullet(doc, "Leadership sees green SLA dashboards while users experience daily friction the metrics never capture.", "Dashboard mirage.");
  paragraph(
    doc,
    "The trap is that all three feel like staffing problems. They are not. They are architecture and operating-model problems that more headcount only postpones."
  );
}

function renderCostOfReactive(doc: Doc) {
  contentPage(doc, "Part One · The problem");
  eyebrow(doc, "Part one · the problem");
  heading(doc, "The real cost of reactive IT");
  paragraph(
    doc,
    "The visible cost of an incident is the time to resolve it. The real cost is everything that model quietly consumes around it."
  );
  subheading(doc, "Where the money actually goes");
  bullet(doc, "Every escalation pulls a senior engineer out of deep work. The context-switch tax often exceeds the incident's own duration.", "Interrupted experts.");
  bullet(doc, "Knowledge lives in the heads of whoever happened to be on call. When they leave, resolution time for their specialty silently doubles.", "Tribal knowledge.");
  bullet(doc, "Users route around slow IT — shadow tooling, unmanaged SaaS, and workarounds that become tomorrow's security incidents.", "Shadow demand.");
  callout(
    doc,
    "A simple model",
    "If 12 engineers each lose 8 hours a week to reactive toil, that is roughly 5,000 engineering hours a year — more than two full-time roles — spent on work that automation could absorb."
  );
  paragraph(
    doc,
    "Autonomy does not just lower these costs; it converts them into compounding capacity. Every automated resolution is a fix that never has to be made again."
  );
}

function renderWhatIsAutonomous(doc: Doc) {
  contentPage(doc, "Part Two · The model");
  eyebrow(doc, "Part two · the model");
  heading(doc, "What \"autonomous IT\" actually means");
  paragraph(
    doc,
    "Autonomous IT is not \"no humans.\" It is a system that handles the routine without humans, and escalates the genuinely novel to them with full context attached. Humans move from operating the system to supervising and improving it."
  );
  subheading(doc, "A working definition");
  callout(
    doc,
    "Autonomous IT operations",
    "An operating model in which observation, diagnosis, and remediation of known failure classes happen automatically and safely, while humans focus on novel problems, policy, and continuous improvement."
  );
  subheading(doc, "What changes for each stakeholder");
  bullet(doc, "Sets policy and risk tolerance, then reviews outcomes — not individual tickets.", "The CIO.");
  bullet(doc, "Designs and curates automations and guardrails instead of executing runbooks by hand.", "The engineer.");
  bullet(doc, "Gets answers and fixes in seconds through self-service and deflection, often without filing a ticket.", "The employee.");
}

function renderFourPillars(doc: Doc) {
  contentPage(doc, "Part Two · The model");
  eyebrow(doc, "Part two · the model");
  heading(doc, "The four pillars");
  paragraph(doc, "Every autonomous operation rests on four capabilities. Weakness in any one caps the maturity of the whole.");
  subheading(doc, "1 · Observe");
  paragraph(doc, "Unified telemetry across infrastructure, applications, identity, and endpoints — plus a live topology that explains how they depend on one another.");
  subheading(doc, "2 · Reason");
  paragraph(doc, "Correlation, anomaly detection, and LLM-driven diagnosis that turn a storm of raw events into a single explained problem with a probable cause.");
  subheading(doc, "3 · Act");
  paragraph(doc, "A library of safe, reversible remediations — restart, scale, reroute, reprovision, notify — gated by policy and approvals proportional to blast radius.");
  subheading(doc, "4 · Learn");
  paragraph(doc, "Every incident and every action feeds back into detection and runbooks, so the system's competence compounds over time rather than resetting with each on-call rotation.");
}

function renderMaturityOverview(doc: Doc) {
  contentPage(doc, "Part Three · Maturity model");
  eyebrow(doc, "Part three · maturity model");
  heading(doc, "The Autonomous IT Maturity Model");
  paragraph(
    doc,
    "Five levels describe the journey from pure reaction to true autonomy. Most organisations are honestly at Level 1 or 2. The model is not a ladder you climb once — different service domains will sit at different levels at the same time."
  );
  doc.moveDown(0.2);
  maturityRow(doc, "0", "Reactive", "Humans detect and fix everything. Tooling is a ticket queue. Knowledge is tribal.");
  maturityRow(doc, "1", "Instrumented", "Monitoring exists but is siloed. Alerts are noisy; humans still correlate and decide.");
  maturityRow(doc, "2", "Proactive", "Thresholds and basic automation catch known issues early. Runbooks are documented.");
  maturityRow(doc, "3", "Predictive", "Models forecast failures and correlate across domains. Remediation is suggested or semi-automated.");
  maturityRow(doc, "4", "Autonomous", "Known failure classes self-heal end to end. Humans handle novelty and govern the system.");
  callout(
    doc,
    "Read this honestly",
    "Maturity is defined by your worst routine incident, not your best demo. If a single common failure still requires a human at 3 a.m., that domain is not yet Level 3."
  );
}

const LEVEL_COPY: Record<string, { tagline: string; signs: string[]; move: string }> = {
  level0: {
    tagline: "Humans are the detection system.",
    signs: [
      "Incidents are discovered when a user complains, not by a monitor.",
      "Resolution depends entirely on who is on call and what they happen to know.",
      "There is no shared record of how recurring problems were fixed last time.",
    ],
    move: "Stand up basic monitoring and a single source of truth for incidents and knowledge. The goal of this stage is simply to see.",
  },
  level1: {
    tagline: "You can see, but you cannot yet reason.",
    signs: [
      "Monitoring exists per-team but the signals are fragmented and noisy.",
      "Alert fatigue is real; important events are lost in the volume.",
      "Humans manually correlate alerts across tools to find the real problem.",
    ],
    move: "Consolidate telemetry into one place and add topology, so an event can be understood in the context of what depends on it.",
  },
  level2: {
    tagline: "Known problems are caught early — by rules.",
    signs: [
      "Thresholds and simple automations catch well-understood issues before users do.",
      "Runbooks are written down and mostly followed.",
      "Automation is brittle: it handles the expected case and breaks on variation.",
    ],
    move: "Introduce correlation and anomaly detection so you catch the unknown-but-related, not only the pre-defined threshold breach.",
  },
  level3: {
    tagline: "The system anticipates and explains.",
    signs: [
      "Models forecast capacity, saturation, and likely failures before they occur.",
      "Cross-domain correlation collapses event storms into a single explained cause.",
      "Remediation is recommended automatically; a human approves and applies it.",
    ],
    move: "Move from suggested to automated remediation for low-blast-radius, reversible actions — with policy and audit around every action.",
  },
  level4: {
    tagline: "Routine failures heal themselves.",
    signs: [
      "Known failure classes are detected, diagnosed, and remediated with no human in the loop.",
      "Humans are paged only for genuinely novel problems, with full context attached.",
      "Every automated action is logged, reversible, and feeds continuous improvement.",
    ],
    move: "Expand the catalogue of self-healing scenarios and tighten governance. The frontier now is breadth of coverage, not basic capability.",
  },
};

function renderLevel(doc: Doc, num: string, name: string, key: string) {
  contentPage(doc, `Maturity · Level ${num}`);
  eyebrow(doc, `Maturity model · level ${num}`);
  heading(doc, `Level ${num}: ${name}`);
  const copy = LEVEL_COPY[key];
  doc.fillColor(PRIMARY).font("Helvetica-Oblique").fontSize(13).text(copy.tagline, MARGIN, doc.y, { width: CONTENT_W });
  doc.moveDown(0.8);
  subheading(doc, "What it looks like");
  for (const s of copy.signs) bullet(doc, s);
  subheading(doc, "The move to the next level");
  callout(doc, `From Level ${num} →`, copy.move);
}

function renderScorecard(doc: Doc) {
  contentPage(doc, "Maturity · Self-assessment");
  eyebrow(doc, "Maturity model");
  heading(doc, "Self-assessment scorecard");
  paragraph(doc, "Score each capability 0–4 against the levels you just read. Your domain's maturity is the lowest score, not the average — autonomy is gated by your weakest pillar.");
  const rows = [
    "Observability: unified telemetry and live topology",
    "Detection: correlation and anomaly detection vs. raw thresholds",
    "Diagnosis: automated root-cause vs. manual investigation",
    "Remediation: self-healing vs. human runbook execution",
    "Knowledge: living, reused vs. tribal and lost",
    "Governance: policy, approval, and audit around automated action",
  ];
  doc.moveDown(0.2);
  for (const r of rows) {
    const y = doc.y;
    doc.fillColor("#334155").font("Helvetica").fontSize(11).text(r, MARGIN, y + 4, { width: CONTENT_W - 150 });
    // 0-4 score boxes on the right
    let bx = PAGE.width - MARGIN - 5 * 26;
    for (let s = 0; s <= 4; s++) {
      doc.save().roundedRect(bx, y, 22, 22, 4).lineWidth(1).strokeColor(LINE).stroke().restore();
      doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(String(s), bx, y + 7, { width: 22, align: "center" });
      bx += 26;
    }
    doc.y = Math.max(doc.y, y + 22);
    doc.moveDown(0.7);
    rule(doc, doc.y - 4, LINE);
    doc.moveDown(0.3);
  }
  callout(doc, "Interpreting your score", "0–1: focus on observability first. 2: invest in correlation. 3: automate reversible remediation. 4: expand coverage and governance.");
}

function renderArchitecture(doc: Doc) {
  contentPage(doc, "Part Four · Architecture");
  eyebrow(doc, "Part four · architecture");
  heading(doc, "A reference architecture");
  paragraph(doc, "Autonomous operations are a pipeline. Signals flow in from the left; safe actions flow out to the right; a control plane governs everything in between.");
  subheading(doc, "The five layers");
  bullet(doc, "Agents and integrations stream events, metrics, logs, and topology from every managed surface.", "Collection.");
  bullet(doc, "A unified event store and a live service graph give every signal context and dependency.", "Correlation.");
  bullet(doc, "Models and LLM agents diagnose: cluster related events, infer probable cause, draft a fix.", "Reasoning.");
  bullet(doc, "A guarded action library executes reversible remediations within policy and blast-radius limits.", "Action.");
  bullet(doc, "Policy, approvals, audit, and feedback wrap the whole pipeline so autonomy stays accountable.", "Governance.");
  callout(doc, "Design principle", "Every automated action must be observable, reversible, and attributable. Autonomy without an audit trail is a liability, not an asset.");
}

function renderTelemetry(doc: Doc) {
  contentPage(doc, "Part Four · Architecture");
  eyebrow(doc, "Part four · architecture");
  heading(doc, "The telemetry foundation");
  paragraph(doc, "Everything above depends on the quality of what you collect. Most failed AIOps programs fail here — not in the models, but in the data feeding them.");
  subheading(doc, "Four properties of good telemetry");
  bullet(doc, "One incident is one event, even when forty systems noticed it. De-duplicate at the source.", "Unified.");
  bullet(doc, "Every signal carries the entity, service, and dependency it belongs to, so it can be correlated.", "Contextual.");
  bullet(doc, "Events arrive in seconds, not minutes. Prediction needs a live feed, not a nightly batch.", "Timely.");
  bullet(doc, "Coverage is complete enough that the absence of a signal is itself meaningful.", "Trustworthy.");
  callout(doc, "Start here", "Before any model or agent, invest a sprint in collapsing duplicate alerts and attaching topology. It is unglamorous and it is the highest-leverage work you will do.");
}

function renderAgents(doc: Doc) {
  contentPage(doc, "Part Four · Architecture");
  eyebrow(doc, "Part four · architecture");
  heading(doc, "AIOps and the role of LLM agents");
  paragraph(doc, "Classical AIOps handles the statistical work — anomaly detection, forecasting, clustering. LLM agents add the part that used to require a human: reading messy context and deciding what to do about it.");
  subheading(doc, "Where agents earn their place");
  bullet(doc, "Turn a noisy alert and its surrounding context into a one-paragraph explanation a human can act on instantly.", "Triage & summarise.");
  bullet(doc, "Map an incoming request to the right knowledge article or known fix, deflecting it before it becomes a ticket.", "Deflect.");
  bullet(doc, "Draft — and, within guardrails, execute — first-line remediations from an approved action library.", "Remediate.");
  callout(doc, "Guardrails are the product", "An agent's value is bounded by how safely it can act. Scoped permissions, reversible actions, approvals tied to blast radius, and a complete audit log are what make autonomy trustworthy enough to deploy.");
}

function renderRolloutOverview(doc: Doc) {
  contentPage(doc, "Part Five · 90-day plan");
  eyebrow(doc, "Part five · the 90-day plan");
  heading(doc, "From framework to first results");
  paragraph(doc, "Do not try to transform everything. Pick one well-understood service domain with real pain and visible volume, and take it from where it is to Level 3 in a single quarter. Prove the model, then templatise it.");
  subheading(doc, "The shape of the quarter");
  bullet(doc, "Build the telemetry and knowledge foundation for one domain.", "Days 0–30 · Foundation.");
  bullet(doc, "Add correlation, deflection, and suggested remediation.", "Days 31–60 · Intelligence.");
  bullet(doc, "Promote safe, reversible fixes to automatic and measure the impact.", "Days 61–90 · Autonomy.");
  callout(doc, "Pick the right pilot", "The ideal first domain has high ticket volume, well-understood failure modes, and an owner who wants this to succeed. Avoid your most political or most novel system for the pilot.");
}

function renderPhase1(doc: Doc) {
  contentPage(doc, "90-day plan · Days 0–30");
  eyebrow(doc, "The 90-day plan");
  phaseBand(doc, "Days 0–30", "Foundation");
  paragraph(doc, "Goal: see clearly. By day 30 you can observe the pilot domain end to end, and every incident lands in one place with context attached.");
  subheading(doc, "Workstreams");
  bullet(doc, "Choose the pilot domain and define what \"good\" looks like in measurable terms.", "Scope.");
  bullet(doc, "Consolidate the domain's telemetry into one event store; de-duplicate and attach topology.", "Instrument.");
  bullet(doc, "Centralise incidents and capture the top recurring fixes as living knowledge articles.", "Capture.");
  bullet(doc, "Baseline today's MTTR, ticket volume, and deflection rate — you cannot prove ROI without it.", "Baseline.");
  callout(doc, "Exit criteria", "One domain fully observable, a clean event feed, a baselined set of metrics, and the top 10 recurring incidents documented.");
}

function renderPhase2(doc: Doc) {
  contentPage(doc, "90-day plan · Days 31–60");
  eyebrow(doc, "The 90-day plan");
  phaseBand(doc, "Days 31–60", "Intelligence");
  paragraph(doc, "Goal: reason and deflect. By day 60 the system explains incidents instead of just reporting them, and routine requests are deflected before they reach an engineer.");
  subheading(doc, "Workstreams");
  bullet(doc, "Turn on correlation and anomaly detection; collapse event storms into single explained problems.", "Correlate.");
  bullet(doc, "Deploy a deflection agent against your knowledge base for the domain's common requests.", "Deflect.");
  bullet(doc, "Add suggested remediations — human-approved — for the top recurring incidents.", "Suggest.");
  bullet(doc, "Review every suggestion's accuracy weekly and feed corrections back into the system.", "Tune.");
  callout(doc, "Exit criteria", "Measurable deflection on common requests, correlated incidents with probable cause, and an approval-gated remediation suggestion for each top failure class.");
}

function renderPhase3(doc: Doc) {
  contentPage(doc, "90-day plan · Days 61–90");
  eyebrow(doc, "The 90-day plan");
  phaseBand(doc, "Days 61–90", "Autonomy");
  paragraph(doc, "Goal: heal automatically. By day 90 a defined set of low-risk, reversible failures resolve themselves end to end, with humans supervising rather than executing.");
  subheading(doc, "Workstreams");
  bullet(doc, "Promote the safest, most frequent suggested fixes to fully automatic execution.", "Automate.");
  bullet(doc, "Wrap every automated action in policy, blast-radius limits, and a complete audit trail.", "Govern.");
  bullet(doc, "Re-measure against your day-0 baseline and quantify deflection, MTTR, and hours recovered.", "Measure.");
  bullet(doc, "Package the domain as a template — runbooks, integrations, guardrails — to replicate next quarter.", "Templatise.");
  callout(doc, "Exit criteria", "At least one failure class self-healing in production, a quantified ROI story, and a repeatable template for the next domain.");
}

function renderMetrics(doc: Doc) {
  contentPage(doc, "Part Six · Measurement");
  eyebrow(doc, "Part six · measurement");
  heading(doc, "Measuring success: KPIs & ROI");
  paragraph(doc, "Tie the program to numbers your CFO already trusts. Track a small set of metrics from day 0 and report the delta, not the absolute.");
  subheading(doc, "The metrics that matter");
  bullet(doc, "Share of inbound resolved without a human. The clearest signal of autonomy taking hold.", "Deflection rate.");
  bullet(doc, "Mean time to resolution on instrumented services. Expect 40–60% reduction at Level 3.", "MTTR.");
  bullet(doc, "Incidents prevented or auto-resolved before a user noticed. The work that no longer happens.", "Toil eliminated.");
  bullet(doc, "Engineering hours returned from reactive toil to product work. Convert directly to dollars.", "Recovered capacity.");
  callout(doc, "The ROI sentence", "\"In one quarter, on one domain, we deflected X% of tickets, cut MTTR by Y%, and returned Z engineering hours — at a run-rate that pays back the investment in N months.\" Fill in your own numbers from the baseline.");
}

function renderNextSteps(doc: Doc, lead: GuideLead) {
  contentPage(doc, "Next steps");
  eyebrow(doc, "Where to go from here");
  heading(doc, "Your next steps");
  paragraph(doc, `${lead.name}, you now have the vocabulary, the model, and the plan. The hardest part is choosing to start before the next outage forces your hand.`);
  bullet(doc, "Score your two or three highest-volume domains against the scorecard on page 16.", "This week.");
  bullet(doc, "Pick one pilot domain and assign a single accountable owner.", "Next week.");
  bullet(doc, "Run the Days 0–30 foundation sprint and baseline your metrics.", "This month.");

  // Closing CTA card.
  doc.moveDown(0.6);
  const y = doc.y;
  const h = 150;
  doc.save().roundedRect(MARGIN, y, CONTENT_W, h, 12).fill(INK).restore();
  doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(10).text("READY TO GO FURTHER?", MARGIN + 22, y + 22, {
    characterSpacing: 1.5,
  });
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(18).text(
    `See what a Level 3 operation looks like for ${lead.company}`,
    MARGIN + 22,
    y + 40,
    { width: CONTENT_W - 44 }
  );
  doc.fillColor("#CBD5E1").font("Helvetica").fontSize(11).text(
    `Book a working session with the ${BRAND} team to map your pilot domain and a 90-day plan tailored to your estate.`,
    MARGIN + 22,
    doc.y + 6,
    { width: CONTENT_W - 44, lineGap: 3 }
  );
  doc.fillColor("#A5B4FC").font("Helvetica-Bold").fontSize(11).text(
    "leadaistudio.ai  ·  hello@leadaistudio.ai",
    MARGIN + 22,
    y + h - 30,
    { width: CONTENT_W - 44 }
  );
}

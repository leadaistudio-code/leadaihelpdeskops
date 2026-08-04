import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Users, Mail, BrainCircuit, Workflow, BookOpen, Zap, TrendingDown, Clock, Gauge, FileText, PlayCircle, GraduationCap, Newspaper, Download, Calendar, Bot, MonitorSmartphone, Boxes, ShoppingCart, Network, LayoutGrid } from "lucide-react";
import RoiCalculator from "@/components/roi-calculator";
import DemoRequestForm from "@/components/DemoRequestForm";
import { PRICING_TIERS, PRICING_FAQ } from "@/lib/pricing";

// Individual Page Components
const AboutPage = () => (
  <div className="max-w-4xl mx-auto py-20 px-6">
    <div className="text-center mb-16">
      <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-6">Our Mission to Automate IT</h1>
      <p className="text-lg text-[#3a3a3c] max-w-2xl mx-auto">LeadAIStudio was founded by former enterprise IT directors who were tired of watching highly skilled engineers reset passwords and reboot servers.</p>
    </div>
    <div className="prose prose-slate max-w-none">
      <p className="text-lg text-[#3a3a3c] mb-6">We believe that the future of IT service management is invisible. By leveraging predictive AIOps, we enable hardware and software issues to be resolved autonomously, before the end-user even notices a degradation in service.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <div className="bg-white p-6 border border-[#e5e5e5] rounded-lg">
          <h3 className="text-xl font-bold text-[#0a0a0a] mb-3">Innovation First</h3>
          <p className="text-[#3a3a3c]">We invest heavily in machine learning models that understand complex IT topologies.</p>
        </div>
        <div className="bg-white p-6 border border-[#e5e5e5] rounded-lg">
          <h3 className="text-xl font-bold text-[#0a0a0a] mb-3">Enterprise Grade</h3>
          <p className="text-[#3a3a3c]">Built for scale, compliance, and rigorous data segregation from day one.</p>
        </div>
        <div className="bg-white p-6 border border-[#e5e5e5] rounded-lg">
          <h3 className="text-xl font-bold text-[#0a0a0a] mb-3">User Obsessed</h3>
          <p className="text-[#3a3a3c]">We design beautiful interfaces that employees actually enjoy using.</p>
        </div>
      </div>
    </div>
  </div>
);

const ContactPage = () => (
  <div className="max-w-6xl mx-auto py-20 px-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
      <div>
        <h1 className="text-4xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-6">Let&apos;s transform your IT operations.</h1>
        <p className="text-lg text-[#3a3a3c] mb-10">Fill out the form to request a personalized demo, custom ROI analysis, or to speak with our enterprise sales team.</p>
        
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#00d4a4]/10 text-[#00926f] rounded-full flex items-center justify-center"><Mail className="w-5 h-5" /></div>
            <div>
              <p className="font-bold text-[#0a0a0a]">Email Us</p>
              <a href="mailto:contact@leadaistudio.com" className="text-[#3a3a3c] hover:text-[#00926f] transition-colors">contact@leadaistudio.com</a>
            </div>
          </div>
        </div>
      </div>
      
      <DemoRequestForm />
    </div>
  </div>
);

const SolutionsPage = () => (
  <div className="max-w-5xl mx-auto py-20 px-6">
    <div className="text-center mb-16">
      <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-6">Solutions for Every Enterprise</h1>
      <p className="text-lg text-[#3a3a3c] max-w-2xl mx-auto">Whether you are a global enterprise or a Managed Service Provider, LeadAIStudio adapts to your complex operational needs.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div className="bg-white border border-[#e5e5e5] rounded-xl p-8 shadow-sm">
        <ShieldCheck className="w-12 h-12 text-[#00926f] mb-6" />
        <h2 className="text-2xl font-bold text-[#0a0a0a] mb-4">For Managed Service Providers (MSPs)</h2>
        <p className="text-[#3a3a3c] mb-6">Manage multiple clients from a single pane of glass using our strict Domain Separation architecture. Ensure complete data privacy while sharing global workflows.</p>
        <ul className="space-y-3 mb-8">
          <li className="flex items-center text-sm font-medium text-[#3a3a3c]"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Tenant-specific branding</li>
          <li className="flex items-center text-sm font-medium text-[#3a3a3c]"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Cross-domain analytics</li>
          <li className="flex items-center text-sm font-medium text-[#3a3a3c]"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Isolated CMDBs</li>
        </ul>
        <Link href="/p/contact" className="text-[#00926f] font-bold flex items-center hover:underline">Contact Sales <ArrowRight className="w-4 h-4 ml-1" /></Link>
      </div>
      <div className="bg-[#f7f7f7] border border-[#e5e5e5] rounded-xl p-8">
        <Users className="w-12 h-12 text-[#00926f] mb-6" />
        <h2 className="text-2xl font-bold text-[#0a0a0a] mb-4">For Global Enterprises</h2>
        <p className="text-[#3a3a3c] mb-6">Scale your IT support across continents. Automate L1 requests, track hardware telemetry, and provide walk-up kiosks for physical device swaps.</p>
        <ul className="space-y-3 mb-8">
          <li className="flex items-center text-sm font-medium text-[#3a3a3c]"><CheckCircle2 className="w-4 h-4 text-[#00926f] mr-2" /> Automated Routing Rules</li>
          <li className="flex items-center text-sm font-medium text-[#3a3a3c]"><CheckCircle2 className="w-4 h-4 text-[#00926f] mr-2" /> Global Asset Management</li>
          <li className="flex items-center text-sm font-medium text-[#3a3a3c]"><CheckCircle2 className="w-4 h-4 text-[#00926f] mr-2" /> Strict SLA Enforcement</li>
        </ul>
        <Link href="/dashboard" className="text-white bg-[#0a0a0a] px-5 py-2.5 rounded-full font-semibold inline-flex items-center hover:bg-[#1c1c1e] transition-colors">Try Interactive Demo <ArrowRight className="w-4 h-4 ml-2" /></Link>
      </div>
    </div>
  </div>
);

const LegalPage = ({ title }: { title: string }) => (
  <div className="max-w-3xl mx-auto py-20 px-6">
    <h1 className="text-4xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-8">{title}</h1>
    <div className="prose prose-slate max-w-none text-[#3a3a3c]">
      <p className="font-bold">Last Updated: June 2026</p>
      <p>This is a simulated legal document for demonstration purposes. In a real production environment, this page would contain the legally binding terms or privacy policy as drafted by corporate counsel.</p>
      <h2 className="text-2xl font-bold text-[#0a0a0a] mt-8 mb-4">1. Data Collection</h2>
      <p>We collect telemetry data exclusively for the purpose of predictive IT maintenance. All data is encrypted at rest and in transit.</p>
      <h2 className="text-2xl font-bold text-[#0a0a0a] mt-8 mb-4">2. Compliance</h2>
      <p>LeadAIStudio is fully compliant with SOC2 Type II, GDPR, and HIPAA regulations regarding the storage of personally identifiable information.</p>
      <h2 className="text-2xl font-bold text-[#0a0a0a] mt-8 mb-4">3. Domain Separation</h2>
      <p>For MSP clients, data is strictly segregated at the database level to ensure tenant isolation.</p>
    </div>
  </div>
);

const PRODUCT_MODULES = [
  {
    icon: <MonitorSmartphone className="w-6 h-6" />,
    name: "Digital Employee Experience (DEX)",
    tag: "Prevent",
    desc: "The core product. A lightweight agent streams device health, app performance and login times from every endpoint; trend regression projects the failure hours before it happens and runs a safe runbook on the device — so the ticket is never filed.",
    points: ["Predictive failure detection", "Autonomous remediation", "Fleet experience scoring"],
  },
  {
    icon: <Bot className="w-6 h-6" />,
    name: "AI Service Desk",
    tag: "Resolve",
    desc: "For what prevention cannot catch. An AI agent that triages, answers and resolves requests in natural language — arriving with the requester's device telemetry already in hand, so nobody asks them to reboot and try again.",
    points: ["Conversational ticket intake", "Autonomous L1 resolution", "Smart routing & escalation"],
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    name: "Knowledge Management",
    tag: "Know",
    desc: "A living knowledge base that the AI writes from, learns from, and keeps current — turning every resolved ticket into a reusable answer for the next person.",
    points: ["AI-authored articles", "Auto-surfaced answers", "Gap detection"],
  },
  {
    icon: <ShoppingCart className="w-6 h-6" />,
    name: "Catalogue Management",
    tag: "Request",
    desc: "A consumer-grade service catalogue where employees request hardware, software, and access through a frictionless, Amazon-like portal backed by automated fulfillment.",
    points: ["Self-service storefront", "Automated approvals", "Fulfillment workflows"],
  },
  {
    icon: <Boxes className="w-6 h-6" />,
    name: "Asset Management",
    tag: "Track",
    desc: "A unified CMDB that tracks every device, license, and dependency through its full lifecycle — from procurement to retirement — with telemetry built in.",
    points: ["Full-lifecycle tracking", "License & cost control", "Dependency mapping"],
  },
  {
    icon: <Workflow className="w-6 h-6" />,
    name: "Flow Designer & Automation",
    tag: "Automate",
    desc: "Build approval chains, routing rules, and remediation paths visually — no code. Design a workflow once and deploy it across the entire enterprise.",
    points: ["Drag-and-drop builder", "SLA enforcement", "Integration webhooks"],
  },
];

// This page previously carried invented outcome statistics ("3.4M tickets
// deflected") and three testimonials attributed to organisations that do not
// exist. We have no customers to quote yet, so it now says that plainly. Do not
// add a number here that cannot be traced to a named, callable reference — a
// buyer who finds one fabricated figure stops believing the true ones.
const CustomersPage = () => (
  <div className="max-w-6xl mx-auto py-20 px-6">
    <div className="text-center mb-16">
      <span className="inline-block px-3 py-1 bg-[#00d4a4]/10 border border-[#00d4a4]/20 text-[#00926f] font-semibold text-xs uppercase tracking-wider rounded-full mb-6">
        Design Partners
      </span>
      <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-6 max-w-3xl mx-auto leading-tight">
        We&rsquo;re onboarding our first IT teams by hand.
      </h1>
      <p className="text-lg text-[#3a3a3c] max-w-2xl mx-auto">
        LeadAIStudio is new. We don&rsquo;t have customer logos or case studies to show you yet — and
        we&rsquo;d rather say so than invent them. What we have is a working product and the founder&rsquo;s
        undivided attention.
      </p>
    </div>

    {/* What being early actually gets you */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
      {[
        {
          title: "The founder on the phone",
          desc: "Not a support queue and not a success manager reading a script. You get the person who wrote the code.",
        },
        {
          title: "Your problems shape the roadmap",
          desc: "Design partners set priorities. The gaps you hit are the ones that get fixed next, not filed.",
        },
        {
          title: "Hands-on migration",
          desc: "We do the setup, the data import, and the agent rollout with you rather than handing you a doc.",
        },
      ].map((c) => (
        <div key={c.title} className="bg-white border border-[#e5e5e5] rounded-xl p-7 flex flex-col">
          <h3 className="font-bold text-[#0a0a0a] text-lg mb-3">{c.title}</h3>
          <p className="text-[#3a3a3c] leading-relaxed">{c.desc}</p>
        </div>
      ))}
    </div>

    {/* CTA */}
    <div className="bg-[#f7f7f7] border border-[#e5e5e5] rounded-2xl p-10 md:p-14 text-center">
      <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-4">Be one of the first.</h2>
      <p className="text-[#3a3a3c] max-w-xl mx-auto mb-8">
        Try the product yourself, or talk to us about a design-partner engagement.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/p/contact" className="px-8 py-3.5 bg-white border border-[#e5e5e5] text-[#0a0a0a] font-semibold rounded-full hover:bg-white transition-colors">
          Talk to Us
        </Link>
        <Link href="/dashboard" className="px-8 py-3.5 bg-[#0a0a0a] text-white font-semibold rounded-full hover:bg-[#1c1c1e] transition-colors">
          Try the Demo
        </Link>
      </div>
    </div>
  </div>
);


const PricingPage = () => (
  <div className="max-w-6xl mx-auto py-20 px-6">
    <div className="text-center mb-16">
      <span className="inline-block px-3 py-1 bg-[#00d4a4]/10 border border-[#00d4a4]/20 text-[#00926f] font-semibold text-xs uppercase tracking-wider rounded-full mb-6">
        Pricing
      </span>
      <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-6 max-w-3xl mx-auto leading-tight">
        One platform. One predictable price.
      </h1>
      <p className="text-lg text-[#3a3a3c] max-w-2xl mx-auto">
        Replace a stack of point tools with a single subscription. Every plan includes the AI engine — scale up as you consolidate.
      </p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16 items-start">
      {PRICING_TIERS.map((t) => (
        <div
          key={t.name}
          className={`rounded-2xl p-8 flex flex-col ${
            t.highlighted
              ? "bg-white border-2 border-[#00d4a4] shadow-[0_8px_24px_rgba(0,212,164,0.08)] lg:-mt-4"
              : "bg-white border border-[#e5e5e5]"
          }`}
        >
          {t.highlighted && (
            <span className="inline-flex w-fit px-3 py-1 bg-[#00d4a4] text-[#0a0a0a] text-xs font-bold rounded-full mb-4">
              Most Popular
            </span>
          )}
          <h3 className="text-xl font-bold mb-1 text-[#0a0a0a]">{t.name}</h3>
          <p className="text-sm mb-6 text-[#6b6b6d]">{t.blurb}</p>
          <div className="mb-6">
            <span className="text-4xl font-semibold tracking-[-0.02em] text-[#0a0a0a]">{t.price}</span>
            <span className="text-sm ml-2 text-[#6b6b6d]">{t.unit}</span>
          </div>
          <Link
            href={t.ctaHref}
            className={`text-center px-6 py-3 font-semibold rounded-full transition-colors mb-8 ${
              t.highlighted
                ? "bg-[#00d4a4] text-[#0a0a0a] hover:bg-[#00b48a]"
                : "bg-[#0a0a0a] text-white hover:bg-[#1c1c1e]"
            }`}
          >
            {t.cta}
          </Link>
          <ul className="space-y-3">
            {t.features.map((f) => (
              <li key={f} className="flex items-start text-sm text-[#3a3a3c]">
                <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-[#00926f]" />
                {f}
              </li>
            ))}
          </ul>
          {t.roadmapNote && (
            <p className="mt-6 pt-4 border-t border-[#ededed] text-xs leading-relaxed text-[#6b6b6d]">
              {t.roadmapNote}
            </p>
          )}
        </div>
      ))}
    </div>

    {/* FAQ */}
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-8 text-center">Pricing questions, answered</h2>
      <div className="space-y-4">
        {PRICING_FAQ.map((item) => (
          <div key={item.q} className="bg-white border border-[#e5e5e5] rounded-xl p-6">
            <h3 className="font-bold text-[#0a0a0a] mb-2">{item.q}</h3>
            <p className="text-[#3a3a3c] text-sm leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
      <div className="text-center mt-12">
        <p className="text-[#3a3a3c] mb-4">Still have questions about the right plan?</p>
        <Link href="/p/contact" className="px-8 py-3.5 bg-[#0a0a0a] text-white font-semibold rounded-full hover:bg-[#1c1c1e] transition-colors inline-block">
          Talk to Sales
        </Link>
      </div>
    </div>
  </div>
);

const ProductPage = () => (
  <div className="max-w-6xl mx-auto py-20 px-6">
    {/* Hero */}
    <div className="text-center mb-16">
      <h1 className="text-4xl md:text-6xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-6 max-w-4xl mx-auto leading-[1.1]">
        One solution for the entire IT helpdesk.
      </h1>
      <p className="text-lg text-[#3a3a3c] max-w-2xl mx-auto mb-10">
        AI Service Desk, Digital Employee Experience, Knowledge, Catalogue, and Asset Management — unified on a single platform. Replace your tangle of disconnected tools with one intelligent system of record.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/dashboard" className="px-8 py-3.5 bg-[#0a0a0a] text-white font-semibold rounded-full hover:bg-[#1c1c1e] transition-colors inline-flex items-center gap-2">
          Try the Interactive Demo <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href="/p/contact" className="px-8 py-3.5 bg-white border border-[#e5e5e5] text-[#0a0a0a] font-semibold rounded-full hover:bg-[#f7f7f7] transition-colors">
          Book a Walkthrough
        </Link>
      </div>
    </div>

    {/* Unified platform statement */}
    <div className="bg-[#f7f7f7] border border-[#e5e5e5] rounded-2xl p-10 md:p-14 mb-20 text-center">
      <LayoutGrid className="w-10 h-10 text-[#00926f] mx-auto mb-6" />
      <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-4 max-w-2xl mx-auto leading-snug">
        Six products. One platform. Zero swivel-chair.
      </h2>
      <p className="text-[#3a3a3c] max-w-2xl mx-auto">
        Every module shares the same data model, the same AI engine, and the same workflow fabric — so an asset record, a knowledge article, and a service request all speak to each other automatically. No integrations to maintain, no data silos to reconcile.
      </p>
    </div>

    {/* Modules grid */}
    <div className="mb-24">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-3">Everything your IT team runs on</h2>
        <p className="text-base text-[#3a3a3c] max-w-2xl mx-auto">
          Each capability is powerful on its own — and exponentially more so together.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCT_MODULES.map((m) => (
          <div key={m.name} className="bg-white border border-[#e5e5e5] rounded-xl p-7 flex flex-col hover:shadow-lg hover:border-[#00d4a4]/40 transition-[box-shadow,border-color]">
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 rounded-lg bg-[#00d4a4]/10 text-[#00926f] flex items-center justify-center">
                {m.icon}
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-[#6b6b6d]">{m.tag}</span>
            </div>
            <h3 className="text-lg font-bold text-[#0a0a0a] mb-2">{m.name}</h3>
            <p className="text-sm text-[#3a3a3c] leading-relaxed mb-5">{m.desc}</p>
            <ul className="space-y-2 mt-auto">
              {m.points.map((p) => (
                <li key={p} className="flex items-center text-sm text-[#3a3a3c]">
                  <CheckCircle2 className="w-4 h-4 text-[#00926f] mr-2 shrink-0" /> {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>

    {/* Why one platform */}
    <div className="mb-24">
      <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-3 text-center">Why one platform wins</h2>
      <p className="text-base text-[#3a3a3c] max-w-2xl mx-auto text-center mb-12">
        Stitching together point solutions costs you more than license fees — it costs you context.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProductValue
          icon={<BrainCircuit className="w-6 h-6" />}
          title="One AI, every workflow"
          desc="The same AI engine that answers a chat sees the device telemetry, the asset record, and the knowledge base — so its answers are grounded in your actual environment."
        />
        <ProductValue
          icon={<Network className="w-6 h-6" />}
          title="One source of truth"
          desc="Tickets, assets, and knowledge live in one data model. No more reconciling spreadsheets or wondering which system is right."
        />
        <ProductValue
          icon={<Gauge className="w-6 h-6" />}
          title="One pane of glass"
          desc="Your team works, reports, and automates from a single interface — cutting tool sprawl, license waste, and onboarding time."
        />
      </div>
    </div>

    {/* CTA */}
    <div className="bg-[#f7f7f7] border border-[#e5e5e5] rounded-2xl p-10 md:p-14 text-center">
      <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-4">See the whole platform in action.</h2>
      <p className="text-base text-[#3a3a3c] max-w-xl mx-auto mb-8">
        Explore the live dashboard or book a guided walkthrough tailored to your IT environment.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/dashboard" className="px-8 py-3.5 bg-[#0a0a0a] text-white font-semibold rounded-full hover:bg-[#1c1c1e] transition-colors inline-block">
          Open the Demo
        </Link>
        <Link href="/p/contact" className="px-8 py-3.5 bg-white border border-[#e5e5e5] text-[#0a0a0a] font-semibold rounded-full hover:bg-[#f7f7f7] transition-colors inline-block">
          Talk to Sales
        </Link>
      </div>
    </div>
  </div>
);

const ProductValue = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="bg-white border border-[#e5e5e5] rounded-xl p-7">
    <div className="w-12 h-12 rounded-lg bg-[#00d4a4]/10 text-[#00926f] flex items-center justify-center mb-5">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-[#0a0a0a] mb-2">{title}</h3>
    <p className="text-[#3a3a3c] leading-relaxed text-sm">{desc}</p>
  </div>
);

const RoiPage = () => (
  <div className="max-w-6xl mx-auto py-20 px-6">
    {/* Hero */}
    <div className="text-center mb-16">
      <span className="inline-block px-3 py-1 bg-[#00d4a4]/10 border border-[#00d4a4]/20 text-[#00926f] font-semibold text-xs uppercase tracking-wider rounded-full mb-6">
        Return on Investment
      </span>
      <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-6 max-w-3xl mx-auto leading-tight">
        Model the case before you commit to it.
      </h1>
      <p className="text-lg text-[#3a3a3c] max-w-2xl mx-auto">
        LeadAIStudio targets your busiest cost centre — deflecting routine tickets, shortening
        resolution times, and giving hours back to your highest-value engineers. Below is a model you
        can run on your own numbers, not a claim about someone else&rsquo;s.
      </p>
    </div>

    {/* No headline proof band: we have no deployments to average, and inventing
        one would poison every true claim on this page. The calculator below is
        explicitly labelled as a model driven by the visitor's own inputs. */}

    {/* Interactive calculator */}
    <div className="mb-24">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-3">Model your savings</h2>
        <p className="text-base text-[#3a3a3c] max-w-xl mx-auto">
          An estimate calculated live from the figures you enter. These are assumptions, not measured
          results from existing customers — we&rsquo;re early, and we don&rsquo;t have those yet. No email required.
        </p>
      </div>
      <RoiCalculator />
    </div>

    {/* Where the ROI comes from */}
    <div className="mb-24">
      <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-3 text-center">Four ways we move the bottom line</h2>
      <p className="text-base text-[#3a3a3c] max-w-2xl mx-auto text-center mb-12">
        Every dollar of return traces back to a concrete operational change — not a vague promise of &ldquo;efficiency.&rdquo;
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RoiDriver
          icon={<Gauge className="w-6 h-6" />}
          title="Autonomous L1 deflection"
          desc="Intelligent triage resolves password resets, access requests, and known issues with zero human touch, removing routine volume before it ever reaches an agent."
        />
        <RoiDriver
          icon={<BrainCircuit className="w-6 h-6" />}
          title="Predictive hardware maintenance"
          desc="Telemetry flags failing devices before they die, converting emergency replacements and lost-productivity hours into scheduled, low-cost interventions."
        />
        <RoiDriver
          icon={<Clock className="w-6 h-6" />}
          title="Faster mean time to resolution"
          desc="Auto-routing and full-context handoffs mean the tickets that do reach a human start with the diagnosis already done — so they resolve faster and SLAs stop slipping."
        />
        <RoiDriver
          icon={<ShieldCheck className="w-6 h-6" />}
          title="Compliance without overtime"
          desc="Automated SLA tracking and audit-ready logs eliminate the manual reporting that quietly drains your team every month-end and quarter-close."
        />
      </div>
    </div>

    {/* No testimonial block: the quote that sat here was attributed to a
        customer that does not exist. It returns when a real one says it. */}

    {/* CTA */}
    <div className="text-center">
      <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-4">Want the numbers for your exact environment?</h2>
      <p className="text-base text-[#3a3a3c] max-w-xl mx-auto mb-8">
        We&rsquo;ll build a tailored model using your ticket data, headcount, and SLA targets, and be
        explicit about which inputs are your measurements and which are our assumptions.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/p/contact" className="px-8 py-3.5 bg-[#0a0a0a] text-white font-semibold rounded-full hover:bg-[#1c1c1e] transition-colors">
          Request a Custom ROI Analysis
        </Link>
        <Link href="/dashboard" className="px-8 py-3.5 bg-white border border-[#e5e5e5] text-[#0a0a0a] font-semibold rounded-full hover:bg-[#f7f7f7] transition-colors">
          Try the Interactive Demo
        </Link>
      </div>
    </div>
  </div>
);

// `RoiStat` was deleted along with its callers. Its only remaining use would be
// to display a headline outcome figure, and we have no measured ones to show.

const RoiDriver = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="bg-white border border-[#e5e5e5] rounded-xl p-7 hover:shadow-lg hover:border-[#00d4a4]/40 transition-[box-shadow,border-color]">
    <div className="w-12 h-12 rounded-lg bg-[#00d4a4]/10 text-[#00926f] flex items-center justify-center mb-5">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-[#0a0a0a] mb-2">{title}</h3>
    <p className="text-[#3a3a3c] leading-relaxed">{desc}</p>
  </div>
);

type Resource = {
  type: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  meta: string;
  cta: string;
  href?: string;
  featured?: boolean;
};

const RESOURCES: Resource[] = [
  {
    type: "Whitepaper",
    icon: <FileText className="w-4 h-4" />,
    title: "The CIO's Guide to Autonomous IT Operations",
    desc: "A 24-page framework for moving from reactive ticketing to predictive, self-healing infrastructure — with a maturity model and 90-day rollout plan.",
    meta: "12 min read",
    cta: "Download PDF",
    href: "/guides/cio-autonomous-it",
    featured: true,
  },
  {
    type: "Case Study",
    icon: <TrendingDown className="w-4 h-4" />,
    title: "How a 14,000-employee enterprise cut MTTR by 52% in six months",
    desc: "Inside the rollout: the deflection playbook, the change-management wins, and the hard numbers behind the payback.",
    meta: "8 min read",
    cta: "Read the story",
  },
  {
    type: "Webinar",
    icon: <PlayCircle className="w-4 h-4" />,
    title: "Predictive Telemetry, Live: Stopping Outages Before They Start",
    desc: "Our solutions engineers demo the AIOps engine end-to-end and answer questions on hardware failure prediction and remediation.",
    meta: "On demand · 45 min",
    cta: "Watch now",
  },
  {
    type: "Guide",
    icon: <GraduationCap className="w-4 h-4" />,
    title: "Building Your First No-Code Approval Flow",
    desc: "A hands-on walkthrough of the Flow Designer — from a blank canvas to a multi-stage, SLA-backed approval chain in under 20 minutes.",
    meta: "15 min read",
    cta: "Open the guide",
  },
  {
    type: "Report",
    icon: <FileText className="w-4 h-4" />,
    title: "2026 State of Enterprise IT Service Management",
    desc: "Benchmark data from 500+ IT leaders on ticket volumes, automation adoption, and where budgets are shifting this year.",
    meta: "10 min read",
    cta: "Get the report",
  },
  {
    type: "Blog",
    icon: <Newspaper className="w-4 h-4" />,
    title: "Why Domain Separation Matters for MSPs",
    desc: "A technical deep dive into tenant isolation architecture and how to share global workflows without ever leaking client data.",
    meta: "6 min read",
    cta: "Read article",
  },
];

const ResourcesPage = () => (
  <div className="max-w-6xl mx-auto py-20 px-6">
    {/* Hero */}
    <div className="text-center mb-16">
      <span className="inline-block px-3 py-1 bg-[#00d4a4]/10 border border-[#00d4a4]/20 text-[#00926f] font-semibold text-xs uppercase tracking-wider rounded-full mb-6">
        Resource Center
      </span>
      <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-6 max-w-3xl mx-auto leading-tight">
        Everything you need to build a smarter IT operation.
      </h1>
      <p className="text-lg text-[#3a3a3c] max-w-2xl mx-auto">
        Research, playbooks, and real customer stories from the teams pioneering autonomous IT — curated to help you plan, pitch, and scale your transformation.
      </p>
    </div>

    {/* Featured resource */}
    {RESOURCES.filter((r) => r.featured).map((r) => (
      <div key={r.title} className="bg-[#f7f7f7] border border-[#e5e5e5] rounded-2xl p-8 md:p-12 mb-16 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        <div className="lg:col-span-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#00926f] mb-4">
            {r.icon} Featured {r.type}
          </span>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-4 leading-tight">{r.title}</h2>
          <p className="text-[#3a3a3c] mb-6 max-w-xl">{r.desc}</p>
          <Link href={r.href ?? "/p/contact"} className="inline-flex items-center gap-2 px-6 py-3 bg-[#0a0a0a] text-white font-semibold rounded-full hover:bg-[#1c1c1e] transition-colors">
            {r.cta} <Download className="w-4 h-4" />
          </Link>
        </div>
        <div className="hidden lg:flex justify-end">
          <div className="w-40 h-52 bg-gradient-to-br from-[#00d4a4] to-[#00b48a] rounded-lg shadow-[0_24px_48px_-8px_rgba(0,0,0,0.12)] rotate-3 flex items-center justify-center">
            <FileText className="w-16 h-16 text-white/90" />
          </div>
        </div>
      </div>
    ))}

    {/* Resource grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
      {RESOURCES.filter((r) => !r.featured).map((r) => (
        <div key={r.title} className="bg-white border border-[#e5e5e5] rounded-xl p-6 flex flex-col hover:shadow-lg hover:border-[#00d4a4]/40 transition-[box-shadow,border-color]">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#00d4a4]/10 text-[#00926f] text-xs font-semibold rounded-full">
              {r.icon} {r.type}
            </span>
            <span className="text-xs text-[#6b6b6d] ml-auto">{r.meta}</span>
          </div>
          <h3 className="text-lg font-bold text-[#0a0a0a] mb-2 leading-snug">{r.title}</h3>
          <p className="text-sm text-[#3a3a3c] leading-relaxed mb-6">{r.desc}</p>
          <Link href={r.href ?? "/p/contact"} className="mt-auto inline-flex items-center gap-2 text-[#00926f] font-semibold text-sm hover:gap-3 transition-all">
            {r.cta} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ))}
    </div>

    {/* Newsletter CTA */}
    <div className="bg-[#f7f7f7] border border-[#e5e5e5] rounded-2xl p-10 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-16">
      <div>
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-3">Get IT intelligence in your inbox</h2>
        <p className="text-[#3a3a3c]">Monthly insights on AIOps, automation strategy, and the metrics that matter — no fluff, unsubscribe anytime.</p>
      </div>
      <form className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          placeholder="you@company.com"
          className="flex-1 px-4 py-3 border border-[#e5e5e5] rounded-lg focus:ring-2 focus:ring-[#00d4a4] focus:border-[#00d4a4] focus:outline-none focus:outline-none"
        />
        <button type="button" className="px-6 py-3 bg-[#0a0a0a] text-white font-semibold rounded-full hover:bg-[#1c1c1e] transition-colors whitespace-nowrap">
          Subscribe
        </button>
      </form>
    </div>

    {/* Talk to sales CTA */}
    <div className="text-center">
      <Calendar className="w-10 h-10 text-[#00926f] mx-auto mb-4" />
      <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-4">Prefer a conversation?</h2>
      <p className="text-base text-[#3a3a3c] max-w-xl mx-auto mb-8">
        Book a 30-minute briefing with a solutions engineer and we&apos;ll map LeadAIStudio to your exact environment.
      </p>
      <Link href="/p/contact" className="px-8 py-3.5 bg-[#0a0a0a] text-white font-semibold rounded-full hover:bg-[#1c1c1e] transition-colors inline-block">
        Talk to Sales
      </Link>
    </div>
  </div>
);

const FeatureDeepDive = ({ title, icon, subtitle, content }: { title: string; icon: React.ReactNode; subtitle: string; content: string }) => (
  <div className="max-w-4xl mx-auto py-20 px-6">
    <div className="flex items-center space-x-4 mb-8">
      <div className="w-16 h-16 bg-[#00d4a4]/10 text-[#00926f] rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h1 className="text-4xl font-semibold tracking-[-0.02em] text-[#0a0a0a]">{title}</h1>
        <p className="text-xl text-[#3a3a3c]">{subtitle}</p>
      </div>
    </div>
    <div className="bg-white border border-[#e5e5e5] rounded-xl p-8 shadow-sm">
      <p className="text-lg text-[#3a3a3c] leading-relaxed">{content}</p>
      <div className="mt-8 pt-8 border-t border-[#ededed]">
        <Link href="/dashboard" className="px-6 py-3 bg-[#0a0a0a] text-white font-semibold rounded-full hover:bg-[#1c1c1e] transition-colors">See it in action in the Dashboard</Link>
      </div>
    </div>
  </div>
);

// Per-page SEO metadata so each marketing route has a real title, description,
// and shareable Open Graph card instead of inheriting the generic app default.
const PAGE_SEO: Record<string, { title: string; description: string }> = {
  product: {
    title: "Product — One platform for the entire IT helpdesk",
    description: "AI Service Desk, DEX, Knowledge, Catalogue, and Asset Management unified on a single intelligent platform.",
  },
  solutions: {
    title: "Solutions for Enterprises & MSPs",
    description: "Scale IT support across continents or manage multiple clients with strict domain separation.",
  },
  roi: {
    title: "ROI Calculator — IT support that pays for itself",
    description: "Estimate your savings: 60% ticket deflection, 45% lower MTTR, and payback in under 90 days.",
  },
  resources: {
    title: "Resource Center — Guides, case studies & research",
    description: "Whitepapers, customer stories, and playbooks for building a smarter, autonomous IT operation.",
  },
  customers: {
    title: "Customer Stories — Trusted by IT leaders globally",
    description: "See how teams from scale-ups to 50,000-seat enterprises run their helpdesk on LeadAIStudio.",
  },
  pricing: {
    title: "Pricing — One platform, one predictable price",
    description: "Simple per-device pricing across Starter, Growth, and Enterprise plans. Every plan includes the AI engine.",
  },
  about: {
    title: "About Us — Our mission to automate IT",
    description: "Founded by former enterprise IT directors building the future of invisible, autonomous IT service management.",
  },
  contact: {
    title: "Contact Sales — Request a demo",
    description: "Book a personalized demo, request a custom ROI analysis, or talk to our enterprise sales team.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const seo = PAGE_SEO[slug.toLowerCase()];
  const title = seo?.title ?? "LeadAIStudio — AI IT Service Management";
  const description = seo?.description ?? "The unified, AI-driven IT helpdesk platform for modern enterprises.";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" as const },
    twitter: { card: "summary_large_image" as const, title, description },
  };
}

export default async function GenericMarketingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();

  let content;

  switch (normalizedSlug) {
    case 'product':
      content = <ProductPage />;
      break;
    case 'about':
      content = <AboutPage />;
      break;
    case 'contact':
      content = <ContactPage />;
      break;
    case 'solutions':
      content = <SolutionsPage />;
      break;
    case 'roi':
      content = <RoiPage />;
      break;
    case 'resources':
      content = <ResourcesPage />;
      break;
    case 'customers':
      content = <CustomersPage />;
      break;
    case 'pricing':
      content = <PricingPage />;
      break;
    case 'privacy':
      content = <LegalPage title="Privacy Policy" />;
      break;
    case 'terms':
      content = <LegalPage title="Terms of Service" />;
      break;
    case 'aiops-telemetry':
      content = <FeatureDeepDive 
        icon={<BrainCircuit className="w-8 h-8" />}
        title="AIOps Telemetry" 
        subtitle="Predict the unpredictable."
        content="LeadAIStudio's AIOps engine ingests millions of data points from your hardware fleet daily. By analyzing CPU thermals, battery degradation rates, and application crash logs, our machine learning models can predict hardware failures before they impact the end user. When a threshold is breached, the system automatically opens an incident, attempts background remediation, or queues a hardware replacement."
      />;
      break;
    case 'flow-designer':
      content = <FeatureDeepDive 
        icon={<Workflow className="w-8 h-8" />}
        title="Flow Designer" 
        subtitle="Automate without code."
        content="Stop writing complex scripts for simple approvals. Our visual Flow Designer allows IT administrators to drag and drop logic blocks to build multi-stage approval chains, integration webhooks, and automated resolution paths. Build a flow once, and deploy it across your entire enterprise."
      />;
      break;
    case 'service-catalog':
      content = <FeatureDeepDive 
        icon={<BookOpen className="w-8 h-8" />}
        title="Service Catalog" 
        subtitle="The consumerization of IT."
        content="Give your employees a beautiful, Amazon-like shopping experience for their IT needs. Whether they need to request a new Macbook Pro, gain access to an AWS staging environment, or submit a broken phone for repair, the Service Catalog provides a unified, frictionless portal."
      />;
      break;
    default:
      // Fallback for Product, Customers, ROI, Resources etc.
      content = (
        <div className="max-w-3xl mx-auto py-32 px-6 text-center">
          <h1 className="text-4xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-6 capitalize">{normalizedSlug.replace('-', ' ')}</h1>
          <p className="text-xl text-[#3a3a3c] mb-10">We are currently migrating this section to our new enterprise portal.</p>
          <Link href="/p/contact" className="px-8 py-3 bg-[#0a0a0a] text-white font-semibold rounded-full hover:bg-[#1c1c1e] transition-colors">
            Contact Sales for Details
          </Link>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#00d4a4]/20 text-[#0a0a0a]">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#ededed]">
        <div className="flex items-center justify-between px-6 lg:px-8 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#0a0a0a] rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#00d4a4]" />
            </div>
            <div className="text-xl font-bold tracking-tight text-[#0a0a0a]">
              LeadAIStudio AIOps
            </div>
          </Link>
          <div className="hidden md:flex items-center space-x-8 text-xs font-medium text-[#3a3a3c]">
            <Link href="/p/product" className="hover:text-[#00926f] transition-colors">Product</Link>
            <Link href="/p/solutions" className="hover:text-[#00926f] transition-colors">Solutions</Link>
            <Link href="/p/pricing" className="hover:text-[#00926f] transition-colors">Pricing</Link>
            <Link href="/p/roi" className="hover:text-[#00926f] transition-colors">ROI</Link>
            <Link href="/p/resources" className="hover:text-[#00926f] transition-colors">Resources</Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-xs font-medium text-[#3a3a3c] hover:text-[#00926f] transition-colors hidden sm:block">Log in</Link>
            <Link href="/dashboard" className="px-4 py-2 bg-[#0a0a0a] text-white text-sm font-semibold rounded-full hover:bg-[#1c1c1e] transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Rendered by Switch */}
      <main className="min-h-[70vh]">
        {content}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#e5e5e5] py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-5 h-5 bg-[#0a0a0a] rounded flex items-center justify-center">
                <Zap className="w-3 h-3 text-[#00d4a4]" />
              </div>
              <span className="text-base font-bold text-[#0a0a0a]">LeadAIStudio AIOps</span>
            </div>
            <p className="text-xs text-[#6b6b6d] max-w-sm">Enterprise IT Service Management and AIOps platform designed for global scale.</p>
          </div>
          <div>
            <h4 className="font-semibold text-[#0a0a0a] mb-3 text-xs">Product</h4>
            <ul className="space-y-2 text-xs text-[#3a3a3c]">
              <li><Link href="/p/aiops-telemetry" className="hover:text-[#00926f]">AIOps Telemetry</Link></li>
              <li><Link href="/p/flow-designer" className="hover:text-[#00926f]">Flow Designer</Link></li>
              <li><Link href="/p/service-catalog" className="hover:text-[#00926f]">Service Catalog</Link></li>
              <li><Link href="/p/pricing" className="hover:text-[#00926f]">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-[#0a0a0a] mb-3 text-xs">Company</h4>
            <ul className="space-y-2 text-xs text-[#3a3a3c]">
              <li><Link href="/p/about" className="hover:text-[#00926f]">About Us</Link></li>
              <li><Link href="/p/customers" className="hover:text-[#00926f]">Customers</Link></li>
              <li><Link href="/p/contact" className="hover:text-[#00926f]">Contact Sales</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-[#ededed] flex flex-col md:flex-row items-center justify-between">
          <div className="text-[#6b6b6d] text-xs">
            © 2026 LeadAIStudio AIOps. All rights reserved.
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0 text-xs text-[#6b6b6d]">
            <Link href="/p/privacy" className="hover:text-[#0a0a0a]">Privacy Policy</Link>
            <Link href="/p/terms" className="hover:text-[#0a0a0a]">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Users, Mail, Phone, MapPin, BrainCircuit, Workflow, BookOpen, Zap, TrendingDown, Clock, PiggyBank, Gauge, FileText, PlayCircle, GraduationCap, Newspaper, Download, Calendar, Bot, MonitorSmartphone, Boxes, ShoppingCart, Network, LayoutGrid } from "lucide-react";
import RoiCalculator from "@/components/roi-calculator";

// Individual Page Components
const AboutPage = () => (
  <div className="max-w-4xl mx-auto py-20 px-6">
    <div className="text-center mb-16">
      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">Our Mission to Automate IT</h1>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto">LeadAIStudio was founded by former enterprise IT directors who were tired of watching highly skilled engineers reset passwords and reboot servers.</p>
    </div>
    <div className="prose prose-slate max-w-none">
      <p className="text-lg text-slate-700 mb-6">We believe that the future of IT service management is invisible. By leveraging predictive AIOps, we enable hardware and software issues to be resolved autonomously, before the end-user even notices a degradation in service.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <div className="bg-white p-6 border border-slate-200 rounded-lg">
          <h3 className="text-xl font-bold text-slate-900 mb-3">Innovation First</h3>
          <p className="text-slate-600">We invest heavily in machine learning models that understand complex IT topologies.</p>
        </div>
        <div className="bg-white p-6 border border-slate-200 rounded-lg">
          <h3 className="text-xl font-bold text-slate-900 mb-3">Enterprise Grade</h3>
          <p className="text-slate-600">Built for scale, compliance, and rigorous data segregation from day one.</p>
        </div>
        <div className="bg-white p-6 border border-slate-200 rounded-lg">
          <h3 className="text-xl font-bold text-slate-900 mb-3">User Obsessed</h3>
          <p className="text-slate-600">We design beautiful interfaces that employees actually enjoy using.</p>
        </div>
      </div>
    </div>
  </div>
);

const ContactPage = () => (
  <div className="max-w-6xl mx-auto py-20 px-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-6">Let&apos;s transform your IT operations.</h1>
        <p className="text-lg text-slate-600 mb-10">Fill out the form to request a personalized demo, custom ROI analysis, or to speak with our enterprise sales team.</p>
        
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><Mail className="w-5 h-5" /></div>
            <div><p className="font-bold text-slate-900">Email Us</p><p className="text-slate-600">enterprise@leadaistudio.ai</p></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><Phone className="w-5 h-5" /></div>
            <div><p className="font-bold text-slate-900">Call Sales</p><p className="text-slate-600">+1 (800) 555-0199</p></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><MapPin className="w-5 h-5" /></div>
            <div><p className="font-bold text-slate-900">Headquarters</p><p className="text-slate-600">100 Innovation Drive, San Francisco, CA</p></div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-8 border border-slate-200 rounded-xl shadow-lg">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Request a Demo</h3>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">First Name</label>
              <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="John" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name</label>
              <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Doe" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Work Email</label>
            <input type="email" className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="john@company.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Company Size</label>
            <select className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500">
              <option>1-500 Employees</option>
              <option>500-2000 Employees</option>
              <option>2000+ Employees</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">How can we help?</label>
            <textarea className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 h-24" placeholder="Tell us about your IT challenges..."></textarea>
          </div>
          <button type="button" className="w-full py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors mt-4">
            Submit Request
          </button>
        </form>
      </div>
    </div>
  </div>
);

const SolutionsPage = () => (
  <div className="max-w-5xl mx-auto py-20 px-6">
    <div className="text-center mb-16">
      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">Solutions for Every Enterprise</h1>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto">Whether you are a global enterprise or a Managed Service Provider, LeadAIStudio adapts to your complex operational needs.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <ShieldCheck className="w-12 h-12 text-blue-600 mb-6" />
        <h2 className="text-2xl font-bold text-slate-900 mb-4">For Managed Service Providers (MSPs)</h2>
        <p className="text-slate-600 mb-6">Manage multiple clients from a single pane of glass using our strict Domain Separation architecture. Ensure complete data privacy while sharing global workflows.</p>
        <ul className="space-y-3 mb-8">
          <li className="flex items-center text-sm font-medium text-slate-700"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Tenant-specific branding</li>
          <li className="flex items-center text-sm font-medium text-slate-700"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Cross-domain analytics</li>
          <li className="flex items-center text-sm font-medium text-slate-700"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Isolated CMDBs</li>
        </ul>
        <Link href="/p/contact" className="text-blue-600 font-bold flex items-center hover:underline">Contact Sales <ArrowRight className="w-4 h-4 ml-1" /></Link>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl text-white">
        <Users className="w-12 h-12 text-blue-400 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-4">For Global Enterprises</h2>
        <p className="text-slate-400 mb-6">Scale your IT support across continents. Automate L1 requests, track hardware telemetry, and provide walk-up kiosks for physical device swaps.</p>
        <ul className="space-y-3 mb-8">
          <li className="flex items-center text-sm font-medium text-slate-300"><CheckCircle2 className="w-4 h-4 text-blue-400 mr-2" /> Automated Routing Rules</li>
          <li className="flex items-center text-sm font-medium text-slate-300"><CheckCircle2 className="w-4 h-4 text-blue-400 mr-2" /> Global Asset Management</li>
          <li className="flex items-center text-sm font-medium text-slate-300"><CheckCircle2 className="w-4 h-4 text-blue-400 mr-2" /> Strict SLA Enforcement</li>
        </ul>
        <Link href="/dashboard" className="text-white bg-blue-600 px-4 py-2 rounded font-bold inline-flex items-center hover:bg-blue-700">Try Interactive Demo <ArrowRight className="w-4 h-4 ml-2" /></Link>
      </div>
    </div>
  </div>
);

const LegalPage = ({ title }: { title: string }) => (
  <div className="max-w-3xl mx-auto py-20 px-6">
    <h1 className="text-4xl font-extrabold text-slate-900 mb-8">{title}</h1>
    <div className="prose prose-slate max-w-none text-slate-600">
      <p className="font-bold">Last Updated: June 2026</p>
      <p>This is a simulated legal document for demonstration purposes. In a real production environment, this page would contain the legally binding terms or privacy policy as drafted by corporate counsel.</p>
      <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Data Collection</h2>
      <p>We collect telemetry data exclusively for the purpose of predictive IT maintenance. All data is encrypted at rest and in transit.</p>
      <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. Compliance</h2>
      <p>LeadAIStudio is fully compliant with SOC2 Type II, GDPR, and HIPAA regulations regarding the storage of personally identifiable information.</p>
      <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. Domain Separation</h2>
      <p>For MSP clients, data is strictly segregated at the database level to ensure tenant isolation.</p>
    </div>
  </div>
);

const PRODUCT_MODULES = [
  {
    icon: <Bot className="w-6 h-6" />,
    name: "AI Service Desk",
    tag: "Resolve",
    desc: "An AI agent that triages, answers, and resolves employee requests in natural language — deflecting routine tickets autonomously and handing the rest to humans with full context.",
    points: ["Conversational ticket intake", "Autonomous L1 resolution", "Smart routing & escalation"],
  },
  {
    icon: <MonitorSmartphone className="w-6 h-6" />,
    name: "Digital Employee Experience (DEX)",
    tag: "Experience",
    desc: "Real-time visibility into device health, app performance, and login times across your fleet — so you can fix friction before employees ever feel it.",
    points: ["Endpoint health scoring", "Proactive remediation", "Experience analytics"],
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

const CustomersPage = () => (
  <div className="max-w-6xl mx-auto py-20 px-6">
    <div className="text-center mb-16">
      <span className="inline-block px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 font-semibold text-xs uppercase tracking-wider rounded-full mb-6">
        Customer Stories
      </span>
      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 max-w-3xl mx-auto leading-tight">
        IT leaders run their entire helpdesk on LeadAIStudio.
      </h1>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto">
        From 500-person scale-ups to 50,000-seat global enterprises, teams trust one platform to deflect tickets, predict failures, and delight employees.
      </p>
    </div>

    {/* Outcome stats */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
      <RoiStat icon={<TrendingDown className="w-5 h-5" />} value="52%" label="Faster Resolution" />
      <RoiStat icon={<Gauge className="w-5 h-5" />} value="3.4M" label="Tickets Deflected" />
      <RoiStat icon={<Users className="w-5 h-5" />} value="1.2M" label="Employees Supported" />
      <RoiStat icon={<ShieldCheck className="w-5 h-5" />} value="99.9%" label="SLA Compliance" />
    </div>

    {/* Case study cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
      {[
        {
          quote: "We redeployed two full-time engineers off the help desk within the first quarter.",
          who: "Director of IT Operations",
          org: "Global manufacturing · 14,000 employees",
          stat: "45% lower MTTR",
        },
        {
          quote: "Predictive telemetry caught a fleet-wide battery defect before a single laptop died in the field.",
          who: "VP of End-User Computing",
          org: "Financial services · 28,000 employees",
          stat: "$2.1M downtime avoided",
        },
        {
          quote: "Our employees finally treat IT like a product they love, not a queue they dread.",
          who: "Head of Digital Workplace",
          org: "SaaS scale-up · 3,000 employees",
          stat: "4.8 / 5 CSAT",
        },
      ].map((c) => (
        <div key={c.who} className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col">
          <div className="inline-flex w-fit px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-5">
            {c.stat}
          </div>
          <p className="text-slate-800 font-medium leading-relaxed mb-6 flex-1">&ldquo;{c.quote}&rdquo;</p>
          <div className="border-t border-slate-100 pt-4">
            <div className="font-bold text-slate-900 text-sm">{c.who}</div>
            <div className="text-slate-500 text-xs">{c.org}</div>
          </div>
        </div>
      ))}
    </div>

    {/* CTA */}
    <div className="bg-slate-900 rounded-2xl p-10 md:p-14 text-center">
      <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">Join the teams transforming IT.</h2>
      <p className="text-slate-400 max-w-xl mx-auto mb-8">
        See why IT leaders are consolidating their entire helpdesk stack onto one platform.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/p/contact" className="px-8 py-3.5 bg-white text-slate-900 font-semibold rounded-md hover:bg-slate-100 transition-colors">
          Talk to Sales
        </Link>
        <Link href="/dashboard" className="px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors">
          Try the Demo
        </Link>
      </div>
    </div>
  </div>
);

const PRICING_TIERS = [
  {
    name: "Team",
    blurb: "For growing IT teams getting started with automation.",
    price: "$8",
    unit: "/ employee / mo",
    cta: "Start Free Trial",
    highlighted: false,
    features: [
      "AI Service Desk (L1 deflection)",
      "Knowledge Management",
      "Service Catalogue",
      "Up to 1,000 employees",
      "Standard support",
    ],
  },
  {
    name: "Business",
    blurb: "For enterprises unifying their full helpdesk stack.",
    price: "$18",
    unit: "/ employee / mo",
    cta: "Request a Demo",
    highlighted: true,
    features: [
      "Everything in Team",
      "Digital Employee Experience (DEX)",
      "Asset Management & CMDB",
      "Flow Designer automation",
      "Predictive telemetry",
      "Priority support & SLA tracking",
    ],
  },
  {
    name: "Enterprise",
    blurb: "For global organizations and MSPs with complex needs.",
    price: "Custom",
    unit: "tailored to scale",
    cta: "Contact Sales",
    highlighted: false,
    features: [
      "Everything in Business",
      "Domain separation (multi-tenant)",
      "SSO, SCIM & advanced RBAC",
      "Dedicated success engineer",
      "Custom integrations & API limits",
      "99.9% uptime SLA",
    ],
  },
];

const PricingPage = () => (
  <div className="max-w-6xl mx-auto py-20 px-6">
    <div className="text-center mb-16">
      <span className="inline-block px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 font-semibold text-xs uppercase tracking-wider rounded-full mb-6">
        Pricing
      </span>
      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 max-w-3xl mx-auto leading-tight">
        One platform. One predictable price.
      </h1>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto">
        Replace a stack of point tools with a single subscription. Every plan includes the AI engine — scale up as you consolidate.
      </p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16 items-start">
      {PRICING_TIERS.map((t) => (
        <div
          key={t.name}
          className={`rounded-2xl p-8 flex flex-col ${
            t.highlighted
              ? "bg-slate-900 text-white shadow-2xl ring-2 ring-blue-500 lg:-mt-4"
              : "bg-white border border-slate-200"
          }`}
        >
          {t.highlighted && (
            <span className="inline-flex w-fit px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full mb-4">
              Most Popular
            </span>
          )}
          <h3 className={`text-xl font-bold mb-1 ${t.highlighted ? "text-white" : "text-slate-900"}`}>{t.name}</h3>
          <p className={`text-sm mb-6 ${t.highlighted ? "text-slate-400" : "text-slate-500"}`}>{t.blurb}</p>
          <div className="mb-6">
            <span className={`text-4xl font-extrabold ${t.highlighted ? "text-white" : "text-slate-900"}`}>{t.price}</span>
            <span className={`text-sm ml-2 ${t.highlighted ? "text-slate-400" : "text-slate-500"}`}>{t.unit}</span>
          </div>
          <Link
            href="/p/contact"
            className={`text-center px-6 py-3 font-semibold rounded-md transition-colors mb-8 ${
              t.highlighted
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {t.cta}
          </Link>
          <ul className="space-y-3">
            {t.features.map((f) => (
              <li key={f} className={`flex items-start text-sm ${t.highlighted ? "text-slate-300" : "text-slate-700"}`}>
                <CheckCircle2 className={`w-4 h-4 mr-2 mt-0.5 shrink-0 ${t.highlighted ? "text-blue-400" : "text-blue-500"}`} />
                {f}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    {/* FAQ */}
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-extrabold text-slate-900 mb-8 text-center">Pricing questions, answered</h2>
      <div className="space-y-4">
        {[
          {
            q: "How does per-employee pricing work?",
            a: "You're billed for active employees supported by the platform, not per agent or admin. As your headcount grows, pricing scales predictably.",
          },
          {
            q: "Can I start with one module and add more later?",
            a: "Yes. Many teams start with the AI Service Desk and expand into DEX, Asset Management, and automation as they consolidate tools.",
          },
          {
            q: "Is there a free trial?",
            a: "The Team plan includes a 14-day free trial with no credit card required. Business and Enterprise plans include a guided proof-of-value.",
          },
          {
            q: "Do you offer discounts for annual billing or nonprofits?",
            a: "Yes — annual commitments receive a discount, and we offer special pricing for nonprofits and education. Contact sales for details.",
          },
        ].map((item) => (
          <div key={item.q} className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="font-bold text-slate-900 mb-2">{item.q}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
      <div className="text-center mt-12">
        <p className="text-slate-600 mb-4">Still have questions about the right plan?</p>
        <Link href="/p/contact" className="px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors inline-block">
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
      <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 max-w-4xl mx-auto leading-[1.1]">
        One solution for the entire IT helpdesk.
      </h1>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
        AI Service Desk, Digital Employee Experience, Knowledge, Catalogue, and Asset Management — unified on a single platform. Replace your tangle of disconnected tools with one intelligent system of record.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/dashboard" className="px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
          Try the Interactive Demo <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href="/p/contact" className="px-8 py-3.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-50 transition-colors">
          Book a Walkthrough
        </Link>
      </div>
    </div>

    {/* Unified platform statement */}
    <div className="bg-slate-900 rounded-2xl p-10 md:p-14 mb-20 text-center">
      <LayoutGrid className="w-10 h-10 text-blue-400 mx-auto mb-6" />
      <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4 max-w-2xl mx-auto leading-snug">
        Six products. One platform. Zero swivel-chair.
      </h2>
      <p className="text-slate-400 max-w-2xl mx-auto">
        Every module shares the same data model, the same AI engine, and the same workflow fabric — so an asset record, a knowledge article, and a service request all speak to each other automatically. No integrations to maintain, no data silos to reconcile.
      </p>
    </div>

    {/* Modules grid */}
    <div className="mb-24">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">Everything your IT team runs on</h2>
        <p className="text-base text-slate-600 max-w-2xl mx-auto">
          Each capability is powerful on its own — and exponentially more so together.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCT_MODULES.map((m) => (
          <div key={m.name} className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col hover:shadow-lg hover:border-blue-200 transition-[box-shadow,border-color]">
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                {m.icon}
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{m.tag}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{m.name}</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-5">{m.desc}</p>
            <ul className="space-y-2 mt-auto">
              {m.points.map((p) => (
                <li key={p} className="flex items-center text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 mr-2 shrink-0" /> {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>

    {/* Why one platform */}
    <div className="mb-24">
      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3 text-center">Why one platform wins</h2>
      <p className="text-base text-slate-600 max-w-2xl mx-auto text-center mb-12">
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
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 md:p-14 text-center">
      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4">See the whole platform in action.</h2>
      <p className="text-base text-slate-600 max-w-xl mx-auto mb-8">
        Explore the live dashboard or book a guided walkthrough tailored to your IT environment.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/dashboard" className="px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors inline-block">
          Open the Demo
        </Link>
        <Link href="/p/contact" className="px-8 py-3.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-50 transition-colors inline-block">
          Talk to Sales
        </Link>
      </div>
    </div>
  </div>
);

const ProductValue = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-7">
    <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600 leading-relaxed text-sm">{desc}</p>
  </div>
);

const RoiPage = () => (
  <div className="max-w-6xl mx-auto py-20 px-6">
    {/* Hero */}
    <div className="text-center mb-16">
      <span className="inline-block px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 font-semibold text-xs uppercase tracking-wider rounded-full mb-6">
        Return on Investment
      </span>
      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 max-w-3xl mx-auto leading-tight">
        IT support that pays for itself in a single quarter.
      </h1>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto">
        LeadAIStudio AIOps turns your busiest cost center into a measurable profit lever — deflecting routine tickets, slashing resolution times, and giving every hour back to your highest-value engineers.
      </p>
    </div>

    {/* Headline proof band */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
      <RoiStat icon={<TrendingDown className="w-5 h-5" />} value="45%" label="Lower MTTR" />
      <RoiStat icon={<Gauge className="w-5 h-5" />} value="60%" label="L1 Ticket Deflection" />
      <RoiStat icon={<PiggyBank className="w-5 h-5" />} value="$1.2M" label="Avg. Annual Savings" />
      <RoiStat icon={<Clock className="w-5 h-5" />} value="< 90 days" label="Time to Payback" />
    </div>

    {/* Interactive calculator */}
    <div className="mb-24">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">Calculate your savings</h2>
        <p className="text-base text-slate-600 max-w-xl mx-auto">
          A live estimate built on benchmarks from real enterprise deployments. No email required.
        </p>
      </div>
      <RoiCalculator />
    </div>

    {/* Where the ROI comes from */}
    <div className="mb-24">
      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3 text-center">Four ways we move the bottom line</h2>
      <p className="text-base text-slate-600 max-w-2xl mx-auto text-center mb-12">
        Every dollar of return traces back to a concrete operational change — not a vague promise of &ldquo;efficiency.&rdquo;
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RoiDriver
          icon={<Gauge className="w-6 h-6" />}
          title="Autonomous L1 deflection"
          desc="Intelligent triage resolves password resets, access requests, and known issues with zero human touch — removing up to 60% of your ticket volume before it ever reaches an agent."
        />
        <RoiDriver
          icon={<BrainCircuit className="w-6 h-6" />}
          title="Predictive hardware maintenance"
          desc="Telemetry flags failing devices before they die, converting emergency replacements and lost-productivity hours into scheduled, low-cost interventions."
        />
        <RoiDriver
          icon={<Clock className="w-6 h-6" />}
          title="Faster mean time to resolution"
          desc="Auto-routing and full-context handoffs cut MTTR by 45%, so the tickets that do reach a human resolve in a fraction of the time — and SLAs stop slipping."
        />
        <RoiDriver
          icon={<ShieldCheck className="w-6 h-6" />}
          title="Compliance without overtime"
          desc="Automated SLA tracking and audit-ready logs eliminate the manual reporting that quietly drains your team every month-end and quarter-close."
        />
      </div>
    </div>

    {/* Testimonial */}
    <div className="bg-slate-900 rounded-2xl p-10 md:p-16 mb-20 text-center">
      <p className="text-2xl md:text-3xl font-bold text-white leading-snug max-w-3xl mx-auto mb-8">
        &ldquo;We redeployed two full-time engineers off the help desk within the first quarter. LeadAIStudio paid for itself before our first invoice was even due.&rdquo;
      </p>
      <div className="text-blue-400 font-semibold">Director of IT Operations</div>
      <div className="text-slate-400 text-sm">Global manufacturing enterprise · 14,000 employees</div>
    </div>

    {/* CTA */}
    <div className="text-center">
      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4">Want the numbers for your exact environment?</h2>
      <p className="text-base text-slate-600 max-w-xl mx-auto mb-8">
        Our team will build a tailored ROI model using your ticket data, headcount, and SLA targets — typically within 48 hours.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/p/contact" className="px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors">
          Request a Custom ROI Analysis
        </Link>
        <Link href="/dashboard" className="px-8 py-3.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-50 transition-colors">
          Try the Interactive Demo
        </Link>
      </div>
    </div>
  </div>
);

const RoiStat = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
    <div className="w-10 h-10 mx-auto rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
      {icon}
    </div>
    <div className="text-3xl font-extrabold text-slate-900 mb-1">{value}</div>
    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</div>
  </div>
);

const RoiDriver = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-7 hover:shadow-lg hover:border-blue-200 transition-[box-shadow,border-color]">
    <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{desc}</p>
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
      <span className="inline-block px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 font-semibold text-xs uppercase tracking-wider rounded-full mb-6">
        Resource Center
      </span>
      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 max-w-3xl mx-auto leading-tight">
        Everything you need to build a smarter IT operation.
      </h1>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto">
        Research, playbooks, and real customer stories from the teams pioneering autonomous IT — curated to help you plan, pitch, and scale your transformation.
      </p>
    </div>

    {/* Featured resource */}
    {RESOURCES.filter((r) => r.featured).map((r) => (
      <div key={r.title} className="bg-slate-900 rounded-2xl p-8 md:p-12 mb-16 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        <div className="lg:col-span-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-blue-400 mb-4">
            {r.icon} Featured {r.type}
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4 leading-tight">{r.title}</h2>
          <p className="text-slate-400 mb-6 max-w-xl">{r.desc}</p>
          <Link href={r.href ?? "/p/contact"} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-semibold rounded-md hover:bg-slate-100 transition-colors">
            {r.cta} <Download className="w-4 h-4" />
          </Link>
        </div>
        <div className="hidden lg:flex justify-end">
          <div className="w-40 h-52 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-2xl rotate-3 flex items-center justify-center">
            <FileText className="w-16 h-16 text-white/80" />
          </div>
        </div>
      </div>
    ))}

    {/* Resource grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
      {RESOURCES.filter((r) => !r.featured).map((r) => (
        <div key={r.title} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col hover:shadow-lg hover:border-blue-200 transition-[box-shadow,border-color]">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
              {r.icon} {r.type}
            </span>
            <span className="text-xs text-slate-400 ml-auto">{r.meta}</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">{r.title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">{r.desc}</p>
          <Link href={r.href ?? "/p/contact"} className="mt-auto inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:gap-3 transition-all">
            {r.cta} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ))}
    </div>

    {/* Newsletter CTA */}
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-16">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Get IT intelligence in your inbox</h2>
        <p className="text-slate-600">Monthly insights on AIOps, automation strategy, and the metrics that matter — no fluff, unsubscribe anytime.</p>
      </div>
      <form className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          placeholder="you@company.com"
          className="flex-1 px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button type="button" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap">
          Subscribe
        </button>
      </form>
    </div>

    {/* Talk to sales CTA */}
    <div className="text-center">
      <Calendar className="w-10 h-10 text-blue-600 mx-auto mb-4" />
      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4">Prefer a conversation?</h2>
      <p className="text-base text-slate-600 max-w-xl mx-auto mb-8">
        Book a 30-minute briefing with a solutions engineer and we&apos;ll map LeadAIStudio to your exact environment.
      </p>
      <Link href="/p/contact" className="px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors inline-block">
        Talk to Sales
      </Link>
    </div>
  </div>
);

const FeatureDeepDive = ({ title, icon, subtitle, content }: { title: string; icon: React.ReactNode; subtitle: string; content: string }) => (
  <div className="max-w-4xl mx-auto py-20 px-6">
    <div className="flex items-center space-x-4 mb-8">
      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900">{title}</h1>
        <p className="text-xl text-slate-600">{subtitle}</p>
      </div>
    </div>
    <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
      <p className="text-lg text-slate-700 leading-relaxed">{content}</p>
      <div className="mt-8 pt-8 border-t border-slate-100">
        <Link href="/dashboard" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700">See it in action in the Dashboard</Link>
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
    description: "Simple per-employee pricing across Team, Business, and Enterprise plans. Every plan includes the AI engine.",
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
          <h1 className="text-4xl font-extrabold text-slate-900 mb-6 capitalize">{normalizedSlug.replace('-', ' ')}</h1>
          <p className="text-xl text-slate-600 mb-10">We are currently migrating this section to our new enterprise portal.</p>
          <Link href="/p/contact" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors">
            Contact Sales for Details
          </Link>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200 text-slate-900">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="flex items-center justify-between px-6 lg:px-8 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="text-xl font-bold tracking-tight text-slate-900">
              LeadAIStudio AIOps
            </div>
          </Link>
          <div className="hidden md:flex items-center space-x-8 text-xs font-medium text-slate-600">
            <Link href="/p/product" className="hover:text-blue-600 transition-colors">Product</Link>
            <Link href="/p/solutions" className="hover:text-blue-600 transition-colors">Solutions</Link>
            <Link href="/p/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
            <Link href="/p/roi" className="hover:text-blue-600 transition-colors">ROI</Link>
            <Link href="/p/resources" className="hover:text-blue-600 transition-colors">Resources</Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors hidden sm:block">Log in</Link>
            <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-sm">
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
      <footer className="bg-white border-t border-slate-200 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-5 h-5 bg-slate-900 rounded flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="text-base font-bold text-slate-900">LeadAIStudio AIOps</span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm">Enterprise IT Service Management and AIOps platform designed for global scale.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-3 text-xs">Product</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link href="/p/aiops-telemetry" className="hover:text-blue-600">AIOps Telemetry</Link></li>
              <li><Link href="/p/flow-designer" className="hover:text-blue-600">Flow Designer</Link></li>
              <li><Link href="/p/service-catalog" className="hover:text-blue-600">Service Catalog</Link></li>
              <li><Link href="/p/pricing" className="hover:text-blue-600">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-3 text-xs">Company</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link href="/p/about" className="hover:text-blue-600">About Us</Link></li>
              <li><Link href="/p/customers" className="hover:text-blue-600">Customers</Link></li>
              <li><Link href="/p/contact" className="hover:text-blue-600">Contact Sales</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between">
          <div className="text-slate-500 text-xs">
            © 2026 LeadAIStudio AIOps. All rights reserved.
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0 text-xs text-slate-500">
            <Link href="/p/privacy" className="hover:text-slate-900">Privacy Policy</Link>
            <Link href="/p/terms" className="hover:text-slate-900">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

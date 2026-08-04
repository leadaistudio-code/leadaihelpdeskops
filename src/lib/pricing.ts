// The single source of truth for public pricing.
//
// The site previously shipped two different, contradictory price lists: the
// landing page sold "$0 forever / $6 per device / mo", and `/p/pricing` sold
// "$8 / $18 per *employee* / mo" — a different unit of metering, different
// numbers, and different tier names. A prospect who read both had no idea what
// the product costs, and a buyer who noticed treated it the same way they treat
// any other inconsistency found during diligence.
//
// EDIT PRICING HERE AND NOWHERE ELSE. Both `/` and `/p/pricing` render from this
// array, so they cannot drift apart again.
//
// The per-device model was kept as the canonical one because it is the unit the
// platform can actually count: an enrolled `Device` is a row we own, whereas
// "active employees supported" is a number nobody can verify from telemetry.
// If the commercial decision is per-employee, change `unit` and `price` here and
// both pages follow.

export type PricingTier = {
  name: string;
  price: string;
  unit: string;
  blurb: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted: boolean;
  // Capabilities that are sold but not yet built. These are stated separately
  // and explicitly rather than mixed into `features`, because listing an
  // unbuilt capability alongside shipping ones is the claim that ends a
  // procurement review when it is discovered.
  roadmapNote?: string;
};

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Starter",
    price: "$0",
    unit: "/ forever",
    blurb: "For small teams getting their first taste of autonomous IT.",
    features: [
      "Up to 50 endpoints",
      "AI service desk & knowledge base",
      "Live device telemetry",
      "Community support",
    ],
    cta: "Start free",
    ctaHref: "/dashboard",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$6",
    unit: "/ device / mo",
    blurb: "For scaling teams that want issues fixed before they land.",
    features: [
      "Unlimited endpoints",
      "Automated remediation & self-heal",
      "Predictive AIOps & dependency maps",
      "SLA engine & visual flow designer",
      "Asset management",
      "Priority support",
    ],
    cta: "Start free trial",
    ctaHref: "/dashboard",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    unit: "tailored to scale",
    blurb: "For MSPs and regulated orgs with strict isolation needs.",
    features: [
      "Everything in Growth",
      "MSP multi-tenant isolation",
      "Role-based access control",
      "Tamper-evident audit log",
      "Dedicated success engineer",
      "Custom integrations & API limits",
    ],
    // SSO/SAML and SCIM do not exist in this codebase in any form — the words
    // appear nowhere outside marketing copy. The uptime SLA is likewise not
    // offerable: /api/health now exists, but there is no monitoring history
    // behind it to support a contractual number yet.
    cta: "Contact sales",
    ctaHref: "/p/contact",
    highlighted: false,
    roadmapNote:
      "On the roadmap, not yet available: SSO/SAML, SCIM provisioning, and a contractual uptime SLA.",
  },
];

export const PRICING_FAQ = [
  {
    q: "How does per-device pricing work?",
    a: "You're billed for enrolled devices streaming telemetry, not per agent or admin seat. Devices you retire stop billing the following cycle.",
  },
  {
    q: "Can I start with one module and add more later?",
    a: "Yes. Most teams start with the AI service desk and expand into DEX and automation as they consolidate tools.",
  },
  {
    q: "Is there a free trial?",
    a: "Starter is free forever for up to 50 endpoints, so you can run the product on real hardware before paying anything. Growth includes a 14-day trial.",
  },
  {
    q: "Do you offer discounts for annual billing or nonprofits?",
    a: "Yes — annual commitments receive a discount, and we offer special pricing for nonprofits and education. Contact sales for details.",
  },
];

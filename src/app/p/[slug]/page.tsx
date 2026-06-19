import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Users, Mail, Phone, MapPin, BrainCircuit, Workflow, BookOpen, Zap } from "lucide-react";

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
        <h1 className="text-4xl font-extrabold text-slate-900 mb-6">Let's transform your IT operations.</h1>
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

const FeatureDeepDive = ({ title, icon, subtitle, content }: any) => (
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

export default async function GenericMarketingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();

  let content;

  switch (normalizedSlug) {
    case 'about':
      content = <AboutPage />;
      break;
    case 'contact':
      content = <ContactPage />;
      break;
    case 'solutions':
      content = <SolutionsPage />;
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

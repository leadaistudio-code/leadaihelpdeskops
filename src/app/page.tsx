import Link from "next/link";
import { ArrowRight, Bot, Zap, Network, ShieldCheck, Cpu, BrainCircuit, TabletSmartphone, MousePointerClick, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200 overflow-x-hidden text-slate-900">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="flex items-center justify-between px-6 lg:px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="text-xl font-bold tracking-tight text-slate-900">
              LeadAIStudio AIOps
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-xs font-medium text-slate-600">
            <Link href="/p/product" className="hover:text-blue-600 transition-colors">Product</Link>
            <Link href="/p/solutions" className="hover:text-blue-600 transition-colors">Solutions</Link>
            <Link href="/p/roi" className="hover:text-blue-600 transition-colors">ROI</Link>
            <Link href="/p/resources" className="hover:text-blue-600 transition-colors">Resources</Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors hidden sm:block">Log in</Link>
            <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-sm">
              Request Demo
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex flex-col items-center pt-24 pb-32">
        
        {/* Hero Section */}
        <div className="text-center max-w-4xl px-6 mx-auto mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 font-semibold text-xs uppercase tracking-wider rounded-full mb-6">
            <span>New Release: AIOps 2.0</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
            Resolve IT issues faster with intelligent automation.
          </h1>
          
          <p className="text-lg text-slate-600 font-normal mb-10 max-w-2xl mx-auto leading-relaxed">
            LeadAIStudio AIOps unifies your IT service management and hardware telemetry. Prevent outages before they happen and streamline your global workforce support.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/dashboard" className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white font-semibold text-sm rounded-md shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center">
              <span>Try Interactive Demo</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link href="#roi" className="w-full sm:w-auto px-8 py-3.5 bg-white border border-slate-300 text-slate-700 font-semibold text-sm rounded-md hover:bg-slate-50 transition-colors flex items-center justify-center">
              Calculate ROI
            </Link>
          </div>
        </div>

        {/* Flat, Grounded Mockup */}
        <div className="w-full max-w-6xl px-6 mx-auto mb-20">
          <div className="relative rounded-lg overflow-hidden border border-slate-200 shadow-2xl bg-white">
            {/* Browser Frame */}
            <div className="h-12 bg-slate-100 flex items-center px-4 border-b border-slate-200">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              </div>
              <div className="mx-auto px-6 py-1 bg-white border border-slate-200 rounded text-xs text-slate-500 font-medium w-96 text-center flex items-center justify-center space-x-2">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z"></path></svg>
                <span>leadaistudio.ai/dashboard</span>
              </div>
            </div>
            {/* Mockup Image */}
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2000" 
              alt="LeadAIStudio Dashboard Layout" 
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Trusted By Logos */}
        <div className="w-full max-w-7xl px-6 mx-auto mb-32 border-t border-b border-slate-200 py-12">
          <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">Trusted by industry leaders globally</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale">
            {/* Simplified CSS geometric shapes to represent generic corporate logos */}
            <div className="flex items-center space-x-2"><div className="w-5 h-5 bg-slate-800 rounded-sm"></div><span className="font-bold text-lg text-slate-800">AcmeCorp</span></div>
            <div className="flex items-center space-x-2"><div className="w-5 h-5 rounded-full border-[3px] border-slate-800"></div><span className="font-bold text-lg text-slate-800 tracking-tight">Globex</span></div>
            <div className="flex items-center space-x-2"><div className="w-5 h-5 bg-slate-800 rotate-45"></div><span className="font-bold text-lg text-slate-800">Initech</span></div>
            <div className="flex items-center space-x-2"><div className="w-5 h-5 bg-slate-800 rounded-tl-xl rounded-br-xl"></div><span className="font-bold text-lg text-slate-800 font-serif">Soylent</span></div>
            <div className="flex items-center space-x-2"><div className="w-7 h-3 bg-slate-800"></div><span className="font-bold text-lg text-slate-800 italic">Massive Dynamic</span></div>
          </div>
        </div>

        {/* Features Grid */}
        <div id="product" className="w-full max-w-6xl px-6 mx-auto mb-32">
          <div className="max-w-3xl mb-16">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-4">Enterprise-grade IT operations.</h2>
            <p className="text-base text-slate-600">Built from the ground up to support massive scale, complex organizational structures, and rigorous compliance requirements.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<BrainCircuit className="w-6 h-6 text-blue-600" />}
              title="Predictive Telemetry"
              desc="Analyze historical hardware performance to identify degradation and trigger proactive maintenance workflows."
            />
            <FeatureCard 
              icon={<Network className="w-6 h-6 text-blue-600" />}
              title="Dependency Mapping"
              desc="Map complex relationships between Business Services and physical infrastructure to understand incident impact."
            />
            <FeatureCard 
              icon={<MousePointerClick className="w-6 h-6 text-blue-600" />}
              title="Visual Flow Designer"
              desc="Construct approval chains, routing rules, and SLA configurations through a visual builder interface."
            />
            <FeatureCard 
              icon={<Bot className="w-6 h-6 text-blue-600" />}
              title="Automated Routing"
              desc="Deflect Level 1 tickets using intelligent categorization, escalating to human agents with full context when necessary."
            />
            <FeatureCard 
              icon={<TabletSmartphone className="w-6 h-6 text-blue-600" />}
              title="Physical Service Desks"
              desc="Manage in-person IT support queues with a dedicated interface for hardware drop-offs and replacements."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6 text-blue-600" />}
              title="Data Segregation"
              desc="Isolate client environments using strict domain separation architecture, designed specifically for MSPs."
            />
          </div>
        </div>

        {/* ROI Section */}
        <div id="roi" className="w-full max-w-6xl px-6 mx-auto mb-20">
          <div className="bg-slate-900 rounded-2xl p-10 md:p-16 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
              <div>
                <h2 className="text-2xl font-extrabold text-white mb-4">Measurable impact on the bottom line.</h2>
                <p className="text-base text-slate-400 mb-8">LeadAIStudio AIOps drastically reduces resolution times and operational overhead, yielding rapid return on investment.</p>
                
                <ul className="space-y-4 mb-8 text-sm">
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 mr-3 mt-0.5 shrink-0" />
                    <span className="text-slate-300">Decrease Level 1 support costs.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 mr-3 mt-0.5 shrink-0" />
                    <span className="text-slate-300">Minimize employee downtime via proactive hardware fixes.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 mr-3 mt-0.5 shrink-0" />
                    <span className="text-slate-300">Maintain strict compliance with automated SLA tracking.</span>
                  </li>
                </ul>

                <Link href="/dashboard" className="inline-flex px-6 py-3 bg-white text-slate-900 font-semibold rounded-md hover:bg-slate-100 transition-colors text-xs">
                  Request a Custom ROI Analysis
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard value="45%" label="Reduction in MTTR" />
                <StatCard value="60%" label="Ticket Deflection" />
                <StatCard value="$1.2M" label="Annual Savings" />
                <StatCard value="99.9%" label="SLA Compliance" />
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
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

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow">
      <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string, label: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 flex flex-col justify-center">
      <div className="text-3xl font-extrabold text-white mb-1">{value}</div>
      <div className="text-xs font-semibold text-blue-400">{label}</div>
    </div>
  );
}

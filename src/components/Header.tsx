"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useUser, useAuth, OrganizationSwitcher } from "@clerk/nextjs";
import { ShieldAlert, LogOut, User, Globe, Moon, Sun, Monitor, Settings, ChevronDown, X, Save } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import Logo from "@/components/Logo";
import { getMyProfile, updateMyProfile } from "@/app/actions/userActions";
import { toast } from "@/components/toast";
import { useAppTheme, ThemeToggle } from "@/components/ThemeContext";

export default function Header() {
  const { user: clerkUser } = useUser();
  const { signOut } = useAuth();
  const { theme, toggle: toggleTheme, setTheme } = useAppTheme();
  const role = (clerkUser?.publicMetadata?.role as string) || "EMPLOYEE";
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Editable profile form, hydrated from the database when settings opens.
  const [form, setForm] = useState({ name: "", jobTitle: "", emailNotifications: true });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeSettingsTab && !loaded) {
      getMyProfile().then((p) => {
        if (p) {
          setForm({ name: p.name, jobTitle: p.jobTitle, emailNotifications: p.emailNotifications });
          setLoaded(true);
        }
      });
    }
  }, [activeSettingsTab, loaded]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateMyProfile(form);
      toast("Profile saved");
      setActiveSettingsTab(null);
    } catch {
      toast("Couldn't save profile", "error");
    }
    setSaving(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openSettings = (tab: string) => {
    setActiveSettingsTab(tab);
    setIsProfileOpen(false);
  };
  
  return (
    <>
      <header className="h-16 flex items-center justify-between px-6 fixed top-0 w-full z-40 transition-all duration-300 bg-slate-950/40 backdrop-blur-xl border-b border-white/5">
        <Link href="/dashboard" className="flex items-center">
          <Logo size={34} />
        </Link>
        
        <div className="flex items-center space-x-5">
          <ThemeToggle
            theme={theme}
            toggle={toggleTheme}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
          />
          {clerkUser ? (
            <div className="flex items-center space-x-4">
              {/* Native tenant (organization) switcher: create + switch customer spaces. */}
              <OrganizationSwitcher
                hidePersonal
                afterCreateOrganizationUrl="/dashboard"
                afterSelectOrganizationUrl="/dashboard"
                appearance={{ elements: { rootBox: "flex items-center", organizationSwitcherTrigger: "text-slate-200 hover:bg-white/5 rounded-xl px-3 py-1.5 border border-white/10" } }}
              />
              <NotificationBell />
              <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 hover:bg-white/5 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-white/10"
              >
                <div className="text-right hidden md:block">
                  <div className="text-sm font-bold text-slate-100">{clerkUser.fullName}</div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">{role.replace('_', ' ')}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.2)] flex items-center justify-center font-bold text-white text-lg overflow-hidden">
                  {clerkUser.imageUrl ? <img src={clerkUser.imageUrl} alt="Profile" /> : (clerkUser.fullName?.charAt(0) || 'U')}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                  <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-indigo-400/50 shadow-lg flex items-center justify-center font-bold text-white text-2xl shrink-0 overflow-hidden">
                        {clerkUser.imageUrl ? <img src={clerkUser.imageUrl} alt="Profile" /> : (clerkUser.fullName?.charAt(0) || 'U')}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-lg font-bold text-white truncate">{clerkUser.fullName}</div>
                        <div className="text-sm text-slate-400 truncate">{clerkUser.primaryEmailAddress?.emailAddress || "user@leadaistudio.ai"}</div>
                        <div className="mt-1 inline-block px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded border border-indigo-500/30 uppercase tracking-wider">
                          {role.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button onClick={() => openSettings('profile')} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-slate-300 hover:text-white group">
                      <User className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                      <div className="text-left flex-1">
                        <div className="text-sm font-bold">Profile Details</div>
                        <div className="text-xs text-slate-500">Manage your personal information</div>
                      </div>
                    </button>
                    
                    <button onClick={() => openSettings('region')} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-slate-300 hover:text-white group">
                      <Globe className="w-5 h-5 text-slate-500 group-hover:text-sky-400 transition-colors" />
                      <div className="text-left flex-1">
                        <div className="text-sm font-bold">Region & Language</div>
                        <div className="text-xs text-slate-500">English (US) • PST Time Zone</div>
                      </div>
                    </button>

                    <button onClick={() => openSettings('display')} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-slate-300 hover:text-white group">
                      <Monitor className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                      <div className="text-left flex-1">
                        <div className="text-sm font-bold">Display Preferences</div>
                        <div className="text-xs text-slate-500">Dark Mode • Compact Density</div>
                      </div>
                    </button>

                    <button onClick={() => openSettings('account')} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-slate-300 hover:text-white group">
                      <Settings className="w-5 h-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                      <div className="text-left flex-1">
                        <div className="text-sm font-bold">Account Settings</div>
                        <div className="text-xs text-slate-500">Security, Notifications, API Keys</div>
                      </div>
                    </button>
                  </div>

                  <div className="p-2 border-t border-white/5 bg-black/20">
                    <button 
                      onClick={() => signOut()}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-colors font-bold text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
            <div className="flex items-center space-x-2 text-sm font-medium text-slate-400">
              <ShieldAlert className="w-4 h-4" />
              <span>Not authenticated</span>
            </div>
          )}
        </div>
      </header>

      {/* Settings Modal overlaying everything z-50 */}
      {activeSettingsTab && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-4xl h-[600px] glass-panel border border-white/10 rounded-2xl shadow-2xl flex bg-slate-900/95 overflow-hidden">
            
            {/* Sidebar */}
            <div className="w-64 border-r border-white/5 bg-slate-950/30 p-4 flex flex-col space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-4 py-2 mb-2">User Settings</div>
              
              <button onClick={() => setActiveSettingsTab('profile')} className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors text-sm font-bold ${activeSettingsTab === 'profile' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                <User className="w-4 h-4" />
                <span>Profile Details</span>
              </button>
              <button onClick={() => setActiveSettingsTab('region')} className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors text-sm font-bold ${activeSettingsTab === 'region' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                <Globe className="w-4 h-4" />
                <span>Region & Language</span>
              </button>
              <button onClick={() => setActiveSettingsTab('display')} className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors text-sm font-bold ${activeSettingsTab === 'display' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                <Monitor className="w-4 h-4" />
                <span>Display Preferences</span>
              </button>
              <button onClick={() => setActiveSettingsTab('account')} className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors text-sm font-bold ${activeSettingsTab === 'account' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                <Settings className="w-4 h-4" />
                <span>Account Settings</span>
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white capitalize">{activeSettingsTab.replace('region', 'Region & Language')}</h2>
                <button onClick={() => setActiveSettingsTab(null)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {activeSettingsTab === 'profile' && (
                  <div className="space-y-6 max-w-lg">
                    <div className="flex items-center space-x-6 mb-8">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-indigo-400/50 shadow-lg flex items-center justify-center font-bold text-white text-4xl overflow-hidden">
                        {clerkUser?.imageUrl ? <img src={clerkUser.imageUrl} alt="Profile" /> : (clerkUser?.fullName?.charAt(0) || 'U')}
                      </div>
                      <button className="px-4 py-2 border border-white/20 rounded-lg text-sm font-bold text-white hover:bg-white/10 transition-colors">Upload new picture</button>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                      <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                      <input type="email" disabled defaultValue={clerkUser?.primaryEmailAddress?.emailAddress || ''} className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-slate-400 opacity-70 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Job Title</label>
                      <input type="text" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder="e.g., Network Engineer" className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors" />
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'region' && (
                  <div className="space-y-6 max-w-lg">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Language</label>
                      <select className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors">
                        <option>English (US)</option>
                        <option>English (UK)</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>German</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Time Zone</label>
                      <select className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors">
                        <option>(UTC-08:00) Pacific Time (US & Canada)</option>
                        <option>(UTC-05:00) Eastern Time (US & Canada)</option>
                        <option>(UTC+00:00) Greenwich Mean Time</option>
                        <option>(UTC+05:30) Indian Standard Time</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Date Format</label>
                      <select className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors">
                        <option>YYYY-MM-DD</option>
                        <option>MM/DD/YYYY</option>
                        <option>DD/MM/YYYY</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'display' && (
                  <div className="space-y-6 max-w-lg">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Theme</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setTheme('dark')}
                          className={`p-4 rounded-xl border font-bold flex flex-col items-center justify-center space-y-2 transition-colors ${theme === 'dark' ? 'border-indigo-500/50 bg-indigo-500/10 text-white' : 'border-white/10 bg-black/30 text-slate-400 hover:text-white'}`}
                        >
                          <Moon className={`w-6 h-6 ${theme === 'dark' ? 'text-indigo-400' : ''}`} />
                          <span>Dark Mode</span>
                        </button>
                        <button
                          onClick={() => setTheme('light')}
                          className={`p-4 rounded-xl border font-bold flex flex-col items-center justify-center space-y-2 transition-colors ${theme === 'light' ? 'border-indigo-500/50 bg-indigo-500/10 text-white' : 'border-white/10 bg-black/30 text-slate-400 hover:text-white'}`}
                        >
                          <Sun className={`w-6 h-6 ${theme === 'light' ? 'text-amber-400' : ''}`} />
                          <span>Light Mode</span>
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">UI Density</label>
                      <select className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors">
                        <option>Compact (Recommended)</option>
                        <option>Spacious</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'account' && (
                  <div className="space-y-6 max-w-lg">
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <ShieldAlert className="w-5 h-5 mb-2" />
                      <p className="text-sm font-medium">To change your password or 2FA settings, please visit the central corporate identity portal.</p>
                    </div>
                    <div>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="checkbox" checked={form.emailNotifications} onChange={(e) => setForm({ ...form, emailNotifications: e.target.checked })} className="w-5 h-5 rounded border-white/10 bg-black/30 accent-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900" />
                        <span className="text-sm font-bold text-white">Receive Email Notifications</span>
                      </label>
                      <p className="text-xs text-slate-400 ml-8 mt-1">Get emails when your tickets are updated.</p>
                    </div>
                    <div>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="checkbox" className="w-5 h-5 rounded border-white/10 bg-black/30 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900" />
                        <span className="text-sm font-bold text-white">SMS Alerts for P1 Critical Incidents</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end space-x-3">
                <button onClick={() => setActiveSettingsTab(null)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-300 hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={saveProfile} disabled={saving} className="px-5 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-colors flex items-center space-x-2 disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving…" : "Save Changes"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

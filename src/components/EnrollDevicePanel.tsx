"use client";

import { useEffect, useState } from "react";
import { Download, Copy, Check, TerminalSquare } from "lucide-react";
import { getEnrollmentInfo } from "@/app/actions/dexActions";
import { Panel, PanelHeader, Button } from "@/components/ui";

// Admin-only: a 2-step "enroll a laptop" flow — download the agent, then run
// the install command. Renders nothing for non-admins.
export default function EnrollDevicePanel() {
  const [token, setToken] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
    getEnrollmentInfo().then((info) => setToken(info?.token ?? null)).catch(() => {});
  }, []);

  if (!token) return null;

  const cliCommand = `aiops-agent.exe --install --server="${origin}" --token="${token}"`;

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <Panel padded={false} className="mb-8">
      <PanelHeader title="Enroll a device" icon={Download} />
      <div className="p-6">
        <p className="text-xs text-slate-500 -mt-1 mb-5">Get a laptop streaming live telemetry into this tenant in under a minute.</p>

        {/* Step 1 — download */}
        <div className="flex items-start gap-4 mb-6">
          <StepNum n={1} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 mb-1">Download Agent & Config</p>
            <p className="text-xs text-slate-500 mb-3">
              Download the agent binary and your tenant configuration file. Keep them in the same folder.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href={`/aiops-agent.exe`} icon={Download} download>
                1. Download Agent (.exe)
              </Button>
              <Button href={`/api/agent/download?token=${encodeURIComponent(token)}&configOnly=true`} icon={Download} variant="secondary" download>
                2. Download Config (.json)
              </Button>
            </div>
          </div>
        </div>

        {/* Step 2 — double-click */}
        <div className="flex items-start gap-4">
          <StepNum n={2} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 mb-1">Extract &amp; double-click</p>
            <p className="text-xs text-slate-500">
              Unzip on the laptop and double-click <code className="text-slate-300">aiops-agent.exe</code>. It runs silently in the
              <strong className="text-slate-300"> system tray</strong> (no window) — right-click the tray icon for status, logs, or to pause/quit.
              It auto-starts on logon and adds a Desktop shortcut. The device appears below within ~30s.
            </p>
          </div>
        </div>

        {/* Advanced: CLI for RMM/Intune */}
        <details className="mt-5 pt-4 border-t border-white/5">
          <summary className="text-xs font-semibold text-slate-400 cursor-pointer hover:text-slate-200">Advanced: silent deploy via RMM / Intune (command line)</summary>
          <div className="mt-3">
            <CommandRow icon={<TerminalSquare className="w-4 h-4 text-slate-400" />} label="Install with arguments" cmd={cliCommand} copied={copied === "cli"} onCopy={() => copy(cliCommand, "cli")} />
          </div>
        </details>

        <p className="text-xs text-slate-500 mt-4">
          Uninstall any time with <code className="text-slate-300">aiops-agent.exe --uninstall</code>. The enrollment token is unique to this tenant — keep it private.
        </p>
      </div>
    </Panel>
  );
}

function StepNum({ n }: { n: number }) {
  return (
    <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
      {n}
    </div>
  );
}

function CommandRow({ icon, label, cmd, copied, onCopy }: { icon: React.ReactNode; label: string; cmd: string; copied: boolean; onCopy: () => void }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-slate-400">{icon} {label}</div>
      <div className="flex items-stretch gap-2">
        <code className="flex-1 min-w-0 px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto whitespace-nowrap">{cmd}</code>
        <button onClick={onCopy} className="px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 transition-colors shrink-0" title="Copy">
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

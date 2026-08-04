"use client";

import { useEffect, useState, useTransition } from "react";
import { Download, Copy, Check, TerminalSquare, KeyRound, ShieldOff, AlertTriangle } from "lucide-react";
import {
  listEnrollmentTokens,
  issueEnrollmentToken,
  revokeEnrollmentToken,
  type EnrollmentTokenView,
} from "@/app/actions/dexActions";
import { Panel, PanelHeader, Button } from "@/components/ui";

// Admin-only: issue a short-lived enrollment token, then download the agent and
// its config. Renders nothing for non-admins.
//
// Enrollment tokens used to be one permanent, unrevocable value per tenant that
// this panel fetched and displayed on every render. They are now issued
// deliberately, expire, and can be revoked — so the panel shows the token value
// exactly once, at the moment it is created, and a管 list of outstanding tokens
// with a revoke control.
export default function EnrollDevicePanel() {
  const [tokens, setTokens] = useState<EnrollmentTokenView[] | null>(null);
  const [issued, setIssued] = useState<EnrollmentTokenView | null>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
    listEnrollmentTokens()
      .then(setTokens)
      .catch(() => setTokens([]));
  }, []);

  // Non-admins get an empty list from the server action and see nothing.
  if (tokens === null || (tokens.length === 0 && !issued && !pending && !error)) {
    return tokens === null ? null : <IssueOnly onIssue={issue} pending={pending} />;
  }

  function issue() {
    setError(null);
    startTransition(async () => {
      try {
        const t = await issueEnrollmentToken();
        setIssued(t);
        setTokens(await listEnrollmentTokens());
      } catch {
        setError("Only an admin can issue enrollment tokens.");
      }
    });
  }

  function revoke(id: string) {
    setError(null);
    startTransition(async () => {
      try {
        await revokeEnrollmentToken(id);
        if (issued?.id === id) setIssued(null);
        setTokens(await listEnrollmentTokens());
      } catch {
        setError("Could not revoke that token.");
      }
    });
  }

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const cliCommand = issued
    ? `aiops-agent.exe --install --server="${origin}" --token="${issued.token}"`
    : null;

  return (
    <Panel padded={false} className="mb-8">
      <PanelHeader title="Enroll a device" icon={Download} />
      <div className="p-6">
        <p className="text-xs text-slate-500 -mt-1 mb-5">
          Get a laptop streaming live telemetry into this tenant in under a minute.
        </p>

        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2.5 text-xs text-rose-300">
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1 — issue a token */}
        <div className="mb-6 flex items-start gap-4">
          <StepNum n={1} />
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-sm font-semibold text-slate-200">Issue an enrollment token</p>
            <p className="mb-3 text-xs text-slate-500">
              Single use, valid 24 hours. Shown once — copy it now, and revoke it below if it leaks.
            </p>
            <Button onClick={issue} icon={KeyRound} disabled={pending}>
              {pending ? "Issuing…" : "Issue token"}
            </Button>

            {issued?.token && (
              <div className="mt-3">
                <CommandRow
                  icon={<KeyRound className="h-4 w-4 text-signal-mint" />}
                  label="Your new token — this is the only time it is displayed"
                  cmd={issued.token}
                  copied={copied === "token"}
                  onCopy={() => copy(issued.token!, "token")}
                />
              </div>
            )}
          </div>
        </div>

        {/* Step 2 — download */}
        <div className="mb-6 flex items-start gap-4">
          <StepNum n={2} />
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-sm font-semibold text-slate-200">Download agent &amp; config</p>
            <p className="mb-3 text-xs text-slate-500">
              Download the agent binary and the configuration file for this token. Keep them in the same folder.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href="/aiops-agent.exe" icon={Download} download>
                Download agent (.exe)
              </Button>
              <Button
                href={
                  issued?.token
                    ? `/api/agent/download?token=${encodeURIComponent(issued.token)}&configOnly=true`
                    : undefined
                }
                icon={Download}
                variant="secondary"
                disabled={!issued?.token}
                download
              >
                Download config (.json)
              </Button>
            </div>
          </div>
        </div>

        {/* Step 3 — run */}
        <div className="flex items-start gap-4">
          <StepNum n={3} />
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-sm font-semibold text-slate-200">Double-click to install</p>
            <p className="text-xs text-slate-500">
              On the laptop, double-click <code className="text-slate-300">aiops-agent.exe</code>. It runs silently in the
              <strong className="text-slate-300"> system tray</strong> — right-click the tray icon for status, logs, or to
              pause/quit. It auto-starts on logon. The device appears below within ~30s.
            </p>
          </div>
        </div>

        {/* Advanced: CLI for RMM/Intune */}
        {cliCommand && (
          <details className="mt-5 border-t border-white/5 pt-4">
            <summary className="cursor-pointer text-xs font-semibold text-slate-400 hover:text-slate-200">
              Advanced: silent deploy via RMM / Intune (command line)
            </summary>
            <div className="mt-3">
              <CommandRow
                icon={<TerminalSquare className="h-4 w-4 text-slate-400" />}
                label="Install with arguments"
                cmd={cliCommand}
                copied={copied === "cli"}
                onCopy={() => copy(cliCommand, "cli")}
              />
            </div>
          </details>
        )}

        {tokens.length > 0 && (
          <div className="mt-5 border-t border-white/5 pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Outstanding tokens</p>
            <ul className="space-y-2">
              {tokens.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2"
                >
                  <div className="min-w-0">
                    <code className="font-mono text-xs text-slate-300">{t.tokenHint}</code>
                    <span className="ml-2 text-[11px] text-slate-500">
                      {t.useCount}/{t.maxUses} used · expires {new Date(t.expiresAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <TokenState state={t.state} />
                    {t.state === "ACTIVE" && (
                      <button
                        onClick={() => revoke(t.id)}
                        disabled={pending}
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-50"
                        title="Revoke this token"
                      >
                        <ShieldOff className="mr-1 inline h-3 w-3" />
                        Revoke
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-4 text-xs text-slate-500">
          Uninstall any time with <code className="text-slate-300">aiops-agent.exe --uninstall</code>. Treat an enrollment
          token like a password — anyone holding a valid one can add a device to this tenant.
        </p>
      </div>
    </Panel>
  );
}

// First-run state: no tokens yet, nothing to list.
function IssueOnly({ onIssue, pending }: { onIssue: () => void; pending: boolean }) {
  return (
    <Panel padded={false} className="mb-8">
      <PanelHeader title="Enroll a device" icon={Download} />
      <div className="p-6">
        <p className="mb-4 text-xs text-slate-500">
          Issue a short-lived enrollment token to add the first laptop to this tenant.
        </p>
        <Button onClick={onIssue} icon={KeyRound} disabled={pending}>
          {pending ? "Issuing…" : "Issue token"}
        </Button>
      </div>
    </Panel>
  );
}

function TokenState({ state }: { state: EnrollmentTokenView["state"] }) {
  const styles: Record<EnrollmentTokenView["state"], string> = {
    ACTIVE: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    REVOKED: "border-rose-500/20 bg-rose-500/10 text-rose-300",
    EXPIRED: "border-white/10 bg-white/5 text-slate-400",
    EXHAUSTED: "border-white/10 bg-white/5 text-slate-400",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${styles[state]}`}>
      {state}
    </span>
  );
}

function StepNum({ n }: { n: number }) {
  return (
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-slate-300">
      {n}
    </div>
  );
}

function CommandRow({
  icon,
  label,
  cmd,
  copied,
  onCopy,
}: {
  icon: React.ReactNode;
  label: string;
  cmd: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-400">
        {icon} {label}
      </div>
      <div className="flex items-stretch gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 font-mono text-xs text-slate-300">
          {cmd}
        </code>
        <button
          onClick={onCopy}
          className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 text-slate-300 transition-colors hover:bg-white/10"
          title="Copy"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

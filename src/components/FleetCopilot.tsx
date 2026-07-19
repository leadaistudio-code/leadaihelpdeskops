"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui";

type Message = { id: string; role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Which devices are at risk?",
  "Any hardware failures predicted?",
  "Top crashing apps this week",
  "What licences can we reclaim?",
];

function renderContent(text: string) {
  return text.split("\n").map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ));
}

export default function FleetCopilot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const send = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMessage: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput("");
    setIsTyping(true);
    try {
      const res = await fetch("/api/ai/fleet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      const reply =
        typeof data.reply === "string" && data.reply.trim()
          ? data.reply
          : "Sorry — I couldn't reach the fleet data just now.";
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: "I couldn't reach the copilot just now. Please try again." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Panel className="overflow-hidden">
      <PanelHeader title="Fleet Copilot" icon={Sparkles} />
      <div className="p-5">
        <div className="max-h-[280px] overflow-y-auto custom-scrollbar flex flex-col space-y-3 mb-4">
          {messages.length === 0 ? (
            <div className="text-sm text-slate-400">
              <p className="mb-3">Ask about the fleet — answers come from live telemetry, not guesses.</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] border border-white/10 text-slate-300 hover:bg-white/[0.08] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center mr-2 shrink-0 mt-0.5 bg-[#00d4a4]/10 text-[#00926f]">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#0a0a0a] text-white font-medium"
                      : "bg-white/[0.04] border border-white/10 text-slate-200"
                  }`}
                >
                  {renderContent(m.content)}
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-lg bg-[#00d4a4]/10 text-[#00926f] flex items-center justify-center mr-2 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 flex space-x-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="relative flex items-center"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the fleet…"
            className="w-full bg-black/20 border border-white/10 rounded-lg pl-4 pr-11 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00d4a4]/30 focus:border-[#00d4a4]/50 placeholder-slate-500 transition-colors"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 w-7 h-7 rounded-lg bg-[#0a0a0a] flex items-center justify-center text-white hover:bg-[#1c1c1e] disabled:opacity-50 transition-colors"
          >
            <Send className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </form>
      </div>
    </Panel>
  );
}

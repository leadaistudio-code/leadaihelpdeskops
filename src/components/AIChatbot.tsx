"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import Link from "next/link";
import { X, Send, Bot, Sparkles } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const GREETING =
  "Hi! I'm Now Assist, your virtual IT agent. Ask me to find a help article, check your ticket status or device health, or report an issue.";

// Render inline [text](/link) markdown as clickable links; everything else is
// plain text. The assistant is prompted to cite article titles as links.
function renderContent(text: string) {
  return text.split("\n").map((line, li) => {
    const parts: React.ReactNode[] = [];
    const re = /\[([^\]]+)\]\(([^)]+)\)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) parts.push(line.slice(last, m.index));
      const href = m[2];
      const label = m[1];
      parts.push(
        href.startsWith("/") ? (
          <Link key={`${li}-${m.index}`} href={href} className="text-[#00926f] font-semibold hover:underline">
            {label}
          </Link>
        ) : (
          <span key={`${li}-${m.index}`} className="text-[#00926f] font-semibold">{label}</span>
        )
      );
      last = m.index + m[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return (
      <Fragment key={li}>
        {li > 0 && <br />}
        {parts.length ? parts : line}
      </Fragment>
    );
  });
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ id: "greeting", role: "assistant", content: GREETING }]);
    }
  }, [isOpen, messages.length]);

  const send = async (text: string) => {
    const userMessage: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    const next = [...messages, userMessage];
    setMessages(next);
    setIsTyping(true);

    try {
      // The API requires the first message to be from the user, so drop the
      // leading assistant greeting before sending the history.
      const history = next
        .filter((_, i) => !(i === 0 && next[0].role === "assistant"))
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      const reply =
        typeof data.reply === "string" && data.reply.trim()
          ? data.reply
          : "Sorry — something went wrong reaching the assistant. Please try again.";
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: "I couldn't reach the assistant just now. Please try again in a moment." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isTyping) return;
    setInput("");
    void send(text);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open Now Assist"
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#0a0a0a] hover:bg-[#1c1c1e] rounded-full shadow-lg shadow-black/30 flex items-center justify-center text-white transition-colors z-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4a4]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff]"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[380px] h-[600px] glass-panel rounded-2xl border border-white/10 flex flex-col z-50 overflow-hidden shadow-2xl shadow-black/40 transition-all duration-300">
          <div className="bg-white/[0.02] p-4 flex justify-between items-center border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#00d4a4]/10 text-[#00926f]">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Now Assist</h3>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-5 overflow-y-auto custom-scrollbar flex flex-col space-y-4 bg-black/20">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0 mt-1 bg-[#00d4a4]/10 text-[#00926f]">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-[#0a0a0a] text-white font-medium rounded-br-none"
                    : "bg-white/[0.04] border border-white/10 text-slate-200 rounded-bl-none"
                }`}>
                  {renderContent(m.content)}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-[#00d4a4]/10 text-[#00926f] flex items-center justify-center mr-3 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl rounded-bl-none p-4 flex space-x-2 items-center w-20">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 bg-white/[0.02] border-t border-white/10">
            <div className="relative flex items-center">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full bg-black/20 border border-white/10 rounded-full pl-5 pr-12 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00d4a4]/30 focus:border-[#00d4a4]/50 placeholder-slate-500 transition-colors"
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={!input.trim() || isTyping}
                className="absolute right-2 w-8 h-8 rounded-full bg-[#0a0a0a] flex items-center justify-center text-white hover:bg-[#1c1c1e] disabled:opacity-50 disabled:hover:bg-[#0a0a0a] transition-colors"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

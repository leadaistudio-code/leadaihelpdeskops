"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Sparkles, FileText, CheckCircle2, Headset } from "lucide-react";

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isActionable?: boolean;
};

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLiveAgent, setIsLiveAgent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Intentional: show the typing indicator when the chat first opens.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTyping(true);
      setTimeout(() => {
        setMessages([{
          id: '1',
          role: 'assistant',
          content: 'Hi! I am Now Assist, your virtual IT agent. You can ask me to find knowledge articles, check ticket status, or report an issue.'
        }]);
        setIsTyping(false);
      }, 1000);
    }
  }, [isOpen]);

  const handleSimulatedResponse = (userText: string) => {
    const lowerText = userText.toLowerCase();
    
    setIsTyping(true);
    
    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I can help with that. Could you provide a bit more detail?"
      };

      if (lowerText.includes('password')) {
        botResponse.content = "It looks like you need help with your password. I found this knowledge article that might help:\n\n[How to reset your AD Password](/knowledge/1)\n\nDid this resolve your issue?";
        botResponse.isActionable = true;
      } else if (lowerText.includes('ticket') || lowerText.includes('status')) {
        botResponse.content = "You have 1 active ticket: INC0001024 - 'VPN Connection Failing'. It is currently IN PROGRESS and assigned to Jane Doe.";
      } else if (lowerText.includes('broken') || lowerText.includes('issue') || lowerText.includes('laptop')) {
        botResponse.content = "I'm sorry your device is having issues. I can create an incident ticket for you right now. Would you like me to do that?";
        botResponse.isActionable = true;
      } else if (lowerText === 'yes' && messages[messages.length - 1]?.isActionable) {
        botResponse.content = "Great! I have created Incident INC0001042 for you. An IT agent will reach out shortly.";
      } else if (lowerText === 'no' && messages[messages.length - 1]?.isActionable) {
        botResponse.content = "Okay, I've noted that. Is there anything else I can assist you with today?";
      } else if (lowerText.includes('agent') || lowerText.includes('human') || lowerText.includes('manager')) {
        botResponse.content = "I understand you'd like to speak with a human. Transferring you to the next available Live Agent now...";
        setIsLiveAgent(true);
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now().toString() + "1",
            role: 'assistant',
            content: "Hi, I'm Mike from IT Support. I see you need assistance. How can I help?"
          }]);
        }, 2500);
      }
      
      if (isLiveAgent) {
        botResponse.content = "I'm looking into this right now. Please give me one moment.";
      }

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    handleSimulatedResponse(userMessage.content);
  };

  return (
    <>
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-full shadow-[0_0_20px_rgba(124,58,237,0.4)] flex items-center justify-center text-white hover:scale-110 transition-transform z-50 group border border-white/20"
        >
          <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[380px] h-[600px] glass-panel rounded-3xl border border-white/10 flex flex-col z-50 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] transform transition-all duration-300">
          <div className="bg-slate-900/80 backdrop-blur-md p-4 flex justify-between items-center border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-lg ${isLiveAgent ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-white/20 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-br from-violet-500 to-indigo-600 border-white/20 shadow-[0_0_15px_rgba(139,92,246,0.5)]'}`}>
                {isLiveAgent ? <Headset className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm tracking-wide">{isLiveAgent ? 'Live Agent (Mike)' : 'Now Assist'}</h3>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 p-5 overflow-y-auto custom-scrollbar flex flex-col space-y-4 bg-black/20">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center mr-3 shrink-0 mt-1 ${isLiveAgent ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-indigo-500/20 border-indigo-500/30'}`}>
                    {isLiveAgent ? <Headset className={`w-4 h-4 ${isLiveAgent ? 'text-emerald-400' : 'text-indigo-400'}`} /> : <Bot className={`w-4 h-4 ${isLiveAgent ? 'text-emerald-400' : 'text-indigo-400'}`} />}
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-none shadow-lg' 
                    : 'glass-panel border border-white/10 text-slate-200 rounded-bl-none shadow-md'
                }`}>
                  {m.content.split('\n\n').map((paragraph, i) => {
                    // Check for links
                    if (paragraph.startsWith('[')) {
                      const text = paragraph.match(/\[(.*?)\]/)?.[1];
                      return (
                        <div key={i} className="mt-3 mb-1 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center space-x-3 cursor-pointer hover:bg-white/10 transition-colors">
                          <FileText className="w-4 h-4 text-sky-400" />
                          <span className="font-bold text-sky-400">{text}</span>
                        </div>
                      );
                    }
                    return <p key={i} className={i > 0 ? "mt-2" : ""}>{paragraph}</p>;
                  })}
                  
                  {m.isActionable && (
                    <div className="flex space-x-2 mt-4">
                      <button onClick={() => handleSimulatedResponse("yes")} className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 font-bold rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors flex items-center justify-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Yes</span>
                      </button>
                      <button onClick={() => handleSimulatedResponse("no")} className="flex-1 py-2 bg-rose-500/20 text-rose-400 font-bold rounded-lg border border-rose-500/30 hover:bg-rose-500/30 transition-colors flex items-center justify-center space-x-1">
                        <X className="w-4 h-4" />
                        <span>No</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mr-3 shrink-0">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="glass-panel border border-white/10 rounded-2xl rounded-bl-none p-4 flex space-x-2 items-center w-20">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 bg-slate-900/80 backdrop-blur-md border-t border-white/10">
            <div className="relative flex items-center">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..." 
                className="w-full bg-black/40 border border-white/10 rounded-full pl-5 pr-12 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent placeholder-slate-500"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isTyping}
                className="absolute right-2 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white hover:bg-indigo-400 disabled:opacity-50 disabled:hover:bg-indigo-500 transition-colors"
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

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, BrainCircuit, RefreshCw, Copy, Check } from 'lucide-react';

interface AICompanionProps {
  user: {
    userId: string;
    name: string;
    role: 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'TENANT';
  };
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  isDraft?: boolean;
  draftType?: string;
}

export default function AICompanion({ user }: AICompanionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: `Hello ${user.name}! I am your MagicTick AI assistant. Ask me questions like:
- "Which rooms are vacant?"
- "Who has pending rent?"
- "Predict next month's occupancy & revenue"
- "Recommend rent pricing adjustment"
- "Generate NOC for room checkout"`,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const presets = [
    { label: 'Vacant Rooms', query: 'Which rooms are vacant?' },
    { label: 'Pending Rent', query: 'Show pending payments' },
    { label: 'Predict Rev', query: 'Predict revenue and occupancy' },
    { label: 'NOC Generator', query: 'Generate NOC draft' },
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    setMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend }),
      });
      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: data.reply,
          isDraft: data.isDraft,
          draftType: data.draftType,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Oops! I encountered an error checking our servers. Please make sure the DB is seeded and running.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <>
      {/* Floating Sparkle Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-2xl z-50 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 glow-primary border border-white/20"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
        </button>
      )}

      {/* Slide out panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-[420px] max-w-full bg-white border-l border-slate-200 z-50 flex flex-col shadow-2xl animate-fade-in font-sans text-xs font-semibold text-slate-800">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg border border-blue-100">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">MagicTick AI</h3>
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block mt-0.5">
                  Operational Copilot
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Preset queries */}
          <div className="p-3 border-b border-slate-200 flex gap-1.5 overflow-x-auto bg-slate-50/50">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handleSend(preset.query)}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-800 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-all shrink-0 bg-white"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Chat message area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                
                <div
                  className={`p-3.5 rounded-2xl max-w-[80%] shadow-sm border border-slate-100 relative ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  
                  {msg.sender === 'ai' && (msg.isDraft || msg.text.startsWith('**NO OBJECTION') || msg.text.startsWith('Subject:')) && (
                    <button
                      onClick={() => copyToClipboard(msg.text, idx)}
                      className="absolute bottom-2 right-2 p-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                      title="Copy Draft"
                    >
                      {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-0.5 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5 shadow-sm animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 text-slate-500">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>MagicTick AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input text box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-3 border-t border-slate-200 bg-white flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about rooms, dues, or write reminders..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-100 disabled:text-slate-400 text-white p-2.5 rounded-xl active:scale-95 transition-all shadow-sm flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

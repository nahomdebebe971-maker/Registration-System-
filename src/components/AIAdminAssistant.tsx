import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, Loader2, Bot, ArrowRight, User } from 'lucide-react';
import { Registration, GradeSetting } from '../types';

interface AIAdminAssistantProps {
  registrations: Registration[];
  gradeSettings: GradeSetting[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAdminAssistant({ registrations, gradeSettings }: AIAdminAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am your **Registrar AI Assistant** for Chercher Secondary School. I have access to the live school registrations, grade metrics, and class schedules. Ask me to:\n- **Analyze** gender balance across Grade 10/11/12 classes\n- **Identify** top academic performers based on averages\n- **Generate** a summary of payment methods or pending accounts\n- **Compute** student statistics and metrics"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    // Build context payload to feed to Gemini
    const simpleRegistrations = registrations.map(r => ({
      name: r.full_name,
      g: r.promoted_grade,
      s: r.sex,
      avg: r.average,
      status: r.status,
      cls: r.class_assignment,
      pay: r.payment_method
    }));

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: userMsg,
          context: {
            registrationsCount: registrations.length,
            gradeSettings: gradeSettings,
            classSummaries: simpleRegistrations.slice(0, 150), // limits size for token budget
            analyticsSummary: {
              approved: registrations.filter(r => r.status === 'Approved').length,
              pending: registrations.filter(r => r.status === 'Pending Review').length,
              rejected: registrations.filter(r => r.status === 'Rejected').length,
              totalMales: registrations.filter(r => r.sex === 'Male').length,
              totalFemales: registrations.filter(r => r.sex === 'Female').length,
              averages: {
                g10: Math.round(registrations.filter(r => r.promoted_grade === 10).reduce((acc, current) => acc + current.average, 0) / (registrations.filter(r => r.promoted_grade === 10).length || 1)),
                g11: Math.round(registrations.filter(r => r.promoted_grade === 11).reduce((acc, current) => acc + current.average, 0) / (registrations.filter(r => r.promoted_grade === 11).length || 1)),
                g12: Math.round(registrations.filter(r => r.promoted_grade === 12).reduce((acc, current) => acc + current.average, 0) / (registrations.filter(r => r.promoted_grade === 12).length || 1))
              }
            }
          }
        })
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `⚠️ Error from assistant: ${data.error || 'Failed to complete query processing. Make sure Gemini API Key is configured in the Secrets Panel.'}` 
        }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ Network error: Could not reach the AI gateway. Error details: ${err.message}` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (promptText: string) => {
    setInput(promptText);
  };

  return (
    <div className="flex flex-col h-[600px] rounded-2xl border border-slate-150 bg-white overflow-hidden shadow-xs">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-yellow-400 fill-yellow-400 animate-pulse" />
          <div>
            <h3 className="font-semibold text-sm">Registrar AI Copilot</h3>
            <p className="text-[10px] text-slate-300">Powered by Gemini 3.5 Flash</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-mono tracking-wide">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>ONLINE DB READY</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 relative">
        <AnimatePresence>
          {messages.map((message, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-sm border ${
                message.role === 'user' 
                  ? 'bg-indigo-50 border-indigo-100 text-indigo-750' 
                  : 'bg-white border-slate-100 text-slate-750'
              }`}>
                {message.role === 'user' ? <User size={14} /> : <Bot size={14} className="text-indigo-650" />}
              </div>

              <div className={`rounded-2xl px-4 py-3 text-sm shadow-xs ${
                message.role === 'user'
                  ? 'bg-indigo-650 text-white rounded-tr-none'
                  : 'bg-white text-slate-800 border border-slate-150 rounded-tl-none leading-relaxed'
              }`}>
                {/* Basic Markdown Rendering */}
                <div className="space-y-1 text-xs sm:text-sm">
                  {message.content.split('\n').map((line, lIdx) => {
                    // Check for lists
                    let contentNode: React.ReactNode = line;
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                      const trimmed = line.substring(2);
                      contentNode = <li className="ml-2 list-disc">{renderMarkdownHelpers(trimmed)}</li>;
                    } else if (line.match(/^\d+\.\s/)) {
                      const trimmed = line.replace(/^\d+\.\s/, '');
                      contentNode = <li className="ml-3 list-decimal">{renderMarkdownHelpers(trimmed)}</li>;
                    } else {
                      contentNode = <p>{renderMarkdownHelpers(line)}</p>;
                    }

                    return <div key={lIdx}>{contentNode}</div>;
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-100 text-slate-750">
              <Bot size={14} className="text-indigo-650" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-white border border-slate-150 rounded-tl-none shadow-xs text-slate-550 text-xs flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-indigo-650" />
              <span>Analyzing registrar database & drafting response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length === 1 && (
        <div className="bg-slate-50 border-t border-slate-100 p-3 flex flex-wrap gap-2">
          {[
            "Give me a gender balance analysis",
            "What is the average grade of candidates?",
            "Analyze payment methods breakdown"
          ].map((promptText, i) => (
            <button
              id={`ai-suggestion-btn-${i}`}
              key={i}
              type="button"
              onClick={() => handleSuggestion(promptText)}
              className="px-2.5 py-1 text-[11px] font-sans rounded-full bg-white border border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-850 hover:border-slate-300 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>{promptText}</span>
              <ArrowRight size={10} />
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-150 flex gap-2 bg-white">
        <input
          id="ai-assistant-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Registrar AI (e.g., 'Draft statistics summary'...)"
          className="flex-1 bg-slate-50 border border-slate-200 text-xs sm:text-sm rounded-xl px-3 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 text-slate-800 text-ellipsis"
          disabled={loading}
        />
        <button
          id="ai-assistant-submit-btn"
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center justify-center h-10 w-10 cursor-pointer bg-slate-950 text-white rounded-xl shadow-sm hover:bg-slate-800 disabled:opacity-40 transition-all"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}

// Simple Markdown rendering helper to convert bold entries **text** inside TSX safely
function renderMarkdownHelpers(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-slate-950">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

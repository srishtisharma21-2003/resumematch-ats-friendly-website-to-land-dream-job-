'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

interface ChatPanelProps {
  analysisId: string;
  resumeText?: string;
  jobDescription?: string;
  missingKeywords?: any[];
  resumeData?: any;
  onApplySuggestion?: (section: string, text: string) => void;
}

export default function ChatPanel({ analysisId, resumeText, jobDescription, missingKeywords, resumeData, onApplySuggestion }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Hi, I'm your AI resume coach. I can add metrics, tune ATS keywords, rewrite sections, and sanity-check your resume against the job description.", 
      time: new Date().toLocaleTimeString() 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const data = await apiClient<{ messages?: Array<{ role: 'user' | 'assistant'; content: string; created_at?: string }> }>(
          `/api/chat?analysisId=${encodeURIComponent(analysisId)}`,
          { timeoutMs: 15000 },
        );
        if (!cancelled && data.messages?.length) {
          setMessages(
            data.messages.map((message) => ({
              role: message.role,
              content: message.content,
              time: message.created_at ? new Date(message.created_at).toLocaleTimeString() : '',
            })),
          );
        }
      } catch {
        // Fresh chats are fine; the POST path still persists new messages.
      }
    }

    if (analysisId) loadHistory();
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg: Message = {
      role: 'user',
      content: input.trim(),
      time: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await apiClient<{ reply?: string }>('/api/chat', {
        method: 'POST',
        body: {
          analysisId,
          resumeText,
          resumeData,
          jobDescription,
          missingKeywords,
          message: userMsg.content,
        },
        timeoutMs: 45000,
      });
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.reply || "I'm having trouble understanding. Please rephrase.",
        time: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err instanceof Error ? `⚠️ ${err.message}` : "⚠️ Service temporarily unavailable. Please try again.",
        time: new Date().toLocaleTimeString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Add metrics to my work experience",
    "Optimize my summary for ATS",
    "Suggest missing keywords for my resume",
    "Fix grammar in my resume"
  ];

  const inferSection = (text: string) => {
    const value = text.toLowerCase();
    if (value.includes('skill')) return 'skills';
    if (value.includes('experience') || value.includes('achievement')) return 'experience';
    if (value.includes('project')) return 'projects';
    if (value.includes('education') || value.includes('credential')) return 'education';
    return 'summary';
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="shrink-0 border-b bg-white p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-white">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <span className="font-semibold text-slate-950">AI Resume Coach</span>
            <p className="text-xs text-slate-500">Context-aware resume editing</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-lg px-4 py-2 ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              {m.role === 'assistant' && onApplySuggestion && i > 0 && (
                <button
                  onClick={() => onApplySuggestion(inferSection(m.content), m.content)}
                  className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-[11px] font-medium text-emerald-700"
                >
                  <Sparkles className="h-3 w-3" />
                  Apply
                </button>
              )}
              <p className="text-[10px] opacity-70 mt-1 text-right">{m.time}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 border-t bg-white p-3">
        <div className="flex flex-wrap gap-2 mb-3">
          {quickPrompts.map(prompt => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="rounded-md bg-slate-100 px-3 py-1 text-xs transition hover:bg-slate-200"
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask for help..."
            className="min-w-0 flex-1 rounded-md border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={sendMessage} disabled={loading} className="rounded-md bg-blue-600 p-2 text-white disabled:bg-gray-300">
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] text-center text-gray-400 mt-2">
          AI responses are for guidance only. Verify important information.
        </p>
      </div>
    </div>
  );
}

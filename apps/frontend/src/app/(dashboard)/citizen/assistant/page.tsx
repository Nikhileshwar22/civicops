'use client';

import { useState, useRef, useEffect } from 'react';
import { apiPost } from '@/lib/api-client';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  suggestions?: string[];
}

export default function CitizenAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: "Hi! I'm the CivicOps AI Assistant. I can help you report civic issues, track your complaints, and answer questions. How can I help you today?",
      suggestions: [
        'How do I report a civic issue?',
        'What is the status of my complaint?',
        'What categories can I report?',
        'How long does resolution take?',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiPost<{ reply: string; suggestions?: string[] }>('/ai/assistant', { message: text });
      setMessages((prev) => [...prev, { role: 'assistant', text: res.reply, suggestions: res.suggestions }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Sorry, I had trouble processing that. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-sm text-gray-400 mt-0.5">Ask questions about complaints, procedures, and get help</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col h-[560px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line ${
                    m.role === 'user'
                      ? 'bg-[#7c3aed] text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
                {/* Suggestion chips */}
                {m.role === 'assistant' && m.suggestions && m.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {m.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-xs bg-purple-50 text-[#7c3aed] px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="border-t border-gray-100 p-4 flex items-center gap-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 flex items-center justify-center bg-[#7c3aed] text-white rounded-full hover:bg-[#6d28d9] disabled:opacity-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

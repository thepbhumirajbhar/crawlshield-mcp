'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Cpu,
  Database,
  Server,
  Terminal,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
} from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({ waiting: 0, active: 0, completed: 0, failed: 0 });
  const [urlInput, setUrlInput] = useState('https://en.wikipedia.org/wiki/Large_language_model');
  const [depthInput, setDepthInput] = useState(2);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: '👋 Hello! I am CrawlShield AI. Ask me anything about the crawled webpage content!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatUrlContext, setChatUrlContext] = useState('https://en.wikipedia.org/wiki/Large_language_model');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats({
          waiting: data.waiting || 0,
          active: data.active || 0,
          completed: data.completed || 0,
          failed: data.failed || 0,
        });
      }
    } catch (e) {
      console.error('Failed to poll queue stats', e);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleLaunchCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;

    setIsLoading(true);
    setStatusMessage('');
    setChatUrlContext(urlInput); // Set active context URL

    try {
      const res = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput, maxDepth: depthInput }),
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage(`✅ ${data.message}`);
        fetchStats();
      } else {
        setStatusMessage(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      setStatusMessage(`❌ Error launching job: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    const activeUrl = chatUrlContext || urlInput || 'https://en.wikipedia.org/wiki/Large_language_model';
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages((prev) => [...prev, { sender: 'user', text: userText, timestamp: now }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText, url: activeUrl }),
      });
      const data = await res.json();

      const botText = data.success ? data.answer : `❌ Error: ${data.error}`;
      setChatMessages((prev) => [...prev, { sender: 'bot', text: botText, timestamp: now }]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'bot', text: `❌ Network Error: ${err.message}`, timestamp: now },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/20 p-2 rounded-xl border border-blue-500/30 text-blue-400">
              <Cpu className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                CrawlShield MCP Engine
              </h1>
              <p className="text-sm text-slate-400">
                Distributed AI-Native Web Crawler & In-App RAG Chatbot Suite
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
            MCP Protocol Active (Stdio / Web)
          </span>
        </div>
      </header>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-medium">Active Workers</span>
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-4xl font-extrabold text-emerald-400 mt-3 font-mono">{stats.active}</p>
          <p className="text-xs text-slate-500 mt-2">Concurrent BullMQ threads</p>
        </div>

        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-medium">Queue Depth</span>
            <Database className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-4xl font-extrabold text-amber-400 mt-3 font-mono">{stats.waiting}</p>
          <p className="text-xs text-slate-500 mt-2">Pending URLs in Redis</p>
        </div>

        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-medium">Pages Crawled</span>
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-4xl font-extrabold text-blue-400 mt-3 font-mono">{stats.completed}</p>
          <p className="text-xs text-slate-500 mt-2">Successfully processed</p>
        </div>

        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-medium">Failed / Rate-Limited</span>
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-4xl font-extrabold text-rose-400 mt-3 font-mono">{stats.failed}</p>
          <p className="text-xs text-slate-500 mt-2">Moved to Dead-Letter Queue</p>
        </div>
      </div>

      {/* Main Grid: Launcher + In-App AI Chatbot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Launcher Form */}
        <div className="lg:col-span-1 bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Terminal className="w-6 h-6 text-blue-400" />
              <h2 className="text-lg font-bold">Launch Crawl Job</h2>
            </div>

            <form onSubmit={handleLaunchCrawl} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Target Website URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Recursion Depth (1 - 5)
                </label>
                <select
                  value={depthInput}
                  onChange={(e) => setDepthInput(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-500 transition"
                >
                  <option value={1}>1 (Single Page Only)</option>
                  <option value={2}>2 (Direct Links)</option>
                  <option value={3}>3 (Deep Crawl)</option>
                  <option value={4}>4 (Sub-domains)</option>
                  <option value={5}>5 (Full Domain Tree)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Rendering Mode
                </label>
                <input
                  disabled
                  value="Hybrid (Axios ⚡ + Playwright)"
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-3 text-slate-400 text-sm font-mono cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-semibold py-3 px-6 rounded-xl text-white transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Enqueueing Job...
                  </>
                ) : (
                  '🚀 Launch Crawl Job'
                )}
              </button>
            </form>

            {statusMessage && (
              <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-slate-200">
                {statusMessage}
              </div>
            )}
          </div>

          <div className="mt-8 p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs font-mono text-slate-400">
            <p className="font-bold text-slate-300 mb-1">⚡ CrawlShield Info:</p>
            <p>Sub-1ms Visited Check (Redis Bloom Filters) & Per-Domain Politeness Limiter Active.</p>
          </div>
        </div>

        {/* In-App AI Chatbot Widget */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-[560px]">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600/20 p-2 rounded-xl border border-indigo-500/30 text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  CrawlShield AI Chatbot
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono uppercase">
                    RAG Active
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-mono truncate max-w-[320px]">
                  Target Context: {chatUrlContext || urlInput}
                </p>
              </div>
            </div>

            {chatUrlContext && (
              <button
                onClick={() => setChatUrlContext('')}
                className="text-xs text-slate-400 hover:text-slate-200 font-mono underline"
              >
                Clear URL Context
              </button>
            )}
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-sm">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 p-2 rounded-xl h-fit">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  <span className="text-[10px] opacity-60 block text-right mt-2 font-mono">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="bg-blue-600/20 border border-blue-500/30 text-blue-400 p-2 rounded-xl h-fit">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isChatLoading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 p-2 rounded-xl">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-400">
                  CrawlShield RAG Engine is analyzing web context...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-800 flex gap-3">
            <input
              type="text"
              placeholder="Ask a question about the crawled webpage..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 font-sans transition"
            />
            <button
              type="submit"
              disabled={isChatLoading || !chatInput.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl flex items-center justify-center transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Footer System Specs */}
      <footer className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 font-mono gap-4">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-400" />
          <span>CrawlShield Distributed Systems & MCP Protocol Architecture</span>
        </div>
        <div className="flex items-center gap-6">
          <span>Redis BullMQ Queues</span>
          <span>Bloom Filters</span>
          <span>Playwright Hybrid</span>
          <span>Gemini AI RAG</span>
        </div>
      </footer>
    </main>
  );
}

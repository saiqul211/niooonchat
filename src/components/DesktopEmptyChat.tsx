import React, { useState } from 'react';
import { MessageSquare, Search, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { triggerHaptic } from '../lib/native';

interface DesktopEmptyChatProps {
  onNavigate: (route: string) => void;
  onDirectChat: (username: string) => void;
}

export const DesktopEmptyChat: React.FC<DesktopEmptyChatProps> = ({ onNavigate, onDirectChat }) => {
  const [quickUsername, setQuickUsername] = useState('');

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickUsername.trim().toLowerCase().replace(/^@+/, '');
    if (clean) {
      triggerHaptic('medium');
      onDirectChat(clean);
      setQuickUsername('');
    }
  };

  return (
    <div className="flex-1 h-full bg-[#0a0a0a] flex flex-col items-center justify-center p-8 text-center select-none animate-fadeIn">
      <div className="max-w-md w-full flex flex-col items-center">
        {/* Emblem */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white shadow-2xl shadow-black/80">
            <MessageSquare className="w-10 h-10 text-neutral-300 stroke-[1.8]" />
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 p-1 rounded-full">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white tracking-tight mb-2">
          Niooon Chat Desktop
        </h3>
        <p className="text-xs text-neutral-400 max-w-sm mb-6 leading-relaxed">
          Select any conversation from the left sidebar to start messaging, or enter an exact username below to open a direct chat.
        </p>

        {/* Quick Direct Username Search */}
        <form onSubmit={handleStartChat} className="w-full mb-6">
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={quickUsername}
              onChange={(e) => setQuickUsername(e.target.value)}
              placeholder="Enter exact @username (e.g. alex)..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 pl-10 pr-24 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition-colors shadow-inner"
            />
            <button
              type="submit"
              disabled={!quickUsername.trim()}
              className="absolute right-1.5 py-1.5 px-3.5 rounded-lg bg-neutral-100 hover:bg-white text-black font-semibold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 shadow-sm"
            >
              <span>Chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Features badges */}
        <div className="grid grid-cols-2 gap-3 w-full text-left">
          <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-neutral-200">Zero Email Exposure</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">Direct chat by private username only</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-neutral-200">Instant Realtime</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">Live seen statuses & zero message lag</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

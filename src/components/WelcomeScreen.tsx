import React from 'react';
import { MessageSquare, Shield, Zap, ArrowRight, UserPlus, LogIn, Compass, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../lib/native';

interface WelcomeScreenProps {
  onNavigate: (route: string) => void;
  sessionUser?: any;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate, sessionUser }) => {
  const handleNav = (route: string) => {
    triggerHaptic('light');
    onNavigate(route);
  };

  return (
    <div className="w-full h-full min-h-[100dvh] flex flex-col justify-between py-8 px-5 safe-top safe-bottom bg-black text-neutral-100 animate-fadeIn">
      {/* Top Branding Section */}
      <div className="flex flex-col items-center text-center mt-4">
        {/* App Emblem / Logo */}
        <div className="relative mb-6 group">
          <div className="w-24 h-24 rounded-[28px] bg-gradient-to-b from-neutral-800 to-neutral-950 border border-neutral-700/70 flex items-center justify-center shadow-2xl shadow-black">
            <MessageSquare className="w-12 h-12 text-white stroke-[1.8]" />
          </div>
          <div className="absolute -bottom-2 -right-1.5 bg-neutral-900 border border-neutral-700 text-[10px] font-bold text-emerald-400 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Sync</span>
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2.5">
          Niooon Chat
        </h1>
        <p className="text-xs text-neutral-400 max-w-[280px] leading-relaxed">
          High-speed realtime direct messaging platform — connect safely and instantly with friends.
        </p>
      </div>

      {/* Feature Highlights Grid */}
      <div className="my-auto py-6 space-y-3 max-w-sm mx-auto w-full">
        <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 text-white">
            <Zap className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div className="text-left">
            <h3 className="text-xs font-semibold text-neutral-200">Instant Realtime Messaging</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">Direct message delivery and read receipts with zero delay</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 text-white">
            <Shield className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div className="text-left">
            <h3 className="text-xs font-semibold text-neutral-200">Secure & Private Profiles</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">Unique usernames and encrypted database protection</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 text-white">
            <Sparkles className="w-4.5 h-4.5 text-blue-400" />
          </div>
          <div className="text-left">
            <h3 className="text-xs font-semibold text-neutral-200">Android & Web Sync</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">Seamless notifications and message access on all devices</p>
          </div>
        </div>
      </div>

      {/* Action Buttons / Navigation Flow */}
      <div className="space-y-3 max-w-sm mx-auto w-full pb-2">
        {sessionUser ? (
          <button
            onClick={() => handleNav('home')}
            className="w-full py-4 px-4 bg-neutral-100 hover:bg-white text-black font-bold text-xs rounded-2xl transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Enter Your Chats ({sessionUser.user_metadata?.full_name || 'Home'})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <>
            {/* Login Primary CTA */}
            <button
              onClick={() => handleNav('login')}
              className="w-full py-4 px-4 bg-neutral-100 hover:bg-white text-black font-bold text-xs rounded-2xl transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>

            {/* Signup Secondary CTA */}
            <button
              onClick={() => handleNav('signup')}
              className="w-full py-3.5 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-100 font-semibold text-xs rounded-2xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-neutral-400" />
              <span>Create New Account</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

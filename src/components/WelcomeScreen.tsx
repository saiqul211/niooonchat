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
    <div className="w-full max-w-sm mx-auto flex flex-col justify-between min-h-full py-4 px-1 animate-fadeIn text-neutral-100">
      {/* Top Branding Section */}
      <div className="flex flex-col items-center text-center mt-2">
        {/* App Emblem / Logo */}
        <div className="relative mb-5 group">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-b from-neutral-800 to-neutral-950 border border-neutral-700/70 flex items-center justify-center shadow-2xl shadow-black/80">
            <MessageSquare className="w-10 h-10 text-white stroke-[1.8]" />
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 bg-neutral-900 border border-neutral-700 text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live</span>
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">
          Niooon Chat
        </h1>
        <p className="text-xs text-neutral-400 max-w-[280px] leading-relaxed">
          দ্রুতগতির রিয়েলটাইম ডিরেক্ট মেসেজিং প্ল্যাটফর্ম — যেখানে নিরাপদ ও সহজে যুক্ত হন বন্ধুদের সাথে।
        </p>
      </div>

      {/* Feature Highlights Grid */}
      <div className="my-6 space-y-2.5">
        <div className="p-3 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 flex items-center gap-3.5 hover:border-neutral-700 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 text-white">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-left">
            <h3 className="text-xs font-semibold text-neutral-200">তাত্ক্ষণিক রিয়েলটাইম চ্যাট</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">সুপাবেসের মাধ্যমে সরাসরি ও দ্রুত বার্তা আদান-প্রদান</p>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 flex items-center gap-3.5 hover:border-neutral-700 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 text-white">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-left">
            <h3 className="text-xs font-semibold text-neutral-200">নিরাপদ ও প্রাইভেট</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">এনক্রিপ্টেড ও সুরক্ষিত পার্সোনাল প্রোফাইল ব্যবস্থা</p>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 flex items-center gap-3.5 hover:border-neutral-700 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 text-white">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-left">
            <h3 className="text-xs font-semibold text-neutral-200">অ্যান্ড্রয়েড ও ওয়েব ইন্টিগ্রেশন</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">নেটিভ অ্যাপ এবং ওয়েব ব্রাউজার উভয়েই নিরবচ্ছিন্ন এক্সেস</p>
          </div>
        </div>
      </div>

      {/* Action Buttons / Navigation Flow */}
      <div className="space-y-2.5 pb-2">
        {sessionUser ? (
          <button
            onClick={() => handleNav('home')}
            className="w-full py-3.5 px-4 bg-neutral-100 hover:bg-white text-black font-bold text-xs rounded-2xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>আপনার চ্যাটে প্রবেশ করুন ({sessionUser.user_metadata?.full_name || 'Home'})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <>
            {/* Login Primary CTA */}
            <button
              onClick={() => handleNav('login')}
              className="w-full py-3.5 px-4 bg-neutral-100 hover:bg-white text-black font-bold text-xs rounded-2xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>লগইন করুন (Login)</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>

            {/* Signup Secondary CTA */}
            <button
              onClick={() => handleNav('signup')}
              className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-100 font-semibold text-xs rounded-2xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-neutral-400" />
              <span>নতুন অ্যাকাউন্ট তৈরি করুন (Sign Up)</span>
            </button>

            {/* Guest / Explore Link */}
            <button
              onClick={() => handleNav('home')}
              className="w-full py-2 text-center text-xs text-neutral-400 hover:text-neutral-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>গেস্ট হিসেবে এক্সপ্লোর করুন</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, AlertCircle, Loader2, Github } from 'lucide-react';

interface LoginScreenProps {
  onSuccess: () => void;
  onNavigate: (route: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess, onNavigate }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMsg('ইমেইল/ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      let emailToUse = identifier.trim();

      // If user provided a username instead of an email
      if (!emailToUse.includes('@')) {
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', emailToUse.toLowerCase())
          .maybeSingle();

        if (profileErr || !profileData) {
          throw new Error('এই ইউজারনেম দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি');
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'লগইন ব্যর্থ হয়েছে। সঠিক তথ্য প্রদান করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'GitHub লগইন ব্যর্থ হয়েছে');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col justify-center py-4 px-1 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-5">
        <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-2xl mx-auto flex items-center justify-center mb-2.5 shadow-lg">
          <LogIn className="w-6 h-6 text-neutral-100" />
        </div>
        <h2 className="text-xl font-bold text-neutral-100 tracking-tight">স্বাগতম ফিরে আসার জন্য</h2>
        <p className="text-xs text-neutral-400 mt-1">আপনার অ্যাকাউন্টে লগইন করে চ্যাট চালিয়ে যান</p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* GitHub 1-Click Login Button */}
      <button
        type="button"
        onClick={handleGitHubLogin}
        disabled={loading}
        className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-white font-medium text-xs rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 mb-3.5 cursor-pointer"
      >
        <Github className="w-4 h-4" />
        <span>GitHub দিয়ে চালিয়ে যান</span>
      </button>

      <div className="flex items-center gap-2 mb-3.5">
        <div className="flex-1 h-px bg-neutral-800"></div>
        <span className="text-[10px] text-neutral-500 uppercase tracking-wider">অথবা পাসওয়ার্ড দিয়ে</span>
        <div className="flex-1 h-px bg-neutral-800"></div>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-3.5">
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            ইমেইল অথবা ইউজারনেম
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="name@example.com অথবা username"
              className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            পাসওয়ার্ড
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-1 py-2.5 px-4 bg-neutral-100 hover:bg-white text-black font-semibold text-xs rounded-xl transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>লগইন হচ্ছে...</span>
            </>
          ) : (
            <span>লগইন করুন</span>
          )}
        </button>
      </form>

      {/* Switch to Signup */}
      <div className="mt-5 text-center border-t border-neutral-900 pt-4">
        <p className="text-xs text-neutral-400">
          নতুন অ্যাকাউন্ট তৈরি করতে চান?{' '}
          <button
            type="button"
            onClick={() => onNavigate('signup')}
            className="text-neutral-100 font-semibold hover:underline cursor-pointer"
          >
            সাইন আপ করুন
          </button>
        </p>
      </div>
    </div>
  );
};

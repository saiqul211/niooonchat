import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Mail, Lock, UserPlus, AlertCircle, Loader2, CheckCircle2, Github } from 'lucide-react';

interface SignupScreenProps {
  onSuccess: () => void;
  onNavigate: (route: string) => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({ onSuccess, onNavigate }) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Form Validations
    if (!fullName.trim() || !username.trim() || !email.trim() || !password) {
      setErrorMsg('সবগুলো তথ্য পূরণ করা বাধ্যতামূলক');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      setErrorMsg('ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে (শুধু a-z, 0-9, _ ব্যবহার করুন)');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না');
      return;
    }

    setLoading(true);

    try {
      // 1. Check if username is already taken in profiles table
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (existingUser) {
        throw new Error('এই ইউজারনেমটি ইতিমধ্যে ব্যবহার করা হয়েছে। অন্য একটি নির্বাচন করুন।');
      }

      // 2. Sign up user in Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            username: cleanUsername,
          },
        },
      });

      if (authErr) throw authErr;

      if (authData.user) {
        // 3. Upsert profile in Supabase profiles table
        const { error: profileErr } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          full_name: fullName.trim(),
          username: cleanUsername,
          created_at: new Date().toISOString(),
        });

        if (profileErr) {
          console.warn('Profile sync warning:', profileErr.message);
        }

        setSuccessMsg('অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!');
        setTimeout(() => {
          onSuccess();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'সাইন আপ ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSignup = async () => {
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
      setErrorMsg(err.message || 'GitHub সাইন আপ ব্যর্থ হয়েছে');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col justify-center py-3 px-1 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-2xl mx-auto flex items-center justify-center mb-2 shadow-lg">
          <UserPlus className="w-6 h-6 text-neutral-100" />
        </div>
        <h2 className="text-xl font-bold text-neutral-100 tracking-tight">নতুন অ্যাকাউন্ট তৈরি করুন</h2>
        <p className="text-xs text-neutral-400 mt-0.5">Niooon Chat এ যোগ দিতে প্রয়োজনীয় তথ্য দিন</p>
      </div>

      {errorMsg && (
        <div className="mb-3 p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* GitHub 1-Click Signup Button */}
      <button
        type="button"
        onClick={handleGitHubSignup}
        disabled={loading}
        className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-white font-medium text-xs rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 mb-3 cursor-pointer"
      >
        <Github className="w-4 h-4" />
        <span>GitHub দিয়ে দ্রুত সাইন আপ</span>
      </button>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-px bg-neutral-800"></div>
        <span className="text-[10px] text-neutral-500 uppercase tracking-wider">অথবা ফর্ম পূরণ করুন</span>
        <div className="flex-1 h-px bg-neutral-800"></div>
      </div>

      {/* Form */}
      <form onSubmit={handleSignup} className="space-y-2.5">
        <div>
          <label className="block text-[11px] font-medium text-neutral-300 mb-0.5">
            ফুল নেম (Full Name)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
              <User className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Raihan Islam"
              className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl py-2 pl-9 pr-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-neutral-300 mb-0.5">
            ইউজারনেম (Username)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
              <span className="text-xs font-bold text-neutral-500">@</span>
            </div>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. raihan_01"
              className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl py-2 pl-9 pr-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-neutral-300 mb-0.5">
            ইমেইল (Email)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl py-2 pl-9 pr-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-neutral-300 mb-0.5">
            পাসওয়ার্ড (Password)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="কমপক্ষে ৬ অক্ষর"
              className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl py-2 pl-9 pr-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-neutral-300 mb-0.5">
            কনফার্ম পাসওয়ার্ড
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="পাসওয়ার্ড পুনরাবৃত্তি করুন"
              className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl py-2 pl-9 pr-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2.5 px-4 bg-neutral-100 hover:bg-white text-black font-semibold text-xs rounded-xl transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>অ্যাকাউন্ট তৈরি হচ্ছে...</span>
            </>
          ) : (
            <span>সাইন আপ সম্পন্ন করুন</span>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-4 text-center border-t border-neutral-900 pt-3">
        <p className="text-xs text-neutral-400">
          ইতিমধ্যে অ্যাকাউন্ট রয়েছে?{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-neutral-100 font-semibold hover:underline cursor-pointer"
          >
            লগইন করুন
          </button>
        </p>
      </div>
    </div>
  );
};

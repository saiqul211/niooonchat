import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, AlertCircle, Loader2, Github, ArrowLeft } from 'lucide-react';
import { triggerHaptic } from '../lib/native';

interface LoginScreenProps {
  onSuccess: () => void;
  onNavigate: (route: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess, onNavigate }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleBackToWelcome = () => {
    triggerHaptic('light');
    onNavigate('welcome');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMsg('Please enter your email/username and password.');
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
          throw new Error('No account found with this username.');
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
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
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
      setErrorMsg(err.message || 'GitHub login failed.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-full flex-1 flex flex-col justify-between py-6 px-5 safe-top safe-bottom bg-black text-neutral-100 animate-fadeIn">
      {/* Top Header / Back to Welcome */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={handleBackToWelcome}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white py-2 px-3 rounded-xl bg-neutral-900 border border-neutral-800 transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Welcome</span>
        </button>
        <span className="text-[11px] text-neutral-500 font-mono">#login</span>
      </div>

      <div className="my-auto py-4 max-w-sm mx-auto w-full">
        {/* Emblem & Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-b from-neutral-800 to-neutral-950 border border-neutral-700/80 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-xl">
            <LogIn className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
          <p className="text-xs text-neutral-400 mt-1">Log in to your account to continue chatting</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/50 border border-red-900/60 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* GitHub 1-Click Login Button */}
        <button
          type="button"
          onClick={handleGitHubLogin}
          disabled={loading}
          className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-white font-semibold text-xs rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2.5 mb-4 cursor-pointer"
        >
          <Github className="w-4 h-4" />
          <span>Continue with GitHub</span>
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex-1 h-px bg-neutral-800"></div>
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider">or with password</span>
          <div className="flex-1 h-px bg-neutral-800"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Email or Username
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
                placeholder="name@example.com or username"
                className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl py-3 pl-10 pr-3.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Password
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
                className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl py-3 pl-10 pr-3.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-neutral-100 hover:bg-white text-black font-bold text-xs rounded-xl transition-all shadow-xl active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <span>Log In</span>
            )}
          </button>
        </form>
      </div>

      {/* Switch to Signup at bottom */}
      <div className="max-w-sm mx-auto w-full text-center border-t border-neutral-900 pt-4 pb-2">
        <p className="text-xs text-neutral-400">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => onNavigate('signup')}
            className="text-white font-semibold hover:underline cursor-pointer ml-1"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

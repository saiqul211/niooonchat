import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Mail, Lock, UserPlus, AlertCircle, Loader2, CheckCircle2, Github, ArrowLeft } from 'lucide-react';
import { triggerHaptic } from '../lib/native';

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

  const handleBackToWelcome = () => {
    triggerHaptic('light');
    onNavigate('welcome');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Form Validations
    if (!fullName.trim() || !username.trim() || !email.trim() || !password) {
      setErrorMsg('All fields are required.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters (only a-z, 0-9, _).');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
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
        throw new Error('This username is already taken. Please choose another.');
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

        setSuccessMsg('Account created successfully!');
        setTimeout(() => {
          onSuccess();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Sign up failed. Please try again.');
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
      setErrorMsg(err.message || 'GitHub sign up failed.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full min-h-[100dvh] flex flex-col justify-between py-6 px-5 safe-top safe-bottom bg-black text-neutral-100 animate-fadeIn">
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
        <span className="text-[11px] text-neutral-500 font-mono">#signup</span>
      </div>

      <div className="my-auto py-2 max-w-sm mx-auto w-full">
        {/* Emblem & Title */}
        <div className="text-center mb-4">
          <div className="w-13 h-13 bg-gradient-to-b from-neutral-800 to-neutral-950 border border-neutral-700/80 rounded-2xl mx-auto flex items-center justify-center mb-2.5 shadow-xl">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create New Account</h2>
          <p className="text-xs text-neutral-400 mt-1">Enter your details to join Niooon Chat</p>
        </div>

        {errorMsg && (
          <div className="mb-3 p-3 rounded-xl bg-red-950/50 border border-red-900/60 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-950/50 border border-emerald-900/60 text-emerald-300 text-xs flex items-start gap-2.5">
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
          <span>Quick Sign Up with GitHub</span>
        </button>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex-1 h-px bg-neutral-800"></div>
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider">or fill out the form</span>
          <div className="flex-1 h-px bg-neutral-800"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-2.5">
          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-0.5">
              Full Name
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
                className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl py-2 pl-9 pr-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-0.5">
              Username
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
                className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl py-2 pl-9 pr-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-0.5">
              Email Address
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
                className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl py-2 pl-9 pr-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-0.5">
              Password
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
                placeholder="At least 6 characters"
                className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl py-2 pl-9 pr-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-0.5">
              Confirm Password
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
                placeholder="Repeat password"
                className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl py-2 pl-9 pr-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2.5 py-3 px-4 bg-neutral-100 hover:bg-white text-black font-bold text-xs rounded-xl transition-all shadow-xl active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <span>Complete Sign Up</span>
            )}
          </button>
        </form>
      </div>

      {/* Switch to Login at bottom */}
      <div className="max-w-sm mx-auto w-full text-center border-t border-neutral-900 pt-3 pb-2">
        <p className="text-xs text-neutral-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-white font-semibold hover:underline cursor-pointer ml-1"
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  );
};

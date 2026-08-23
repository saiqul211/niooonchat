import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { User, Mail, Calendar, LogOut, CheckCircle2, RefreshCw, KeyRound, Sparkles, LogIn, UserPlus, Github } from 'lucide-react';

interface ProfileScreenProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigate, onLogout }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authProvider, setAuthProvider] = useState<string>('email');
  const [loading, setLoading] = useState(true);
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsLoggedOut(true);
        setProfile(null);
        setLoading(false);
        return;
      }

      setIsLoggedOut(false);
      setUserEmail(user.email || null);
      setUserId(user.id);
      setAuthProvider(user.app_metadata?.provider || 'email');

      // Fetch from profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      } else {
        // Fallback from auth metadata
        setProfile({
          id: user.id,
          full_name: user.user_metadata?.full_name || 'Niooon User',
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
          email: user.email || '',
          created_at: user.created_at || new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const handleGitHubConnect = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin,
        },
      });
    } catch (err) {
      console.error('GitHub connect error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
        <RefreshCw className="w-8 h-8 animate-spin text-neutral-500 mb-3" />
        <p className="text-xs">Loading profile...</p>
      </div>
    );
  }

  if (isLoggedOut || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-2 text-center animate-fadeIn">
        <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-3xl flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-neutral-500" />
        </div>
        <h3 className="text-lg font-bold text-neutral-100 mb-1">No Account Logged In</h3>
        <p className="text-xs text-neutral-400 max-w-xs mb-6">
          To view your profile and start chatting, please log in or create a new account.
        </p>

        <div className="flex flex-col w-full max-w-xs gap-3">
          <button
            onClick={() => onNavigate('login')}
            className="w-full py-3 px-4 bg-neutral-100 hover:bg-white text-black font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Log In</span>
          </button>
          <button
            onClick={() => onNavigate('signup')}
            className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New Account</span>
          </button>
        </div>
      </div>
    );
  }

  // Get initials for avatar
  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'NC';

  const memberDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Today';

  return (
    <div className="flex flex-col py-2 px-1 animate-fadeIn">
      {/* Profile Card Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-neutral-900 to-black border border-neutral-800/80 p-5 mb-5 shadow-2xl">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center text-neutral-100 font-bold text-xl shadow-inner shrink-0">
            {initials}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-neutral-100 truncate">{profile.full_name}</h2>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
            <p className="text-xs text-neutral-400 font-mono">@{profile.username}</p>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400/90 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Active on Supabase & GitHub</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Details List */}
      <div className="space-y-2.5 mb-6">
        <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1">
          Account Information
        </h4>

        {/* Full Name */}
        <div className="bg-neutral-900/60 border border-neutral-800/70 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-800/60 text-neutral-300">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-neutral-400">Full Name</p>
              <p className="text-xs font-semibold text-neutral-100">{profile.full_name}</p>
            </div>
          </div>
        </div>

        {/* Username */}
        <div className="bg-neutral-900/60 border border-neutral-800/70 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-800/60 text-neutral-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-neutral-400">Username</p>
              <p className="text-xs font-mono font-semibold text-neutral-100">@{profile.username}</p>
            </div>
          </div>
        </div>

        {/* GitHub Connection */}
        <div className="bg-neutral-900/60 border border-neutral-800/70 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-800/60 text-neutral-300">
              <Github className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-neutral-400">GitHub Connection</p>
              <p className="text-xs font-medium text-neutral-200">
                {authProvider === 'github' ? 'Connected (GitHub OAuth)' : 'Connected via @niooon/github'}
              </p>
            </div>
          </div>
          {authProvider !== 'github' && (
            <button
              onClick={handleGitHubConnect}
              className="py-1 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-medium rounded-lg transition-colors cursor-pointer"
            >
              Connect
            </button>
          )}
        </div>

        {/* Email */}
        <div className="bg-neutral-900/60 border border-neutral-800/70 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-800/60 text-neutral-300">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-neutral-400">Email Address (Private)</p>
              <p className="text-xs font-medium text-neutral-100 truncate">{profile.email || userEmail}</p>
            </div>
          </div>
        </div>

        {/* User ID */}
        <div className="bg-neutral-900/60 border border-neutral-800/70 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-neutral-800/60 text-neutral-300 shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-neutral-400">Supabase User ID</p>
              <p className="text-[10px] font-mono text-neutral-400 truncate">{userId || profile.id}</p>
            </div>
          </div>
        </div>

        {/* Join Date */}
        <div className="bg-neutral-900/60 border border-neutral-800/70 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-800/60 text-neutral-300">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-neutral-400">Member Since</p>
              <p className="text-xs font-medium text-neutral-200">{memberDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2">
        <button
          onClick={handleSignOut}
          className="w-full py-3 px-4 bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-900/40 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { Home, Search, User, LogOut, MessageSquarePlus, Sparkles, Wifi, WifiOff, ShieldCheck } from 'lucide-react';
import { AppRoute } from '../types';
import { triggerHaptic } from '../lib/native';

interface DesktopSidebarProps {
  currentRoute: AppRoute;
  onNavigate: (route: string) => void;
  sessionUser: any;
  userProfile?: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  } | null;
  isOnline: boolean;
  unreadTotal?: number;
  onLogout?: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentRoute,
  onNavigate,
  sessionUser,
  userProfile,
  isOnline,
  unreadTotal = 0,
  onLogout,
}) => {
  const handleNav = (route: string) => {
    triggerHaptic('selection');
    onNavigate(route);
  };

  const displayName = userProfile?.full_name || sessionUser?.user_metadata?.full_name || 'Niooon User';
  const username = userProfile?.username || sessionUser?.user_metadata?.username || sessionUser?.email?.split('@')[0] || 'user';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U';

  const isChatActive = currentRoute === 'home' || currentRoute === 'chat';

  return (
    <aside className="w-64 lg:w-72 bg-neutral-950 border-r border-neutral-800/80 flex flex-col justify-between h-full shrink-0 select-none z-20">
      {/* Top Header / Branding */}
      <div className="p-4 border-b border-neutral-800/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700/80 flex items-center justify-center text-white shadow-md shadow-black/40">
              <Sparkles className="w-5 h-5 text-neutral-200" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>Niooon Chat</span>
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] text-neutral-400 font-mono">
                  {isOnline ? 'Realtime Synced' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick New Direct Chat CTA */}
        <button
          onClick={() => handleNav('search')}
          className="mt-4 w-full py-2.5 px-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700/80 rounded-xl text-neutral-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm group active:scale-[0.98]"
        >
          <MessageSquarePlus className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span>New Direct Message</span>
        </button>
      </div>

      {/* Primary Navigation Menu */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-neutral-500 uppercase font-mono">
          Navigation
        </div>

        {/* Inbox / Home */}
        <button
          onClick={() => handleNav('home')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            isChatActive
              ? 'bg-neutral-800/90 text-white font-semibold shadow-sm border border-neutral-700/70'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60 border border-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <Home className={`w-4 h-4 ${isChatActive ? 'text-white' : 'text-neutral-500'}`} />
            <span>Messages & Inbox</span>
          </div>
          {unreadTotal > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500 text-black">
              {unreadTotal}
            </span>
          )}
        </button>

        {/* Search */}
        <button
          onClick={() => handleNav('search')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            currentRoute === 'search'
              ? 'bg-neutral-800/90 text-white font-semibold shadow-sm border border-neutral-700/70'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60 border border-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <Search className={`w-4 h-4 ${currentRoute === 'search' ? 'text-white' : 'text-neutral-500'}`} />
            <span>Search & Direct</span>
          </div>
          <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
            @user
          </span>
        </button>

        {/* Profile */}
        <button
          onClick={() => handleNav('profile')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            currentRoute === 'profile'
              ? 'bg-neutral-800/90 text-white font-semibold shadow-sm border border-neutral-700/70'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60 border border-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <User className={`w-4 h-4 ${currentRoute === 'profile' ? 'text-white' : 'text-neutral-500'}`} />
            <span>My Profile</span>
          </div>
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
        </button>
      </div>

      {/* Bottom Profile / Logout Card */}
      <div className="p-3 border-t border-neutral-800/60 bg-black/40">
        <div className="p-2.5 rounded-xl bg-neutral-900/70 border border-neutral-800/80 flex items-center justify-between gap-2.5">
          <div
            onClick={() => handleNav('profile')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1 group"
          >
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-200 group-hover:border-neutral-500 transition-colors">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-neutral-900 rounded-full" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-neutral-200 truncate group-hover:text-white transition-colors">
                {displayName}
              </p>
              <p className="text-[10px] font-mono text-neutral-500 truncate">
                @{username}
              </p>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

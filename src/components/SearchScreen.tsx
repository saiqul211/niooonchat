import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PublicProfile } from '../types';
import { Search, User, MessageCircle, Loader2, Sparkles } from 'lucide-react';

interface SearchScreenProps {
  onNavigate: (route: string) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  // Strictly query public profile fields ONLY - NEVER fetch email
  const searchUsers = async (searchTerm: string) => {
    setLoading(true);
    try {
      let req = supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, status, created_at')
        .limit(25);

      if (searchTerm.trim()) {
        const cleanTerm = searchTerm.trim().replace('@', '');
        req = req.or(`username.ilike.%${cleanTerm}%,full_name.ilike.%${cleanTerm}%`);
      }

      const { data, error } = await req;
      if (!error && data) {
        // Filter out current user from search list
        setUsers(data.filter((u: PublicProfile) => u.id !== currentUserId));
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchUsers('');
  }, [currentUserId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchUsers(query);
  };

  return (
    <div className="flex flex-col h-full space-y-3 animate-fadeIn">
      {/* Search Input Box */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
          <Search className="w-3.5 h-3.5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            searchUsers(e.target.value);
          }}
          placeholder="ইউজারনেম দিয়ে খুঁজুন (যেমন: @raihan)..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-3.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition-colors"
        />
      </form>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-semibold text-neutral-300">
            {query ? `'${query}' সার্চের ফলাফল` : 'ইউজার তালিকা'}
          </h3>
          <span className="text-[10px] text-neutral-500">({users.length})</span>
        </div>
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500" />}
      </div>

      {/* List (Scrollable Area) */}
      <div className="flex-1 space-y-1.5">
        {users.length > 0 ? (
          users.map((u) => {
            const initials = u.full_name
              ? u.full_name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
              : 'U';
            return (
              <div
                key={u.id}
                onClick={() => onNavigate(`chat?user=${u.username}`)}
                className="bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800/60 hover:border-neutral-700/80 rounded-xl p-3 flex items-center justify-between transition-all cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-200 shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-neutral-100 truncate">{u.full_name}</p>
                    <p className="text-[11px] font-mono text-neutral-400 truncate">@{u.username}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(`chat?user=${u.username}`);
                  }}
                  className="py-1.5 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>চ্যাট</span>
                </button>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center text-neutral-500">
            <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium text-neutral-400 mb-0.5">কোনো ইউজার পাওয়া যায়নি</p>
            <p className="text-[11px] text-neutral-500">ইউজারনেম বা নাম লিখে অনুসন্ধান করুন</p>
          </div>
        )}
      </div>
    </div>
  );
};

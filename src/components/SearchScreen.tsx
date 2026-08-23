import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PublicProfile } from '../types';
import { Search, User, MessageCircle, Loader2, MessageSquareDashed } from 'lucide-react';

interface SearchScreenProps {
  onNavigate: (route: string) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [chattedUsers, setChattedUsers] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch only users with whom the current user has sent or received messages
  const loadChattedUsers = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setChattedUsers([]);
        setLoading(false);
        return;
      }

      // 1. Fetch distinct message pairs involving the current user
      const { data: messages, error: msgErr } = await supabase
        .from('messages')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (msgErr || !messages || messages.length === 0) {
        setChattedUsers([]);
        setLoading(false);
        return;
      }

      // 2. Extract unique chatted partner IDs
      const partnerIdsSet = new Set<string>();
      messages.forEach((m: { sender_id: string; receiver_id: string }) => {
        const partnerId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (partnerId && partnerId !== user.id) {
          partnerIdsSet.add(partnerId);
        }
      });

      const partnerIds = Array.from(partnerIdsSet);
      if (partnerIds.length === 0) {
        setChattedUsers([]);
        setLoading(false);
        return;
      }

      // 3. Fetch public profiles strictly for these chatted partners only
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, status, created_at')
        .in('id', partnerIds);

      if (!profErr && profiles) {
        setChattedUsers(profiles);
      } else {
        setChattedUsers([]);
      }
    } catch (err) {
      console.error('Error fetching chatted users:', err);
      setChattedUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChattedUsers();

    // Subscribe to messages changes to keep chatted contacts live
    const channel = supabase
      .channel('search-chatted-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          loadChattedUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadChattedUsers]);

  // Filter ONLY within chatted users based on user search query
  const cleanQuery = query.trim().toLowerCase().replace('@', '');
  const filteredUsers = cleanQuery
    ? chattedUsers.filter((u) => {
        const matchUsername = u.username?.toLowerCase().includes(cleanQuery);
        const matchFullName = u.full_name?.toLowerCase().includes(cleanQuery);
        return matchUsername || matchFullName;
      })
    : chattedUsers;

  return (
    <div className="flex flex-col h-full space-y-3 animate-fadeIn">
      {/* Search Input Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
          <Search className="w-3.5 h-3.5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chatted users (e.g. @username)..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-3.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition-colors"
        />
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-semibold text-neutral-300">
            {query ? `Search Results` : 'Chatted Contacts'}
          </h3>
          <span className="text-[10px] text-neutral-500">
            ({filteredUsers.length}{query ? ` of ${chattedUsers.length}` : ''})
          </span>
        </div>
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500" />}
      </div>

      {/* List (Scrollable Area) */}
      <div className="flex-1 space-y-1.5">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-500">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="text-xs">Loading chatted users...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((u) => {
            const initials = u.full_name
              ? u.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()
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
                  <span>Chat</span>
                </button>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center text-neutral-500 px-4">
            {chattedUsers.length === 0 ? (
              <>
                <MessageSquareDashed className="w-9 h-9 mx-auto mb-2.5 opacity-40 text-neutral-400" />
                <p className="text-xs font-medium text-neutral-300 mb-1">No Chatted Users Found</p>
                <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                  Only users with whom you have chatted will appear in this search. Start a chat first to search contacts here.
                </p>
              </>
            ) : (
              <>
                <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium text-neutral-400 mb-0.5">No matching chatted users</p>
                <p className="text-[11px] text-neutral-500">
                  No conversation partner matches '{query}'
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

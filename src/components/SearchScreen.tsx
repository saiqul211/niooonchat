import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PublicProfile } from '../types';
import { Search, User, MessageCircle, Loader2, MessageSquareDashed, ArrowRight, AlertCircle } from 'lucide-react';

interface SearchScreenProps {
  onNavigate: (route: string) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [chattedUsers, setChattedUsers] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchingExact, setSearchingExact] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; username?: string } | null>(null);

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

      // Fetch current user's profile username to avoid chatting with oneself
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', user.id)
        .maybeSingle();

      setCurrentUser({
        id: user.id,
        username: myProfile?.username || user.user_metadata?.username,
      });

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

  // Handle Exact Username Search and Automatic Chat Opening
  const handleExactSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = query.trim().replace(/^@+/, '').toLowerCase();
    if (!cleanUsername) {
      setErrorMessage('Please enter an exact username to search.');
      return;
    }

    if (currentUser?.username && currentUser.username.toLowerCase() === cleanUsername) {
      setErrorMessage('You cannot start a direct chat with yourself.');
      return;
    }

    setSearchingExact(true);
    try {
      // Look up exact username in Supabase database
      const { data: targetProfile, error } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (error || !targetProfile) {
        setErrorMessage(`No user found with exact username '@${cleanUsername}'. Please verify spelling.`);
        return;
      }

      if (targetProfile.id === currentUser?.id) {
        setErrorMessage('You cannot start a direct chat with yourself.');
        return;
      }

      // Exact user found -> automatically navigate directly into chat!
      setQuery('');
      onNavigate(`chat?user=${targetProfile.username}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while searching for this username.');
    } finally {
      setSearchingExact(false);
    }
  };

  // Filter ONLY within already chatted users (no random public auto-suggestions)
  const cleanQuery = query.trim().toLowerCase().replace(/^@+/, '');
  const filteredChattedUsers = cleanQuery
    ? chattedUsers.filter((u) => {
        const matchUsername = u.username?.toLowerCase().includes(cleanQuery);
        const matchFullName = u.full_name?.toLowerCase().includes(cleanQuery);
        return matchUsername || matchFullName;
      })
    : chattedUsers;

  return (
    <div className="flex flex-col h-full space-y-4 animate-fadeIn max-w-2xl lg:max-w-3xl w-full mx-auto">
      {/* Exact Username Search Form */}
      <form onSubmit={handleExactSearch} className="space-y-2.5">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3.5 md:pl-4 flex items-center pointer-events-none text-neutral-500">
            <Search className="w-4 h-4 md:w-4.5 md:h-4.5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Type exact @username and press Search or Enter..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 md:py-3.5 pl-10 md:pl-11 pr-24 md:pr-28 text-xs md:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition-colors shadow-inner"
          />
          <button
            type="submit"
            disabled={searchingExact || !query.trim()}
            className="absolute right-1.5 md:right-2 py-1.5 md:py-2 px-3 md:px-4 rounded-lg md:rounded-xl bg-neutral-100 hover:bg-white text-black font-semibold text-xs md:text-sm flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 shadow-sm"
          >
            {searchingExact ? (
              <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
            ) : (
              <>
                <span>Chat</span>
                <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </>
            )}
          </button>
        </div>
        <p className="text-[10px] md:text-xs text-neutral-500 px-1">
          To chat with someone new, enter their exact username (e.g. <span className="font-mono text-neutral-400">@username</span>) and click <span className="text-neutral-300">Chat</span>. No partial public suggestions will be shown.
        </p>
      </form>

      {/* Error Message Notice */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/50 flex items-center gap-2 text-red-300 text-xs animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span className="leading-tight">{errorMessage}</span>
        </div>
      )}

      {/* Chatted Contacts Header */}
      <div className="flex items-center justify-between px-1 pt-1 border-t border-neutral-900">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-semibold text-neutral-300">
            {query.trim() ? `Matching Chatted Contacts` : 'Chatted Contacts'}
          </h3>
          <span className="text-[10px] text-neutral-500">
            ({filteredChattedUsers.length}{query.trim() ? ` of ${chattedUsers.length}` : ''})
          </span>
        </div>
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500" />}
      </div>

      {/* List (Scrollable Area) */}
      <div className="flex-1 min-h-0 space-y-1.5 overflow-y-auto overscroll-contain pr-0.5">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-500">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="text-xs">Loading chatted users...</p>
          </div>
        ) : filteredChattedUsers.length > 0 ? (
          filteredChattedUsers.map((u) => {
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
                  <span>Open Chat</span>
                </button>
              </div>
            );
          })
        ) : (
          <div className="py-14 text-center text-neutral-500 px-4">
            {chattedUsers.length === 0 ? (
              <>
                <MessageSquareDashed className="w-9 h-9 mx-auto mb-2.5 opacity-40 text-neutral-400" />
                <p className="text-xs font-medium text-neutral-300 mb-1">No Chatted Users Yet</p>
                <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                  Enter an exact username above and click Chat to start your first conversation.
                </p>
              </>
            ) : (
              <>
                <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium text-neutral-400 mb-0.5">No matching chatted contacts</p>
                <p className="text-[11px] text-neutral-500">
                  Click the 'Chat' button above to search and start a conversation with '@{query.trim().replace(/^@+/, '')}' directly.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


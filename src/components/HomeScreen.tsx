import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PublicProfile, DirectMessage } from '../types';
import { MessageSquarePlus, Search, MessageCircle, Loader2, CheckCheck } from 'lucide-react';

interface HomeScreenProps {
  onNavigate: (route: string) => void;
  activeUsername?: string;
}

interface ConversationItem {
  partnerId: string;
  partnerName: string;
  partnerUsername: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isMyMessage: boolean;
  avatarInitials: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, activeUsername }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const loadConversations = useCallback(async (userId: string) => {
    try {
      // 1. Fetch all messages involving the current user ordered by most recent first
      const { data: messagesData, error: msgErr } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (msgErr || !messagesData || messagesData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // 2. Group messages by conversation partner
      const partnerMap = new Map<string, { lastMsg: DirectMessage; unread: number }>();
      messagesData.forEach((msg: DirectMessage) => {
        const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        const isUnreadForMe = !msg.is_read && msg.receiver_id === userId;

        if (!partnerMap.has(partnerId)) {
          partnerMap.set(partnerId, {
            lastMsg: msg,
            unread: isUnreadForMe ? 1 : 0,
          });
        } else {
          if (isUnreadForMe) {
            const current = partnerMap.get(partnerId)!;
            current.unread += 1;
          }
        }
      });

      const partnerIds = Array.from(partnerMap.keys());
      if (partnerIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // 3. Fetch public profile info for all conversation partners (strictly no email)
      const { data: profilesData, error: profileErr } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', partnerIds);

      if (profileErr || !profilesData) {
        setLoading(false);
        return;
      }

      const profileLookup = new Map<string, any>();
      profilesData.forEach((p: any) => {
        profileLookup.set(p.id, p);
      });

      // 4. Assemble the sorted conversation list
      const threadList: ConversationItem[] = [];
      partnerMap.forEach((val, partnerId) => {
        const prof = profileLookup.get(partnerId);
        const name = prof?.full_name || 'Anonymous User';
        const uname = prof?.username || 'user';
        const initials = name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
        
        let timeStr = '';
        if (val.lastMsg.created_at) {
          const d = new Date(val.lastMsg.created_at);
          const now = new Date();
          if (d.toDateString() === now.toDateString()) {
            timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          } else {
            timeStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }
        }

        threadList.push({
          partnerId,
          partnerName: name,
          partnerUsername: uname,
          lastMessage: val.lastMsg.content,
          timestamp: timeStr,
          unreadCount: val.unread,
          isMyMessage: val.lastMsg.sender_id === userId,
          avatarInitials: initials,
        });
      });

      setConversations(threadList);
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let activeChannel: any = null;

    const init = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setCurrentUser(user);
      await loadConversations(user.id);

      // Realtime listener for incoming & outgoing messages and read status updates
      const channelId = `home-inbox-${user.id.substring(0, 8)}-${Date.now()}`;
      const channel = supabase.channel(channelId);

      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = (payload.new || payload.old) as DirectMessage;
          if (msg && (msg.sender_id === user.id || msg.receiver_id === user.id)) {
            loadConversations(user.id);
          }
        }
      );

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          activeChannel = channel;
        }
      });
    };

    init();

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  }, [loadConversations]);

  const filteredConversations = conversations.filter((c) => {
    if (activeTab === 'unread' && c.unreadCount === 0) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim().replace('@', '');
      return (
        c.partnerName.toLowerCase().includes(q) ||
        c.partnerUsername.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full space-y-3 animate-fadeIn">
      {/* Top Search / Start New Chat Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search in inbox..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2 pl-9 pr-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition-colors"
          />
        </div>
        <button
          onClick={() => onNavigate('search')}
          className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-300 hover:text-white transition-colors shrink-0 cursor-pointer"
          title="Search chatted contacts"
        >
          <MessageSquarePlus className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 pb-1 border-b border-neutral-900">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'bg-neutral-100 text-black font-semibold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          All Chats ({conversations.length})
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`px-3 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'unread'
              ? 'bg-neutral-100 text-black font-semibold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <span>Unread</span>
          {conversations.some((c) => c.unreadCount > 0) && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* Live Chat Inbox Stream (Scrollable Area) */}
      <div className="flex-1 min-h-0 space-y-1.5 overflow-y-auto overscroll-contain pr-0.5">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-500">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="text-xs">Updating inbox...</p>
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((chat) => {
            const isSelected = activeUsername?.toLowerCase() === chat.partnerUsername.toLowerCase();
            return (
              <div
                key={chat.partnerId}
                onClick={() => onNavigate(`chat?user=${chat.partnerUsername}`)}
                className={`border rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer active:scale-[0.99] ${
                  isSelected
                    ? 'bg-neutral-800 border-neutral-600 shadow-md text-white'
                    : 'bg-neutral-900/50 hover:bg-neutral-900 border-neutral-800/60 hover:border-neutral-700/80'
                }`}
              >
                {/* Avatar with status */}
                <div className="relative shrink-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs ${
                    isSelected ? 'bg-neutral-700 border border-neutral-500 text-white' : 'bg-neutral-800 border border-neutral-700 text-neutral-200'
                  }`}>
                    {chat.avatarInitials}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-black rounded-full"></span>
                </div>

              {/* Thread Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h4 className="text-xs font-semibold text-neutral-100 truncate">
                      {chat.partnerName}
                    </h4>
                    <span className="text-[10px] font-mono text-neutral-500 truncate">
                      @{chat.partnerUsername}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500 shrink-0 font-mono">
                    {chat.timestamp}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1">
                  <p className="text-[11px] text-neutral-400 truncate leading-tight">
                    {chat.isMyMessage && <span className="text-neutral-500 mr-1">You:</span>}
                    {chat.lastMessage}
                  </p>
                  {chat.unreadCount > 0 ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-400 text-black text-[9px] font-bold flex items-center justify-center shrink-0">
                      {chat.unreadCount}
                    </span>
                  ) : chat.isMyMessage ? (
                    <CheckCheck className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                  ) : null}
                </div>
              </div>
            </div>
          );
        })
        ) : (
          <div className="py-16 text-center text-neutral-500">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-2 text-neutral-400">
              <MessageCircle className="w-6 h-6 text-neutral-500" />
            </div>
            <p className="text-xs font-medium text-neutral-300 mb-0.5">No conversations yet</p>
            <p className="text-[11px] text-neutral-500 max-w-xs mx-auto mb-4">
              When you send or receive direct messages, they will appear here in real time.
            </p>
            <button
              onClick={() => onNavigate('search')}
              className="py-2 px-3.5 rounded-xl bg-neutral-100 hover:bg-white text-black text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Chatted Contacts</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

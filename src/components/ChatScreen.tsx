import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { PublicProfile, DirectMessage } from '../types';
import { ArrowLeft, Send, Loader2, Sparkles, Check, CheckCheck, MessageSquare, ShieldCheck } from 'lucide-react';

interface ChatScreenProps {
  targetUsername: string;
  onNavigate: (route: string) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ targetUsername, onNavigate }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [targetUser, setTargetUser] = useState<PublicProfile | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch current user, target user, mark messages as read (Seen) and setup realtime stream
  useEffect(() => {
    let isMounted = true;
    let activeChannel: any = null;

    const initChat = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (!user) {
          setErrorMsg('Please log in first to send messages.');
          setLoading(false);
          return;
        }
        setCurrentUser(user);

        // Fetch target user public profile by username ONLY (zero email exposure)
        const { data: targetProfile, error: userErr } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, status, created_at')
          .eq('username', targetUsername.toLowerCase().trim())
          .maybeSingle();

        if (!isMounted) return;

        if (userErr || !targetProfile) {
          setErrorMsg(`User '@${targetUsername}' not found.`);
          setLoading(false);
          return;
        }

        setTargetUser(targetProfile);

        // 1. Immediately mark all unread messages from target user as read (Seen) in Database
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('sender_id', targetProfile.id)
          .eq('receiver_id', user.id);

        // 2. Fetch all messages between the two users
        const { data: initialMessages, error: msgErr } = await supabase
          .from('messages')
          .select('*')
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${targetProfile.id}),and(sender_id.eq.${targetProfile.id},receiver_id.eq.${user.id})`
          )
          .order('created_at', { ascending: true });

        if (!isMounted) return;

        if (!msgErr && initialMessages) {
          // If we received messages from target user, ensure their local state is marked is_read=true
          const updatedInitial = initialMessages.map((m) =>
            m.sender_id === targetProfile.id && m.receiver_id === user.id
              ? { ...m, is_read: true }
              : m
          );
          setMessages(updatedInitial);
        }

        // 3. Setup Supabase Realtime channel for instant Seen and Message Arrival
        const uniqueChannelId = `room-${user.id.substring(0, 8)}-${targetProfile.id.substring(0, 8)}-${Date.now()}`;
        const channel = supabase.channel(uniqueChannelId);

        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
          },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              const newMsg = payload.new as DirectMessage;
              if (
                (newMsg.sender_id === user.id && newMsg.receiver_id === targetProfile.id) ||
                (newMsg.sender_id === targetProfile.id && newMsg.receiver_id === user.id)
              ) {
                const shouldMarkSeen = newMsg.sender_id === targetProfile.id && newMsg.receiver_id === user.id;
                const msgToAdd = shouldMarkSeen ? { ...newMsg, is_read: true } : newMsg;

                setMessages((prev) => {
                  if (prev.some((m) => m.id === newMsg.id)) return prev;
                  return [...prev, msgToAdd];
                });

                if (shouldMarkSeen) {
                  await supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id);
                }
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedMsg = payload.new as DirectMessage;
              setMessages((prev) =>
                prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
              );
            }
          }
        );

        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            activeChannel = channel;
          }
        });

      } catch (err: any) {
        if (isMounted) {
          console.error('Chat init error:', err);
          setErrorMsg('Failed to load chat.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (targetUsername) {
      initChat();
    }

    return () => {
      isMounted = false;
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  }, [targetUsername]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !targetUser || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    const tempId = 'temp-' + Date.now();
    const optimisticMsg: DirectMessage = {
      id: tempId,
      sender_id: currentUser.id,
      receiver_id: targetUser.id,
      content: messageText,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: targetUser.id,
          content: messageText,
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        console.warn('Realtime message insert warning:', error.message);
      } else if (data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? data : m))
        );
      }
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-neutral-400">
        <Loader2 className="w-7 h-7 animate-spin text-neutral-500 mb-2" />
        <p className="text-xs">Loading chat...</p>
      </div>
    );
  }

  if (errorMsg || !targetUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3 text-neutral-500">
          <MessageSquare className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-neutral-200 mb-1">{errorMsg || 'User not found'}</p>
        <p className="text-xs text-neutral-500 mb-5">Search again with a valid username</p>
        <button
          onClick={() => onNavigate('search')}
          className="py-2 px-4 bg-neutral-100 hover:bg-white text-black font-semibold text-xs rounded-xl transition-all cursor-pointer"
        >
          Find Users
        </button>
      </div>
    );
  }

  const targetInitials = targetUser.full_name
    ? targetUser.full_name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Top Chat Header */}
      <div className="h-14 bg-neutral-950 border-b border-neutral-800/80 px-3 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => onNavigate('home')}
            className="p-1.5 rounded-lg hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-200 shrink-0">
              {targetInitials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-black rounded-full"></span>
          </div>

          <div className="min-w-0">
            <h3 className="text-xs font-semibold text-neutral-100 truncate leading-tight">
              {targetUser.full_name}
            </h3>
            <p className="text-[10px] font-mono text-neutral-400 truncate">
              @{targetUser.username}
            </p>
          </div>
        </div>

        {/* Privacy Badge */}
        <div className="flex items-center gap-1 text-[10px] text-neutral-500 bg-neutral-900/60 border border-neutral-800/60 px-2 py-1 rounded-lg shrink-0">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Username Only</span>
        </div>
      </div>

      {/* Message Stream Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-3 bg-[#0a0a0a]">
        {/* Chat Security Notice */}
        <div className="text-center my-2">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-800/80 text-[10px] text-neutral-500">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Encrypted username-based direct messaging</span>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="py-16 text-center text-neutral-500">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-2 text-neutral-400">
              <Send className="w-5 h-5 text-neutral-500" />
            </div>
            <p className="text-xs font-medium text-neutral-300 mb-0.5">No messages yet</p>
            <p className="text-[11px] text-neutral-500">
              Type a message below to start chatting with @{targetUser.username}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser?.id;
            const timeFormatted = msg.created_at
              ? new Date(msg.created_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-md ${
                    isMe
                      ? 'bg-neutral-100 text-black font-medium rounded-br-xs'
                      : 'bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-bl-xs'
                  }`}
                >
                  {msg.content}
                </div>
                
                {/* Time and Seen Status */}
                <div className="flex items-center gap-1.5 mt-1 px-1">
                  <span className="text-[9px] text-neutral-500 font-mono">
                    {timeFormatted}
                  </span>
                  {isMe && (
                    <div className="flex items-center">
                      {msg.is_read ? (
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                          <span>Seen</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-400 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Sent</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bottom Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-2.5 bg-neutral-950 border-t border-neutral-800/80 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`Message @${targetUser.username}...`}
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-3.5 pr-3.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition-colors"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="w-9 h-9 rounded-xl bg-neutral-100 hover:bg-white text-black flex items-center justify-center shrink-0 transition-all shadow-md active:scale-95 disabled:opacity-40 cursor-pointer"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4 ml-0.5" />
          )}
        </button>
      </form>
    </div>
  );
};

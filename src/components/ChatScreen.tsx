import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { PublicProfile, DirectMessage } from '../types';
import { ArrowLeft, Send, Loader2, Sparkles, Check, CheckCheck, MessageSquare, ShieldCheck, Phone, Video } from 'lucide-react';
import { CallManagerService } from '../lib/callManager';

interface ChatScreenProps {
  targetUsername: string;
  onNavigate: (route: string) => void;
  isEmbedded?: boolean;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ targetUsername, onNavigate, isEmbedded }) => {
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

  const handleStartAudioCall = () => {
    if (!targetUser) return;
    CallManagerService.startCall(
      {
        id: targetUser.id,
        fullName: targetUser.full_name,
        username: targetUser.username,
        avatarUrl: targetUser.avatar_url,
      },
      'audio'
    );
  };

  const handleStartVideoCall = () => {
    if (!targetUser) return;
    CallManagerService.startCall(
      {
        id: targetUser.id,
        fullName: targetUser.full_name,
        username: targetUser.username,
        avatarUrl: targetUser.avatar_url,
      },
      'video'
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-neutral-400 safe-top safe-bottom">
        <Loader2 className="w-7 h-7 animate-spin text-neutral-500 mb-2" />
        <p className="text-xs">Loading chat...</p>
      </div>
    );
  }

  if (errorMsg || !targetUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center safe-top safe-bottom">
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
      {/* Top Chat Header with Safe Area Inset */}
      <header className="shrink-0 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/80 flex flex-col z-20 safe-top">
        <div className="h-13 px-3 md:px-4 flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5 min-w-0">
            {(!isEmbedded || true) && (
              <button
                onClick={() => onNavigate('home')}
                className={`p-1.5 -ml-1 rounded-lg hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer ${
                  isEmbedded ? 'lg:hidden' : ''
                }`}
                title="Go back"
              >
                <ArrowLeft className="w-4.5 h-4.5" />
              </button>
            )}

            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700/80 flex items-center justify-center font-bold text-xs text-neutral-200 shrink-0">
                {targetInitials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border-2 border-neutral-950 rounded-full"></span>
            </div>

            <div className="min-w-0">
              <h3 className="text-xs md:text-sm font-semibold text-neutral-100 truncate leading-tight">
                {targetUser.full_name}
              </h3>
              <p className="text-[10px] md:text-xs font-mono text-neutral-400 truncate">
                @{targetUser.username}
              </p>
            </div>
          </div>

          {/* Call Action Buttons & Privacy Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-chat-audio-call"
              onClick={handleStartAudioCall}
              className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800 transition active:scale-95 cursor-pointer flex items-center justify-center"
              title="Voice Call"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              id="btn-chat-video-call"
              onClick={handleStartVideoCall}
              className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800 transition active:scale-95 cursor-pointer flex items-center justify-center"
              title="Video Call"
            >
              <Video className="w-4 h-4 text-blue-400" />
            </button>

            <div className="hidden sm:flex items-center gap-1.5 text-[10px] md:text-xs text-neutral-400 bg-neutral-900/80 border border-neutral-800 px-2.5 py-1.5 rounded-lg shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Encrypted</span>
            </div>
          </div>
        </div>
      </header>

      {/* Message Stream Area */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3.5 md:p-6 space-y-3 bg-[#0a0a0a] overscroll-contain">
        {/* Chat Security Notice */}
        <div className="text-center my-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-800/80 text-[10px] md:text-xs text-neutral-500">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Encrypted username-based direct messaging</span>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="py-16 text-center text-neutral-500">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-2 text-neutral-400">
              <Send className="w-5 h-5 text-neutral-500" />
            </div>
            <p className="text-xs md:text-sm font-medium text-neutral-300 mb-0.5">No messages yet</p>
            <p className="text-[11px] md:text-xs text-neutral-500">
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
                  className={`max-w-[85%] md:max-w-md lg:max-w-xl px-4 py-2.5 rounded-2xl text-xs md:text-sm leading-relaxed break-words shadow-md selectable-text ${
                    isMe
                      ? 'bg-neutral-100 text-black font-medium rounded-br-xs'
                      : 'bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-bl-xs'
                  }`}
                >
                  {msg.content}
                </div>
                
                {/* Time and Seen Status */}
                <div className="flex items-center gap-1.5 mt-1 px-1">
                  <span className="text-[9px] md:text-[10px] text-neutral-500 font-mono">
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
        className="p-2.5 md:p-4 bg-neutral-950 border-t border-neutral-800/80 flex items-center gap-2 shrink-0 safe-bottom"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`Message @${targetUser.username}... (Press Enter to send)`}
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 md:py-3 pl-3.5 md:pl-4 pr-3.5 md:pr-4 text-xs md:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition-colors shadow-inner"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-neutral-100 hover:bg-white text-black flex items-center justify-center shrink-0 transition-all shadow-md active:scale-95 disabled:opacity-40 cursor-pointer"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
          ) : (
            <Send className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />
          )}
        </button>
      </form>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import supabase from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface Conversation {
  id: string;
  user_one: string;
  user_two: string;
  other_user_profile?: { full_name: string | null; email: string } | null;
}
interface Message { id: string; conversation_id: string; sender_id: string; message_type: string; message_text: string | null; image_url: string | null; location_lat: number | null; location_lng: number | null; created_at: string; }

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;
      // Fetch conversations
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user_one.eq.${user.id},user_two.eq.${user.id}`);

      if (!error && data) {
        const convs = data as Conversation[];
        // Fetch profiles for other users
        const enrichedConvs = await Promise.all(convs.map(async (conv) => {
          const otherId = conv.user_one === user.id ? conv.user_two : conv.user_one;
          const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', otherId).single();
          return { ...conv, other_user_profile: profile };
        }));
        setConversations(enrichedConvs);
      }
    };
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation.id)
        .order('created_at', { ascending: true });
      if (!error && data) setMessages(data as Message[]);
    };

    fetchMessages();

    // Subscribe to new messages for THIS conversation
    const channel = supabase
      .channel(`room-${selectedConversation.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `conversation_id=eq.${selectedConversation.id}` 
        }, 
        (payload) => {
          const msg = payload.new as Message;
          // Only append if not already there (to avoid duplicate from optimistic UI if implemented)
          setMessages((prev) => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;
    
    const msgText = newMessage.trim();
    setNewMessage('');

    // Optimistic Update
    const temporaryId = Math.random().toString(36).substring(7);
    const optimisticMsg: Message = {
      id: temporaryId,
      conversation_id: selectedConversation.id,
      sender_id: user.id,
      message_type: 'text',
      message_text: msgText,
      image_url: null,
      location_lat: null,
      location_lng: null,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, optimisticMsg]);

    const { data, error } = await supabase.from('messages').insert({ 
      conversation_id: selectedConversation.id, 
      sender_id: user.id, 
      message_type: 'text', 
      message_text: msgText 
    }).select().single();
    
    if (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== temporaryId));
      alert(i18n.language === 'ar' ? 'فشل إرسال الرسالة' : 'Failed to send message');
    } else if (data) {
      // Replace optimistic message with actual data from DB
      setMessages(prev => prev.map(m => m.id === temporaryId ? (data as Message) : m));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!user) return null;

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2 style={{ color: 'var(--text-white)', fontSize: '1rem', fontWeight: 700 }}>{t('chat.conversations')}</h2>
        </div>
        {conversations.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد محادثات بعد</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {conversations.map((conv) => {
              const isActive = selectedConversation?.id === conv.id;
              const displayName = conv.other_user_profile?.full_name || conv.other_user_profile?.email?.split('@')[0] || 'مستخدم';
              return (
                <li key={conv.id} className={`chat-conv-item ${isActive ? 'active' : ''}`} onClick={() => { setSelectedConversation(conv); setMessages([]); }}>
                  <div className="chat-conv-avatar">👤</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-white)', fontSize: '0.88rem', fontWeight: 600 }}>{displayName}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.15rem' }}>محادثة</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* Chat area */}
      <section className="chat-main">
        {selectedConversation ? (
          <>
            <div className="chat-messages">
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '3rem' }}>ابدأ المحادثة بإرسال رسالة</div>
              )}
              {messages.map((msg) => {
                const isMine = msg.sender_id === user.id;
                return (
                  <div key={msg.id} className={`chat-bubble-row ${isMine ? 'mine' : 'theirs'}`}>
                    <div className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                      {msg.message_text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-bar">
              <input
                type="text"
                className="chat-input"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب رسالة..."
              />
              <button className="btn btn-primary" onClick={handleSend}>إرسال ↵</button>
            </div>
          </>
        ) : (
          <div className="chat-empty">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💬</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>اختر محادثة من القائمة للبدء</div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ChatPage;

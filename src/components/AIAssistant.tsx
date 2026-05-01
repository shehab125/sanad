import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../supabaseClient';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Function to fetch all relevant site data for AI context
async function fetchSiteContext(isAdmin: boolean): Promise<string> {
  try {
    const [booksRes, notesRes, tutorsRes, housingRes, toolsRes] = await Promise.all([
      supabase.from('books').select('title, price, subject, university, condition').limit(20),
      supabase.from('notes').select('title, price, subject, university').limit(20),
      supabase.from('tutors').select('subjects, price_per_hour, rating_avg, university').limit(15),
      supabase.from('housing').select('title, price, rooms, address').limit(15),
      supabase.from('tools').select('title, price, category, condition').limit(20),
    ]);

    let context = `Current SANAD Platform Data:\n`;
    
    if (booksRes.data?.length) {
      context += `\nBooks: ${booksRes.data.map(b => `${b.title} (${b.price} EGP)`).join(', ')}`;
    }
    if (notesRes.data?.length) {
      context += `\nNotes: ${notesRes.data.map(n => `${n.title} (${n.price || 0} EGP)`).join(', ')}`;
    }
    if (tutorsRes.data?.length) {
      context += `\nTutors: ${tutorsRes.data.map(t => `${t.subjects} (${t.price_per_hour} EGP/hr)`).join(', ')}`;
    }
    if (housingRes.data?.length) {
      context += `\nHousing: ${housingRes.data.map(h => `${h.title} in ${h.address} (${h.price} EGP/mo)`).join(', ')}`;
    }
    if (toolsRes.data?.length) {
      context += `\nTools: ${toolsRes.data.map(t => `${t.title} (${t.price} EGP)`).join(', ')}`;
    }

    if (isAdmin) {
      const { data: users } = await supabase.from('profiles').select('full_name, email, role').limit(10);
      context += `\n\n[ADMIN ONLY] Recent Users: ${users?.map(u => u.full_name || u.email).join(', ')}`;
    }

    return context;
  } catch (err) {
    console.error('Context fetch error:', err);
    return 'Error fetching site data.';
  }
}

const AIAssistant: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [siteContext, setSiteContext] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const initChat = async () => {
    setIsOpen(true);
    if (messages.length === 0) {
      setLoading(true);
      const ctx = await fetchSiteContext(isAdmin);
      setSiteContext(ctx);
      setMessages([
        { 
          role: 'assistant', 
          content: i18n.language === 'ar' 
            ? 'أهلاً بك! أنا مساعد سند الذكي. كيف يمكنني مساعدتك اليوم؟' 
            : 'Welcome! I am Sanad Assistant. How can I help you today?' 
        }
      ]);
      setLoading(false);
    }
  };

  const GEMINI_MODELS = [
    'gemini-3.1-flash-preview',
    'gemini-3.1-flash-lite-preview',
    'gemini-3-flash-preview',
    'gemini-3.1-pro-preview'
  ];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const sendMessage = async (modelIndex = 0, retryCount = 1, delay = 1000) => {
      const userMsgContent = input.trim();
      if (!userMsgContent && modelIndex === 0 && retryCount === 1) return; 
      if (loading && modelIndex === 0 && retryCount === 1) return;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setMessages(prev => [...prev, { role: 'assistant', content: i18n.language === 'ar' ? 'عذراً، مفتاح الـ AI غير موجود.' : 'Sorry, the AI key is missing.' }]);
        return;
      }

      if (modelIndex === 0 && retryCount === 1) {
        setMessages(prev => [...prev, { role: 'user', content: userMsgContent }]);
        setInput('');
      }
      setLoading(true);

      const currentModel = GEMINI_MODELS[modelIndex];

      try {
        const history = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
        const prompt = `You are a helpful university assistant for Sanad. 
        Context: ${siteContext}. 
        User Language: ${i18n.language}. 
        User Role: ${user?.role || 'student'}.
        
        Conversation history:
        ${history}
        
        New User Message: ${userMsgContent || (messages.length > 0 ? messages[messages.length-1].content : '')}
        
        Provide a concise, helpful answer in the user's language.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        // Handle 503 (Busy) with retry
        if (response.status === 503 && retryCount > 0) {
          console.warn(`Gemini (${currentModel}) Busy. Retrying in ${delay}ms...`);
          setTimeout(() => sendMessage(modelIndex, retryCount - 1, delay * 2), delay);
          return;
        }

        // Handle 429 (Quota) with fallback to next model
        if ((response.status === 429 || response.status === 503) && modelIndex < GEMINI_MODELS.length - 1) {
          console.warn(`Gemini (${currentModel}) Quota/Busy limit reached. Falling back to ${GEMINI_MODELS[modelIndex + 1]}`);
          sendMessage(modelIndex + 1, 1, 1000);
          return;
        }

        if (!response.ok) {
          throw new Error(`Gemini Error ${response.status}`);
        }

        const data = await response.json();
        const assistantMsg = data.candidates?.[0]?.content?.parts?.[0]?.text || (i18n.language === 'ar' ? 'عذراً، حدث خطأ ما.' : 'Sorry, something went wrong.');
        setMessages(prev => [...prev, { role: 'assistant', content: assistantMsg.trim() }]);
      } catch (err) {
        console.error('AI Chat Error:', err);
        // Final fallback if all failed or another error occurred
        if (modelIndex < GEMINI_MODELS.length - 1) {
           sendMessage(modelIndex + 1, 1, 1000);
           return;
        }
        setMessages(prev => [...prev, { role: 'assistant', content: i18n.language === 'ar' ? 'فشل الاتصال بالخادم.' : 'Failed to connect to server.' }]);
      } finally {
        setLoading(false);
      }
    };
    sendMessage();
  };

  return (
    <div className={`ai-assistant-wrapper ${isOpen ? 'open' : ''}`}>
      {/* Floating Button */}
      <button className="ai-toggle-btn" onClick={isOpen ? () => setIsOpen(false) : initChat}>
        {isOpen ? '✕' : '✨'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="ai-chat-window animate-in">
          <div className="ai-chat-header">
            <div className="ai-status"></div>
            <span>{i18n.language === 'ar' ? 'مساعد سند الذكي' : 'Sanad Smart Assistant'}</span>
            {isAdmin && <span className="badge badge-accent" style={{ fontSize: '0.6rem', marginLeft: 'auto' }}>ADMIN MODE</span>}
          </div>

          <div className="ai-chat-messages" ref={scrollRef}>
            {messages.map((m, idx) => (
              <div key={idx} className={`ai-message-bubble ${m.role}`}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="ai-message-bubble assistant loading">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            )}
          </div>

          <form className="ai-chat-input" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder={i18n.language === 'ar' ? 'اسأل عن الكتب، السكن، المدرسين...' : 'Ask about books, housing, tutors...'} 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button type="submit" disabled={loading || !input.trim()}>
              {i18n.language === 'ar' ? 'إرسال' : 'Send'}
            </button>
          </form>
        </div>
      )}

      <style>{`
        .ai-assistant-wrapper {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 9999;
        }
        [dir="rtl"] .ai-assistant-wrapper {
          right: auto;
          left: 2rem;
        }

        .ai-toggle-btn {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-light), var(--accent-dark));
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(108, 99, 255, 0.4);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ai-toggle-btn:hover {
          transform: scale(1.1) rotate(5deg);
        }

        .ai-chat-window {
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 380px;
          height: 550px;
          background: rgba(13, 15, 23, 0.98);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        }
        [dir="rtl"] .ai-chat-window {
          right: auto;
          left: 0;
        }

        .ai-chat-header {
          padding: 1.25rem;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 800;
          color: var(--text-white);
        }
        .ai-status {
          width: 10px;
          height: 10px;
          background: #4ade80;
          border-radius: 50%;
          box-shadow: 0 0 10px #4ade80;
        }

        .ai-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .ai-message-bubble {
          max-width: 85%;
          padding: 0.8rem 1.1rem;
          border-radius: 18px;
          font-size: 0.95rem;
          line-height: 1.6;
        }
        .ai-message-bubble.assistant {
          align-self: flex-start;
          background: var(--bg-secondary);
          color: var(--text-white);
          border-bottom-left-radius: 4px;
          border: 1px solid var(--border);
        }
        .ai-message-bubble.user {
          align-self: flex-end;
          background: var(--accent-light);
          color: white;
          border-bottom-right-radius: 4px;
          box-shadow: 0 4px 15px rgba(108, 99, 255, 0.3);
        }

        .ai-chat-input {
          padding: 1.25rem;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border);
          display: flex;
          gap: 0.75rem;
        }
        .ai-chat-input input {
          flex: 1;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          color: white;
          padding: 0.75rem 1.25rem;
          border-radius: 50px;
          outline: none;
          font-size: 0.9rem;
        }
        .ai-chat-input input:focus {
          border-color: var(--accent-light);
        }
        .ai-chat-input button {
          padding: 0.75rem 1.5rem;
          background: var(--accent-light);
          color: white;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          font-weight: 700;
          transition: all 0.2s;
        }
        .ai-chat-input button:hover:not(:disabled) {
          background: var(--accent-glow);
          transform: translateY(-2px);
        }
        .ai-chat-input button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading .dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          margin: 0 3px;
          background: var(--accent-light);
          border-radius: 50%;
          animation: bounce 1.4s infinite;
        }
        .loading .dot:nth-child(2) { animation-delay: 0.15s; }
        .loading .dot:nth-child(3) { animation-delay: 0.3s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-8px); opacity: 1; }
        }

        @media (max-width: 480px) {
          .ai-chat-window {
            width: calc(100vw - 2rem);
            height: 60vh;
            bottom: 70px;
          }
           .ai-assistant-wrapper {
            bottom: 1.5rem;
            right: 1.5rem;
          }
          [dir="rtl"] .ai-assistant-wrapper {
            left: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AIAssistant;

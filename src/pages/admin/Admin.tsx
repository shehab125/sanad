import React, { useEffect, useState } from 'react';
import supabase from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface UserRow { id: string; full_name: string | null; email: string; role: string | null; }
interface ListingRow { id: string; title: string; table: string; }

const tableIcons: Record<string, string> = { books: '📚', notes: '📝', tools: '🧰', housing: '🏠' };

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: usersData } = await supabase.from('profiles').select('id, full_name, email, role');
      setUsers((usersData as UserRow[]) || []);
      const [booksRes, notesRes, toolsRes, housingRes] = await Promise.all([
        supabase.from('books').select('id, title'),
        supabase.from('notes').select('id, title'),
        supabase.from('tools').select('id, title'),
        supabase.from('housing').select('id, title'),
      ]);
      const items: ListingRow[] = [];
      booksRes.data?.forEach((b) => items.push({ ...b, table: 'books' } as any));
      notesRes.data?.forEach((n) => items.push({ ...n, table: 'notes' } as any));
      toolsRes.data?.forEach((t) => items.push({ ...t, table: 'tools' } as any));
      housingRes.data?.forEach((h) => items.push({ ...h, table: 'housing' } as any));
      setListings(items);
      setLoading(false);
    };
    fetchData();
  }, []);

  const GEMINI_MODELS = [
    'gemini-3.1-flash-lite-preview',
    'gemini-flash-lite-latest',
    'gemini-1.5-flash-8b',
    'gemini-flash-latest'
  ];

  const getAiInsight = async (modelIndex = 0, retries = 1, delay = 1000) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      alert(i18n.language === 'ar' ? 'مفتاح الـ AI غير موجود' : 'AI Key missing');
      return;
    }
    const currentModel = GEMINI_MODELS[modelIndex];
    try {
      const prompt = `You are an expert platform analyst for Sanad, a university marketplace. 
      Analyze the current platform stats: ${users.length} users, ${listings.filter(l => l.table === 'books').length} books, ${listings.filter(l => l.table === 'notes').length} notes, ${listings.filter(l => l.table === 'tools').length} tools. 
      Provide one strategic growth insight or warning for the admin. 
      Response must be in ${i18n.language}. Be professional and concise (2 sentences max).`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (response.status === 503 && retries > 0) {
        console.warn(`Gemini (${currentModel}) Busy. Retrying in ${delay}ms...`);
        setTimeout(() => getAiInsight(modelIndex, retries - 1, delay * 2), delay);
        return;
      }

      if ((response.status === 429 || response.status === 503) && modelIndex < GEMINI_MODELS.length - 1) {
        console.warn(`Gemini (${currentModel}) Quota/Busy limit. Falling back to ${GEMINI_MODELS[modelIndex + 1]}`);
        getAiInsight(modelIndex + 1, 1, 1000);
        return;
      }

      if (!response.ok) throw new Error(`Gemini Error ${response.status}`);
      const data = await response.json();
      setAiInsight(data.candidates?.[0]?.content?.parts?.[0]?.text || '');
    } catch (err) {
      console.error('AI Insight Error:', err);
      if (modelIndex < GEMINI_MODELS.length - 1) {
        getAiInsight(modelIndex + 1, 1, 1000);
      }
    } finally {
      setAiLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return (
    <div className="page-container">
      <div className="empty-state">
        <div className="empty-state-icon">🔒</div>
        <div className="empty-state-title">{i18n.language === 'ar' ? 'غير مسموح بالدخول' : 'Access Denied'}</div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="page-container">
      <div className="loading-container">
        <div className="spinner"></div>
        <span className="loading-text">{t('common.loading')}</span>
      </div>
    </div>
  );

  const handleToggleRole = async (id: string, currentRole: string | null) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
  };

  const handleDeleteListing = async (listing: ListingRow) => {
    if (!window.confirm(i18n.language === 'ar' ? 'هل أنت متأكد من حذف هذا الإعلان؟' : 'Are you sure you want to delete this listing?')) return;
    await supabase.from(listing.table).delete().eq('id', listing.id);
    setListings((prev) => prev.filter((l) => !(l.id === listing.id && l.table === listing.table)));
  };

  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ {i18n.language === 'ar' ? 'لوحة التحكم للمسؤولين' : 'Admin Dashboard'}</h1>
          <p className="page-subtitle">{i18n.language === 'ar' ? 'إدارة المستخدمين والإعلانات والإحصائيات' : 'Manage users, listings, and platform statistics'}</p>
        </div>
            <button className="btn btn-ghost btn-sm" onClick={() => getAiInsight()} disabled={aiLoading}>
          {aiLoading ? '⏳...' : '✨ ' + (i18n.language === 'ar' ? 'رؤية ذكية' : 'Get AI Insight')}
        </button>
      </div>

      {aiInsight && (
        <div className="alert alert-success animate-in" style={{ background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.1), transparent)', borderLeft: '4px solid var(--success)', marginBottom: '2rem' }}>
          <strong style={{ display: 'block', marginBottom: '0.2rem' }}>✨ AI Platform Insight:</strong>
          {aiInsight}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: '3rem' }}>
        {[
          { label: i18n.language === 'ar' ? 'المستخدمون' : 'Users', count: users.length, icon: '👥' },
          { label: i18n.language === 'ar' ? 'الكتب' : 'Books', count: listings.filter(l => l.table === 'books').length, icon: '📚' },
          { label: i18n.language === 'ar' ? 'الملخصات' : 'Notes', count: listings.filter(l => l.table === 'notes').length, icon: '📝' },
          { label: i18n.language === 'ar' ? 'الأدوات' : 'Tools', count: listings.filter(l => l.table === 'tools').length, icon: '🧰' },
        ].map((stat) => (
          <div key={stat.label} className="admin-stat-card">
            <div style={{ fontSize: '2rem' }}>{stat.icon}</div>
            <div className="admin-stat-value">{stat.count}</div>
            <div className="admin-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* Users Table */}
        <section className="admin-section">
          <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>👥 {i18n.language === 'ar' ? 'إدارة المستخدمين' : 'User Management'}</h2>
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{i18n.language === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th>{i18n.language === 'ar' ? 'البريد' : 'Email'}</th>
                  <th>{i18n.language === 'ar' ? 'الصلاحية' : 'Role'}</th>
                  <th>{i18n.language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700 }}>{u.full_name || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-new' : 'badge-used'}`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleToggleRole(u.id, u.role)}>
                        {u.role === 'admin' ? '⬇️ ' + (i18n.language === 'ar' ? 'خفض' : 'Demote') : '⬆️ ' + (i18n.language === 'ar' ? 'ترقية' : 'Promote')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Listings Table */}
        <section className="admin-section">
          <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>🏷️ {i18n.language === 'ar' ? 'أحدث الإعلانات' : 'Latest Listings'}</h2>
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{i18n.language === 'ar' ? 'العنوان' : 'Title'}</th>
                  <th>{i18n.language === 'ar' ? 'القسم' : 'Category'}</th>
                  <th>{i18n.language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {listings.slice(0, 50).map((l) => (
                  <tr key={`${l.table}-${l.id}`}>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</td>
                    <td>
                      <span className="badge badge-accent" style={{ textTransform: 'uppercase' }}>{tableIcons[l.table] || '📦'} {l.table}</span>
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteListing(l)}>🗑 {i18n.language === 'ar' ? 'حذف' : 'Delete'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminPage;
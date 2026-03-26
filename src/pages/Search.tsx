import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import supabase from '../supabaseClient';

interface Result {
  id: string;
  title: string;
  type: string;
  price?: number;
}

const typeIcons: Record<string, string> = {
  book: '📚',
  note: '📝',
  tutor: '🎓',
  housing: '🏠',
  tool: '🧰',
};

const typeLabels: Record<string, string> = {
  book: 'كتاب',
  note: 'ملخص',
  tutor: 'مدرس',
  housing: 'سكن',
  tool: 'أداة',
};

const SearchPage: React.FC = () => {
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setResults([]);
        setLoading(false);
        return;
      }
      const pattern = `%${query}%`;
      const [booksRes, notesRes, tutorsRes, housingRes, toolsRes] = await Promise.all([
        supabase.from('books').select('id, title, price').ilike('title', pattern),
        supabase.from('notes').select('id, title, price').ilike('title', pattern),
        supabase.from('tutors').select('id, subjects, price_per_hour').ilike('subjects', pattern),
        supabase.from('housing').select('id, title, price').ilike('title', pattern),
        supabase.from('tools').select('id, title, price').ilike('title', pattern),
      ]);
      const list: Result[] = [];
      booksRes.data?.forEach((r) => list.push({ ...r, type: 'book' }));
      notesRes.data?.forEach((r) => list.push({ ...r, type: 'note' }));
      tutorsRes.data?.forEach((r) => list.push({ id: r.id, title: r.subjects, price: r.price_per_hour, type: 'tutor' }));
      housingRes.data?.forEach((r) => list.push({ ...r, type: 'housing' }));
      toolsRes.data?.forEach((r) => list.push({ ...r, type: 'tool' }));
      setResults(list);
      setLoading(false);
    };
    setLoading(true);
    fetchResults();
  }, [query]);

  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔍 نتائج البحث</h1>
          <p className="page-subtitle">
            {query ? `نتائج البحث عن: "${query}"` : 'ابحث عن أي شيء...'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <span className="loading-text">جاري البحث...</span>
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">لا توجد نتائج</div>
          <p className="empty-state-text">جرّب كلمات مختلفة أو تصفح الأقسام</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {results.map((res) => (
            <Link
              key={`${res.type}-${res.id}`}
              to={`/${res.type}s/${res.id}`}
              className="card"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.2rem' }}
            >
              <div className="notification-icon" style={{ fontSize: '1.5rem' }}>
                {typeIcons[res.type] || '📦'}
              </div>
              <div style={{ flex: 1 }}>
                <div className="card-title" style={{ marginBottom: '0.3rem' }}>{res.title}</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-accent">{typeLabels[res.type]}</span>
                  {res.price !== undefined && (
                    <span className="badge badge-gold">{res.price} جنيه</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
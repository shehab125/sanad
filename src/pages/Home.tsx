import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface Book {
  id: string;
  title: string;
  price: number;
  image_url?: string;
}

interface Tutor {
  id: string;
  subjects: string | null;
  price_per_hour: number | null;
  rating_avg: number;
  image_url: string | null;
}

interface Housing {
  id: string;
  title: string;
  price: number;
  rooms: number;
}

const categories = [
  { to: '/books', icon: '📚', name: 'كتب', desc: 'بيع وشراء الكتب الدراسية' },
  { to: '/notes', icon: '📝', name: 'ملخصات', desc: 'تحميل وبيع الملخصات' },
  { to: '/tutors', icon: '🎓', name: 'مدرسين', desc: 'احجز مدرسين متميزين' },
  { to: '/housing', icon: '🏠', name: 'سكن', desc: 'ابحث عن غرف وشقق' },
  { to: '/tools', icon: '🧰', name: 'أدوات', desc: 'بيع وشراء الأدوات' },
];

const Home: React.FC = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  
  const categories = [
    { to: '/books', icon: '📚', name: t('nav.books'), desc: i18n.language === 'ar' ? 'بيع وشراء الكتب الدراسية' : 'Buy and sell textbooks' },
    { to: '/notes', icon: '📝', name: t('nav.notes'), desc: i18n.language === 'ar' ? 'تحميل وبيع الملخصات' : 'Upload and sell notes' },
    { to: '/tutors', icon: '🎓', name: t('nav.tutors'), desc: i18n.language === 'ar' ? 'احجز مدرسين متميزين' : 'Book excellent tutors' },
    { to: '/housing', icon: '🏠', name: t('nav.housing'), desc: i18n.language === 'ar' ? 'ابحث عن غرف وشقق' : 'Find rooms and apartments' },
    { to: '/tools', icon: '🧰', name: t('nav.tools'), desc: i18n.language === 'ar' ? 'بيع وشراء الأدوات' : 'Buy and sell student tools' },
  ];

  const [trendingBooks, setTrendingBooks] = useState<Book[]>([]);
  const [topTutors, setTopTutors] = useState<Tutor[]>([]);
  const [nearbyHousing, setNearbyHousing] = useState<Housing[]>([]);
  const [recommendedItems, setRecommendedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiTip, setAiTip] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const hasFetchedTip = useRef(false);

  const GEMINI_MODELS = [
    'gemini-3.1-flash-lite-preview',
    'gemini-flash-lite-latest',
    'gemini-1.5-flash-8b',
    'gemini-flash-latest'
  ];

  useEffect(() => {
    // Generate AI Tip
    const getAiTip = async (modelIndex = 0, retryCount = 1, delay = 1000) => {
      if (!user || hasFetchedTip.current) return;
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) return;
      
      const currentModel = GEMINI_MODELS[modelIndex];
      try {
        const prompt = `You are a helpful university assistant for a platform called Sanad. Provide a short, motivating one-sentence study tip or recommendation for a student.
        The student is at ${user.university} university, ${user.faculty} faculty. 
        Response should be in the user language (${i18n.language}). 
        Keep it very concise (one sentence max).`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (response.status === 503 && retryCount > 0) {
          console.warn(`Gemini (${currentModel}) Busy. Retrying in ${delay}ms...`);
          setTimeout(() => getAiTip(modelIndex, retryCount - 1, delay * 2), delay);
          return;
        }

        if ((response.status === 429 || response.status === 503) && modelIndex < GEMINI_MODELS.length - 1) {
          console.warn(`Gemini (${currentModel}) Quota/Busy limit. Falling back to ${GEMINI_MODELS[modelIndex + 1]}`);
          getAiTip(modelIndex + 1, 1, 1000);
          return;
        }

        if (!response.ok) {
          const errText = await response.text();
          console.error(`Gemini Error (${response.status}):`, errText);
          return;
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) {
          setAiTip(content.trim());
          hasFetchedTip.current = true;
        }
      } catch (err) {
        console.error('Gemini error:', err);
        if (modelIndex < GEMINI_MODELS.length - 1) {
           getAiTip(modelIndex + 1, 1, 1000);
        }
      } finally {
        setAiLoading(false);
      }
    };
    getAiTip();
  }, [user, i18n.language]);

  useEffect(() => {
    const fetchData = async () => {
      // Trending Books
      const { data: booksData } = await supabase
        .from('books')
        .select('id, title, price, book_images(image_url)')
        .order('created_at', { ascending: false })
        .limit(6);
      const books = (booksData || []).map((b: any) => {
        const { book_images, ...rest } = b;
        const image_url = b.book_images?.[0]?.image_url;
        return { ...rest, image_url } as Book;
      });
      setTrendingBooks(books);

      // Top Tutors
      const { data: tutorsData } = await supabase
        .from('tutors')
        .select('*')
        .order('rating_avg', { ascending: false })
        .limit(6);
      setTopTutors(tutorsData as Tutor[]);

      // Latest Housing
      const { data: housingData } = await supabase
        .from('housing')
        .select('id, title, price, rooms')
        .order('created_at', { ascending: false })
        .limit(6);
      setNearbyHousing(housingData as Housing[]);

      // AI Recommendations based on University
      if (user?.university) {
        const { data: recommendedBooks } = await supabase
          .from('books')
          .select('id, title, price, book_images(image_url)')
          .eq('university', user.university)
          .limit(3);
        
        const { data: recommendedNotes } = await supabase
          .from('notes')
          .select('id, title, price')
          .eq('university', user.university)
          .limit(3);

        const recs = [
          ...(recommendedBooks || []).map(b => ({ ...b, type: 'book', image_url: b.book_images?.[0]?.image_url })),
          ...(recommendedNotes || []).map(n => ({ ...n, type: 'note' }))
        ];
        setRecommendedItems(recs);
      }

      setLoading(false);
    };
    fetchData();
  }, [user]);

  return (
    <div className="page-container animate-in">
      {/* Hero */}
      <section className="hero">
        <div className="hero-title">{t('home.welcome')} 🎓</div>
        <p className="hero-subtitle">{t('home.subtitle')}</p>
        <div className="hero-actions">
          {!user && (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">{t('nav.register')}</Link>
              <Link to="/books" className="btn btn-secondary btn-lg">{t('home.cta')}</Link>
            </>
          )}
          {user && (
            <Link to="/books/new" className="btn btn-primary btn-lg">+ {t('common.add')} {t('nav.books')}</Link>
          )}
        </div>
      </section>

      {/* AI Assistant Section */}
      {user && (
        <section className="section animate-in" style={{ animationDelay: '0.1s' }}>
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.15), rgba(0, 0, 0, 0.8))',
            border: '1px solid var(--accent-glow)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>✨</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{i18n.language === 'ar' ? 'مساعد سند الذكي' : 'Sanad AI Assistant'}</h3>
            </div>
            {aiLoading ? (
              <div className="loading-text" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t('common.loading')}</div>
            ) : aiTip ? (
              <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-white)' }}>{aiTip}</p>
            ) : null}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{user.university}</span>
              <span className="badge badge-new" style={{ fontSize: '0.7rem' }}>{user.faculty}</span>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">{i18n.language === 'ar' ? 'الأقسام' : 'Categories'}</h2>
        </div>
        <div className="category-grid">
          {categories.map((cat) => (
            <Link to={cat.to} key={cat.to} className="category-card">
              <div className="category-icon">{cat.icon}</div>
              <div className="category-name">{cat.name}</div>
              <div className="category-desc">{cat.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* AI Recommendations */}
      {user && recommendedItems.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">{i18n.language === 'ar' ? 'مقترح لك في ' : 'Recommended for you at '}{user.university}</h2>
          </div>
          <div className="grid grid-3">
            {recommendedItems.map((item) => (
              <Link key={`${item.type}-${item.id}`} to={`/${item.type}s/${item.id}`} className="card" style={{ textDecoration: 'none' }}>
                {item.image_url
                  ? <img src={item.image_url} alt={item.title} className="card-img" />
                  : <div className="card-img-placeholder">{item.type === 'book' ? '📚' : '📝'}</div>
                }
                <div className="card-body">
                  <div className="card-title">{item.title}</div>
                  <div className="card-price">{item.price} {t('common.currency')}</div>
                  <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>{item.type === 'book' ? t('nav.books') : t('nav.notes')}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending Books */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">{i18n.language === 'ar' ? 'الكتب الرائجة' : 'Trending Books'}</h2>
          <Link to="/books" className="section-link">{i18n.language === 'ar' ? 'عرض الكل ←' : 'View All ←'}</Link>
        </div>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <span className="loading-text">{t('common.loading')}</span>
          </div>
        ) : trendingBooks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <div className="empty-state-title">{i18n.language === 'ar' ? 'لا توجد كتب بعد' : 'No books found'}</div>
          </div>
        ) : (
          <div className="grid grid-3">
            {trendingBooks.map((book) => (
              <Link key={book.id} to={`/books/${book.id}`} className="card" style={{ textDecoration: 'none' }}>
                {book.image_url
                  ? <img src={book.image_url} alt={book.title} className="card-img" />
                  : <div className="card-img-placeholder">📚</div>
                }
                <div className="card-body">
                  <div className="card-title">{book.title}</div>
                  <div className="card-price">{book.price} {t('common.currency')}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Top Tutors */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">{i18n.language === 'ar' ? 'أعلى المدرسين تقييمًا' : 'Top Rated Tutors'}</h2>
          <Link to="/tutors" className="section-link">{i18n.language === 'ar' ? 'عرض الكل ←' : 'View All ←'}</Link>
        </div>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : topTutors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎓</div>
            <div className="empty-state-title">{i18n.language === 'ar' ? 'لا يوجد مدرسون بعد' : 'No tutors found'}</div>
          </div>
        ) : (
          <div className="grid grid-3">
            {topTutors.map((tutor) => (
              <Link key={tutor.id} to={`/tutors/${tutor.id}`} className="card" style={{ textDecoration: 'none' }}>
                {tutor.image_url
                  ? <img src={tutor.image_url} alt="صورة المدرس" className="card-img" />
                  : <div className="card-img-placeholder">🎓</div>
                }
                <div className="card-body">
                  <div className="card-title">{tutor.subjects || (i18n.language === 'ar' ? 'مدرس' : 'Tutor')}</div>
                  {tutor.price_per_hour && (
                    <div className="card-price">{tutor.price_per_hour} {t('common.currency')}/{i18n.language === 'ar' ? 'ساعة' : 'hr'}</div>
                  )}
                  <div className="rating mt-1">
                    {'⭐'.repeat(Math.round(tutor.rating_avg))}
                    <span className="rating-value">({tutor.rating_avg})</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Latest Housing */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">{i18n.language === 'ar' ? 'أحدث السكن' : 'Latest Housing'}</h2>
          <Link to="/housing" className="section-link">{i18n.language === 'ar' ? 'عرض الكل ←' : 'View All ←'}</Link>
        </div>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : nearbyHousing.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏠</div>
            <div className="empty-state-title">{i18n.language === 'ar' ? 'لا يوجد سكن بعد' : 'No housing found'}</div>
          </div>
        ) : (
          <div className="grid grid-3">
            {nearbyHousing.map((h) => (
              <Link key={h.id} to={`/housing/${h.id}`} className="card" style={{ textDecoration: 'none' }}>
                <div className="card-img-placeholder">🏠</div>
                <div className="card-body">
                  <div className="card-title">{h.title}</div>
                  <div className="card-price">{h.price} {t('common.currency')}</div>
                  <div className="card-meta">🛏 {h.rooms} {i18n.language === 'ar' ? 'غرف' : 'Rooms'}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
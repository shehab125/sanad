import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Book {
  id: string;
  user_id: string;
  title: string;
  subject: string | null;
  university: string | null;
  price: number;
  condition: string | null;
  description: string | null;
  created_at: string;
}

interface Image { image_url: string; }
interface SellerProfile {
  id: string;
  full_name: string | null;
  university: string | null;
  faculty: string | null;
  avatar_url: string | null;
}

const BookDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavourite, setIsFavourite] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('books')
        .select('*, book_images(image_url), profiles(full_name, university, faculty, avatar_url)')
        .eq('id', id)
        .single();
      if (error) { setError(error.message); }
      if (data) {
        const { book_images, profiles, ...rest } = data as any;
        setBook(rest as Book);
        setImages(book_images as Image[]);
        setSeller(profiles as SellerProfile);
      }
      if (user) {
        const { data: favData } = await supabase
          .from('favorites').select('*')
          .eq('user_id', user.id).eq('item_type', 'book').eq('item_id', id);
        setIsFavourite((favData || []).length > 0);
      }
      setLoading(false);
    };
    fetchData();
  }, [id, user]);

  const handleFavourite = async () => {
    if (!user || !book) return;
    if (isFavourite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('item_type', 'book').eq('item_id', book.id);
      setIsFavourite(false);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, item_type: 'book', item_id: book.id });
      setIsFavourite(true);
    }
  };

  const handleChat = async () => {
    if (!user || !book) return;
    let { data } = await supabase.from('conversations').select('*')
      .or(`user_one.eq.${user.id},user_two.eq.${user.id}`)
      .or(`user_one.eq.${book.user_id},user_two.eq.${book.user_id}`);
    let convo = data?.find((c: any) =>
      (c.user_one === user.id && c.user_two === book.user_id) ||
      (c.user_two === user.id && c.user_one === book.user_id)
    );
    if (!convo) {
      const { data: newConvo } = await supabase.from('conversations')
        .insert({ user_one: user.id, user_two: book.user_id }).select().single();
      convo = newConvo;
    }
    navigate('/chat');
  };

  if (loading) return (
    <div className="page-container">
      <div className="loading-container">
        <div className="spinner"></div>
        <span className="loading-text">جاري التحميل...</span>
      </div>
    </div>
  );

  if (error || !book) return (
    <div className="page-container">
      <div className="alert alert-error">حدث خطأ: {error || 'الكتاب غير موجود'}</div>
    </div>
  );

  return (
    <div className="detail-page animate-in">
      {/* Images */}
      {images.length > 0 ? (
        <div className="detail-images">
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
            {images.map((img, idx) => (
              <img key={idx} src={img.image_url} alt="صورة الكتاب"
                style={{ flex: '0 0 auto', width: images.length > 1 ? '50%' : '100%', maxHeight: '420px', objectFit: 'cover' }} />
            ))}
          </div>
        </div>
      ) : (
        <div className="card-img-placeholder" style={{ height: '300px', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>📚</div>
      )}

      {/* Info */}
      <div className="detail-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 className="detail-title">{book.title}</h1>
          <div className="detail-price">{book.price} جنيه</div>
        </div>

        <div className="detail-meta-row">
          {book.condition && (
            <span className="detail-meta-item">
              <span className={`badge ${book.condition === 'new' ? 'badge-new' : 'badge-used'}`}>
                {book.condition === 'new' ? '✨ جديد' : '📖 مستعمل'}
              </span>
            </span>
          )}
          {book.subject && <span className="detail-meta-item">📖 {book.subject}</span>}
          {book.university && <span className="detail-meta-item">🏛 {book.university}</span>}
        </div>

        {seller && (
          <div className="detail-meta-item" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
            👤 البائع: <strong style={{ color: 'var(--text-white)', marginRight: '0.3rem' }}>{seller.full_name || 'مستخدم'}</strong>
          </div>
        )}

        {book.description && (
          <div className="detail-description">{book.description}</div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {user && user.id !== book.user_id && (
            <button className="btn btn-primary" onClick={handleChat}>💬 تواصل مع البائع</button>
          )}
          {user && (
            <button
              className={isFavourite ? 'btn btn-danger' : 'btn btn-secondary'}
              onClick={handleFavourite}
            >
              {isFavourite ? '💔 إزالة من المفضلة' : '❤️ أضف للمفضلة'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
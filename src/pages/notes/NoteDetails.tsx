import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import supabase from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Note {
  id: string;
  user_id: string;
  title: string;
  subject: string | null;
  university: string | null;
  description: string | null;
  pdf_url: string;
  pages_count: number;
  price: number;
  rating_avg: number;
  created_at: string;
}

const NoteDetails: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [isFavourite, setIsFavourite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      if (!id) return;
      const { data, error } = await supabase.from('notes').select('*').eq('id', id).single();
      if (error) setError(error.message);
      if (data) setNote(data as Note);
      if (user) {
        const { data: fav } = await supabase.from('favorites').select('*').eq('user_id', user.id).eq('item_type', 'note').eq('item_id', id);
        setIsFavourite((fav || []).length > 0);
      }
      setLoading(false);
    };
    fetchNote();
  }, [id, user]);

  const handleFavourite = async () => {
    if (!user || !note) return;
    if (isFavourite) { await supabase.from('favorites').delete().eq('user_id', user.id).eq('item_type', 'note').eq('item_id', note.id); setIsFavourite(false); }
    else { await supabase.from('favorites').insert({ user_id: user.id, item_type: 'note', item_id: note.id }); setIsFavourite(true); }
  };

  if (loading) return (
    <div className="page-container"><div className="loading-container"><div className="spinner"></div><span className="loading-text">جاري التحميل...</span></div></div>
  );
  if (!note || error) return (
    <div className="page-container"><div className="alert alert-error">حدث خطأ: {error || 'الملخص غير موجود'}</div></div>
  );

  return (
    <div className="detail-page animate-in">
      {/* Preview icon */}
      <div className="card-img-placeholder" style={{ height: '200px', borderRadius: 'var(--radius-lg)', marginBottom: '2rem', fontSize: '5rem' }}>📝</div>

      <div className="detail-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 className="detail-title">{note.title}</h1>
          <div className="detail-price">{note.price || 0} جنيه</div>
        </div>

        <div className="detail-meta-row">
          {note.subject && <span className="detail-meta-item">📖 {note.subject}</span>}
          {note.university && <span className="detail-meta-item">🏛 {note.university}</span>}
          <span className="detail-meta-item">📄 {note.pages_count} صفحة</span>
        </div>

        <div className="rating" style={{ marginBottom: '1rem' }}>
          {'⭐'.repeat(Math.min(Math.round(note.rating_avg), 5))}
          <span className="rating-value">({note.rating_avg})</span>
        </div>

        {note.description && (
          <div className="detail-description">{note.description}</div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <a href={note.pdf_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            📥 تحميل / عرض الملف
          </a>
          {user && (
            <button className={isFavourite ? 'btn btn-danger' : 'btn btn-secondary'} onClick={handleFavourite}>
              {isFavourite ? '💔 إزالة من المفضلة' : '❤️ أضف للمفضلة'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteDetails;
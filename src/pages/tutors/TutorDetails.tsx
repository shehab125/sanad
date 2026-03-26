import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Tutor {
  id: string;
  user_id: string;
  bio: string | null;
  subjects: string | null;
  price_per_hour: number | null;
  rating_avg: number;
  image_url: string | null;
  university: string | null;
  faculty: string | null;
  created_at: string;
}

const TutorDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [isFavourite, setIsFavourite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutor = async () => {
      if (!id) return;
      const { data, error } = await supabase.from('tutors').select('*').eq('id', id).single();
      if (!error && data) setTutor(data as Tutor);
      if (user) {
        const { data: fav } = await supabase.from('favorites').select('*').eq('user_id', user.id).eq('item_type', 'tutor').eq('item_id', id);
        setIsFavourite((fav || []).length > 0);
      }
      setLoading(false);
    };
    fetchTutor();
  }, [id, user]);

  const handleFavourite = async () => {
    if (!user || !tutor) return;
    if (isFavourite) { await supabase.from('favorites').delete().eq('user_id', user.id).eq('item_type', 'tutor').eq('item_id', tutor.id); setIsFavourite(false); }
    else { await supabase.from('favorites').insert({ user_id: user.id, item_type: 'tutor', item_id: tutor.id }); setIsFavourite(true); }
  };

  const handleBook = () => { if (tutor) navigate(`/tutors/${tutor.id}/book`); };

  const handleChat = async () => {
    if (!user || !tutor) return;
    let { data } = await supabase.from('conversations').select('*').or(`user_one.eq.${user.id},user_two.eq.${user.id}`).or(`user_one.eq.${tutor.user_id},user_two.eq.${tutor.user_id}`);
    let convo = data?.find((c: any) => (c.user_one === user.id && c.user_two === tutor.user_id) || (c.user_two === user.id && c.user_one === tutor.user_id));
    if (!convo) { const { data: nc } = await supabase.from('conversations').insert({ user_one: user.id, user_two: tutor.user_id }).select().single(); convo = nc; }
    navigate('/chat');
  };

  if (loading) return (
    <div className="page-container"><div className="loading-container"><div className="spinner"></div><span className="loading-text">جاري التحميل...</span></div></div>
  );
  if (!tutor) return (
    <div className="page-container"><div className="alert alert-error">المدرس غير موجود</div></div>
  );

  return (
    <div className="detail-page animate-in">
      {tutor.image_url
        ? <div className="detail-images"><img src={tutor.image_url} alt="صورة المدرس" style={{ width: '100%', maxHeight: '380px', objectFit: 'cover' }} /></div>
        : <div className="card-img-placeholder" style={{ height: '280px', borderRadius: 'var(--radius-lg)', marginBottom: '2rem', fontSize: '5rem' }}>🎓</div>
      }

      <div className="detail-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 className="detail-title">{tutor.subjects || 'مدرس'}</h1>
          {tutor.price_per_hour && <div className="detail-price">{tutor.price_per_hour} جنيه/ساعة</div>}
        </div>

        <div className="detail-meta-row">
          {tutor.university && <span className="detail-meta-item">🏛 {tutor.university}</span>}
          {tutor.faculty && <span className="detail-meta-item">📖 {tutor.faculty}</span>}
        </div>

        <div className="rating" style={{ marginBottom: '1rem' }}>
          {'⭐'.repeat(Math.min(Math.round(tutor.rating_avg), 5))}
          <span className="rating-value">({tutor.rating_avg})</span>
        </div>

        {tutor.bio && (
          <div className="detail-description">{tutor.bio}</div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {user && user.id !== tutor.user_id && (
            <>
              <button className="btn btn-primary" onClick={handleBook}>📅 احجز جلسة</button>
              <button className="btn btn-secondary" onClick={handleChat}>💬 تواصل</button>
            </>
          )}
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

export default TutorDetails;
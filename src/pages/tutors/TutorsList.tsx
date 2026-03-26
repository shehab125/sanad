import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../../supabaseClient';

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

const TutorsList: React.FC = () => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutors = async () => {
      const { data, error } = await supabase.from('tutors').select('*').order('rating_avg', { ascending: false });
      if (!error && data) setTutors(data as Tutor[]);
      setLoading(false);
    };
    fetchTutors();
  }, []);

  if (loading) return (
    <div className="page-container">
      <div className="loading-container"><div className="spinner"></div><span className="loading-text">جاري التحميل...</span></div>
    </div>
  );

  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🎓 المدرسين</h1>
          <p className="page-subtitle">احجز مدرسًا متميزًا في مجالك</p>
        </div>
      </div>
      {tutors.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎓</div>
          <div className="empty-state-title">لا يوجد مدرسون بعد</div>
        </div>
      ) : (
        <div className="grid grid-3">
          {tutors.map((tutor) => (
            <Link key={tutor.id} to={`/tutors/${tutor.id}`} className="card" style={{ textDecoration: 'none' }}>
              {tutor.image_url
                ? <img src={tutor.image_url} alt="Tutor" className="card-img" />
                : <div className="card-img-placeholder">🎓</div>
              }
              <div className="card-body">
                <div className="card-title">{tutor.subjects || 'مدرس'}</div>
                {tutor.price_per_hour && <div className="card-price">{tutor.price_per_hour} جنيه/ساعة</div>}
                <div className="card-meta d-flex gap-1" style={{ marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {tutor.university && <span className="badge badge-accent">{tutor.university}</span>}
                </div>
                <div className="rating mt-1">
                  {'⭐'.repeat(Math.min(Math.round(tutor.rating_avg), 5))}
                  <span className="rating-value">({tutor.rating_avg})</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TutorsList;
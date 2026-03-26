import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const TutorBooking: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!user) return (
    <div className="page-container"><div className="empty-state"><div className="empty-state-icon">🔒</div><div className="empty-state-title">يجب تسجيل الدخول للحجز</div></div></div>
  );
  if (!id) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;
    setLoading(true);
    const { error } = await supabase.from('tutor_bookings').insert({ tutor_id: id, student_id: user.id, booking_date: date, booking_time: time, notes: notes || null });
    if (error) { alert(error.message); setLoading(false); return; }
    setLoading(false);
    setSuccess(true);
    setTimeout(() => navigate('/tutors'), 2500);
  };

  if (success) return (
    <div className="auth-page">
      <div className="auth-card animate-in" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ color: 'var(--text-white)', marginBottom: '0.5rem' }}>تم الحجز بنجاح!</h2>
        <p style={{ color: 'var(--text-muted)' }}>سيتم تحويلك لصفحة المدرسين...</p>
      </div>
    </div>
  );

  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <div><h1 className="page-title">📅 حجز جلسة</h1><p className="page-subtitle">احجز موعدًا مع المدرس</p></div>
      </div>
      <div style={{ maxWidth: '540px' }}>
        <div className="auth-card" style={{ maxWidth: '100%' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>التاريخ *</label>
              <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group">
              <label>الوقت *</label>
              <input type="time" className="form-control" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>ملاحظات</label>
              <textarea className="form-control" placeholder="أي ملاحظات أو طلبات خاصة..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? '⏳ جاري الحجز...' : '📅 تأكيد الحجز'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TutorBooking;
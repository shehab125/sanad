import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../../supabaseClient';

interface Note {
  id: string;
  title: string;
  subject: string | null;
  university: string | null;
  pages_count: number;
  price: number;
  rating_avg: number;
  created_at: string;
}

const NotesList: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      const { data, error } = await supabase.from('notes').select('*').order('created_at', { ascending: false });
      if (!error && data) setNotes(data as Note[]);
      setLoading(false);
    };
    fetchNotes();
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
          <h1 className="page-title">📝 الملخصات</h1>
          <p className="page-subtitle">تصفح وشارك الملخصات الدراسية</p>
        </div>
        <Link to="/notes/new" className="btn btn-primary">+ رفع ملخص</Link>
      </div>
      {notes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-title">لا توجد ملخصات بعد</div>
        </div>
      ) : (
        <div className="grid grid-3">
          {notes.map((note) => (
            <Link key={note.id} to={`/notes/${note.id}`} className="card" style={{ textDecoration: 'none' }}>
              <div className="card-img-placeholder">📝</div>
              <div className="card-body">
                <div className="card-title">{note.title}</div>
                <div className="card-price">{note.price || 0} جنيه</div>
                <div className="card-meta d-flex gap-1" style={{ marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {note.university && <span className="badge badge-accent">{note.university}</span>}
                  <span className="badge badge-gold">📄 {note.pages_count} صفحة</span>
                </div>
                <div className="rating mt-1">
                  {'⭐'.repeat(Math.min(Math.round(note.rating_avg), 5))}
                  <span className="rating-value">({note.rating_avg})</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesList;
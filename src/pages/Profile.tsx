import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../supabaseClient';
import { EGYPTIAN_UNIVERSITIES } from '../data/universities';

interface Listing {
  id: string;
  title: string;
  price: number;
  table: string;
}

interface Booking {
  id: string;
  tutor_id: string;
  booking_date: string;
  booking_time: string;
  status: string;
}

const tableIcons: Record<string, string> = {
  books: '📚',
  notes: '📝',
  tools: '🧰',
  housing: '🏠',
};

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');
  const [faculty, setFaculty] = useState('');
  const [phone, setPhone] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [favourites, setFavourites] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFullName(user.full_name || '');
    setUniversity(user.university || '');
    setFaculty(user.faculty || '');
    setPhone(user.phone || '');
    const fetchData = async () => {
      if (!user) return;
      const [booksRes, notesRes, toolsRes, housingRes] = await Promise.all([
        supabase.from('books').select('id, title, price').eq('user_id', user.id),
        supabase.from('notes').select('id, title, price').eq('user_id', user.id),
        supabase.from('tools').select('id, title, price').eq('user_id', user.id),
        supabase.from('housing').select('id, title, price').eq('user_id', user.id),
      ]);
      const listingsArr: Listing[] = [];
      booksRes.data?.forEach((b) => listingsArr.push({ ...b, table: 'books' } as any));
      notesRes.data?.forEach((n) => listingsArr.push({ ...n, table: 'notes' } as any));
      toolsRes.data?.forEach((t) => listingsArr.push({ ...t, table: 'tools' } as any));
      housingRes.data?.forEach((h) => listingsArr.push({ ...h, table: 'housing' } as any));
      setListings(listingsArr);
      const { data: favs } = await supabase.from('favorites').select('*').eq('user_id', user.id);
      const favItems: Listing[] = [];
      if (favs) {
        for (const fav of favs) {
          const table = fav.item_type + 's';
          const { data } = await supabase.from(table).select('id, title, price').eq('id', fav.item_id).single();
          if (data) favItems.push({ ...data, table: table } as any);
        }
      }
      setFavourites(favItems);
      const { data: bookingData } = await supabase.from('tutor_bookings').select('*').eq('student_id', user.id);
      setBookings((bookingData as Booking[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (!user) return null;
  if (loading) return (
    <div className="page-container">
      <div className="loading-container">
        <div className="spinner"></div>
        <span className="loading-text">جاري تحميل الملف الشخصي...</span>
      </div>
    </div>
  );

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ full_name: fullName, university, faculty, phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const initials = fullName
    ? fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')
    : user.email[0].toUpperCase();

  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <h1 className="page-title">👤 الملف الشخصي</h1>
      </div>

      <div className="profile-grid">
        {/* Sidebar */}
        <aside className="profile-aside">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-name">{fullName || 'مستخدم'}</div>
          <div className="profile-email">{user.email}</div>
          {university && <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>🏛 {university}</p>}
          {faculty && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📖 {faculty}</p>}

          <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>إحصائياتي</div>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-light)' }}>{listings.length}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>إعلانات</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--gold)' }}>{favourites.length}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>مفضلة</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--success)' }}>{bookings.length}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>حجوزات</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div>
          {/* Edit Form */}
          <div className="profile-form mb-2">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem', fontWeight: 700 }}>✏️ تعديل البيانات</h3>
            {saved && <div className="alert alert-success">✅ تم حفظ التعديلات بنجاح!</div>}
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>الاسم</label>
                <input type="text" className="form-control" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>الجامعة</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={university} 
                  onChange={(e) => setUniversity(e.target.value)} 
                  list="profile-uni-list"
                />
                <datalist id="profile-uni-list">
                  {EGYPTIAN_UNIVERSITIES.map((uni, idx) => (
                    <option key={idx} value={uni} />
                  ))}
                </datalist>
              </div>
              <div className="form-group">
                <label>الكلية</label>
                <input type="text" className="form-control" value={faculty} onChange={(e) => setFaculty(e.target.value)} />
              </div>
              <div className="form-group">
                <label>رقم الهاتف</label>
                <input type="tel" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary">💾 حفظ التعديلات</button>
            </form>
          </div>

          {/* Listings */}
          <div className="profile-form mb-2">
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 700 }}>🏷️ إعلاناتي ({listings.length})</h3>
            {listings.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem' }}>
                <div className="empty-state-icon">📭</div>
                <div className="empty-state-title">لا توجد إعلانات بعد</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {listings.map((item) => (
                  <div key={`${item.table}-${item.id}`} className="notification-item">
                    <div className="notification-icon">{tableIcons[item.table] || '📦'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-white)', fontSize: '0.9rem' }}>{item.title}</div>
                      <div style={{ color: 'var(--gold)', fontSize: '0.85rem', marginTop: '0.2rem' }}>{item.price} جنيه</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Favourites */}
          <div className="profile-form mb-2">
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 700 }}>❤️ المفضلة ({favourites.length})</h3>
            {favourites.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem' }}>
                <div className="empty-state-icon">🤍</div>
                <div className="empty-state-title">لا توجد عناصر مفضلة</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {favourites.map((item) => (
                  <div key={`${item.table}-${item.id}`} className="notification-item">
                    <div className="notification-icon">❤️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-white)', fontSize: '0.9rem' }}>{item.title}</div>
                      <div style={{ color: 'var(--gold)', fontSize: '0.85rem', marginTop: '0.2rem' }}>{item.price} جنيه</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bookings */}
          <div className="profile-form">
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 700 }}>📅 حجوزاتي ({bookings.length})</h3>
            {bookings.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem' }}>
                <div className="empty-state-icon">📅</div>
                <div className="empty-state-title">لا توجد حجوزات</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {bookings.map((b) => (
                  <div key={b.id} className="notification-item">
                    <div className="notification-icon">🎓</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-white)', fontSize: '0.9rem' }}>
                        {b.booking_date} – {b.booking_time}
                      </div>
                      <div style={{ marginTop: '0.2rem' }}>
                        <span className={`badge ${b.status === 'confirmed' ? 'badge-new' : b.status === 'pending' ? 'badge-used' : 'badge-accent'}`}>
                          {b.status === 'confirmed' ? 'مؤكد' : b.status === 'pending' ? 'في الانتظار' : b.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
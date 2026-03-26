import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../../supabaseClient';

interface Housing {
  id: string;
  title: string;
  address: string;
  price: number;
  rooms: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

const HousingList: React.FC = () => {
  const [list, setList] = useState<Housing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHousing = async () => {
      const { data, error } = await supabase.from('housing').select('*').order('created_at', { ascending: false });
      if (!error && data) setList(data as Housing[]);
      setLoading(false);
    };
    fetchHousing();
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
          <h1 className="page-title">🏠 السكن</h1>
          <p className="page-subtitle">ابحث عن غرف وشقق قريبة منك</p>
        </div>
        <Link to="/housing/new" className="btn btn-primary">+ أضف إعلانًا</Link>
      </div>
      {list.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏠</div>
          <div className="empty-state-title">لا يوجد سكن متاح بعد</div>
        </div>
      ) : (
        <div className="grid grid-3">
          {list.map((item) => (
            <Link key={item.id} to={`/housing/${item.id}`} className="card" style={{ textDecoration: 'none' }}>
              <div className="card-img-placeholder">🏠</div>
              <div className="card-body">
                <div className="card-title">{item.title}</div>
                <div className="card-price">{item.price} جنيه/شهر</div>
                <div className="card-meta d-flex gap-1" style={{ marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-accent">🛏 {item.rooms} غرف</span>
                </div>
                <div className="card-meta" style={{ marginTop: '0.3rem' }}>
                  📍 {item.address}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default HousingList;
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface Housing {
  id: string;
  user_id: string;
  title: string;
  address: string;
  price: number;
  rooms: number;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

interface Image { image_url: string; }

const HousingDetails: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [housing, setHousing] = useState<Housing | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [isFavourite, setIsFavourite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHousing = async () => {
      if (!id) return;
      const { data, error } = await supabase.from('housing').select('*, housing_images(image_url)').eq('id', id).single();
      if (!error && data) { 
        const { housing_images, ...rest } = data as any; 
        setHousing(rest as Housing); 
        setImages(housing_images as Image[]); 
      }
      if (user) { 
        const { data: fav } = await supabase.from('favorites').select('*').eq('user_id', user.id).eq('item_type', 'housing').eq('item_id', id); 
        setIsFavourite((fav || []).length > 0); 
      }
      setLoading(false);
    };
    fetchHousing();
  }, [id, user]);

  const handleFavourite = async () => {
    if (!user || !housing) return;
    if (isFavourite) { 
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('item_type', 'housing').eq('item_id', housing.id); 
      setIsFavourite(false); 
    } else { 
      await supabase.from('favorites').insert({ user_id: user.id, item_type: 'housing', item_id: housing.id }); 
      setIsFavourite(true); 
    }
  };

  const handleChat = async () => {
    if (!user || !housing) return;
    let { data } = await supabase.from('conversations').select('*').or(`user_one.eq.${user.id},user_two.eq.${user.id}`).or(`user_one.eq.${housing.user_id},user_two.eq.${housing.user_id}`);
    let convo = data?.find((c: any) => (c.user_one === user.id && c.user_two === housing.user_id) || (c.user_two === user.id && c.user_one === housing.user_id));
    if (!convo) { 
      const { data: nc } = await supabase.from('conversations').insert({ user_one: user.id, user_two: housing.user_id }).select().single(); 
      convo = nc; 
    }
    navigate('/chat');
  };

  if (loading) return (<div className="page-container"><div className="loading-container"><div className="spinner"></div><span className="loading-text">جاري التحميل...</span></div></div>);
  if (!housing) return (<div className="page-container"><div className="alert alert-error">السكن غير موجود</div></div>);

  return (
    <div className="detail-page animate-in">
      {images.length > 0 ? (
        <div className="detail-images">
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
            {images.map((img, idx) => (
              <img key={idx} src={img.image_url} alt="صورة السكن" style={{ flex: '0 0 auto', width: images.length > 1 ? '50%' : '100%', maxHeight: '400px', objectFit: 'cover' }} />
            ))}
          </div>
        </div>
      ) : (
        <div className="card-img-placeholder" style={{ height: '280px', borderRadius: 'var(--radius-lg)', marginBottom: '2rem', fontSize: '5rem' }}>🏠</div>
      )}

      <div className="detail-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 className="detail-title">{housing.title}</h1>
          <div className="detail-price">{housing.price} جنيه/شهر</div>
        </div>

        <div className="detail-meta-row" style={{ marginBottom: '1.5rem' }}>
          <span className="detail-meta-item">📍 {housing.address}</span>
          <span className="detail-meta-item">🛏 {housing.rooms} غرف</span>
        </div>

        {housing.description && <div className="detail-description">{housing.description}</div>}

        {/* Map Preview */}
        {housing.latitude && housing.longitude && (
          <div className="form-group" style={{ marginTop: '2.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <label style={{ margin: 0, fontWeight: 700, color: 'var(--text-white)' }}>🗺 موقع السكن</label>
              <a href={`https://maps.google.com/?q=${housing.latitude},${housing.longitude}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>فتح في خرائط جوجل ↗</a>
            </div>
            <div style={{ height: '350px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <MapContainer center={[housing.latitude, housing.longitude]} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                <Marker position={[housing.latitude, housing.longitude]} />
              </MapContainer>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
          {user && user.id !== housing.user_id && <button className="btn btn-primary" onClick={handleChat}>💬 تواصل مع المالك</button>}
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

export default HousingDetails;
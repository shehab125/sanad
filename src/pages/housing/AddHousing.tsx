import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
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

const LocationMarker = ({ position, setPosition }: { position: [number, number] | null, setPosition: (p: [number, number] | null) => void }) => {
  const map = useMap();

  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      setPosition([e.latlng.lat, e.latlng.lng]);
    };
    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, setPosition]);

  return position === null ? null : <Marker position={position} />;
};

const AddHousing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [rooms, setRooms] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [mapCenter] = useState<[number, number]>([30.0444, 31.2357]); // Cairo

  if (!user) return (
    <div className="page-container">
      <div className="empty-state">
        <div className="empty-state-icon">🔒</div>
        <div className="empty-state-title">يجب تسجيل الدخول لإضافة سكن</div>
      </div>
    </div>
  );

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !address || !price || !rooms) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('housing')
      .insert({
        user_id: user.id,
        title,
        address,
        price: Number(price),
        rooms: Number(rooms),
        description: description || null,
        latitude: position ? position[0] : null,
        longitude: position ? position[1] : null,
      })
      .select()
      .single();

    if (error || !data) {
      alert(error?.message || 'خطأ في إضافة السكن');
      setLoading(false);
      return;
    }

    const housingId = data.id;
    if (files && files.length > 0) {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string);
        try {
          const response = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`, {
            method: 'POST',
            body: formData,
          });
          const result = await response.json();
          if (!response.ok) {
            console.error('Cloudinary Upload Error:', result);
            alert(`خطأ في رفع الصورة: ${result.error?.message || 'مشكلة في الإعدادات'}`);
            continue;
          }
          if (result.secure_url) uploadedUrls.push(result.secure_url);
        } catch (err) {
          console.error('Upload error', err);
        }
      }
      if (uploadedUrls.length > 0) {
        await supabase.from('housing_images').insert(uploadedUrls.map((url) => ({ housing_id: housingId, image_url: url })));
      }
    }

    setLoading(false);
    navigate(`/housing/${housingId}`);
  };

  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏠 إضافة سكن جديد</h1>
          <p className="page-subtitle">أضف إعلان سكن للطلاب</p>
        </div>
      </div>

      <div style={{ maxWidth: '800px' }}>
        <div className="auth-card" style={{ maxWidth: '100%' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>اسم الإعلان *</label>
                <input type="text" className="form-control" placeholder="مثل: شقة بالقرب من الجامعة" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>العنوان *</label>
                <input type="text" className="form-control" placeholder="العنوان التفصيلي" value={address} onChange={(e) => setAddress(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>السعر الشهري (جنيه) *</label>
                <input type="number" className="form-control" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')} required />
              </div>
              <div className="form-group">
                <label>عدد الغرف *</label>
                <input type="number" className="form-control" placeholder="1" value={rooms} onChange={(e) => setRooms(e.target.value ? Number(e.target.value) : '')} required />
              </div>
            </div>

            <div className="form-group">
              <label>الوصف</label>
              <textarea className="form-control" placeholder="اكتب وصفًا للسكن..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ minHeight: '100px' }} />
            </div>

            {/* Map Picker */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <label style={{ margin: 0 }}>موقع السكن على الخريطة</label>
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleGetCurrentLocation} style={{ fontSize: '0.75rem' }}>📍 استخدام موقعي الحالي</button>
              </div>
              <div style={{ height: '300px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                  <LocationMarker position={position} setPosition={setPosition} />
                </MapContainer>
              </div>
              <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>انقر على الخريطة لتحديد الموقع بدقة</p>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label>صور السكن</label>
              <div className="file-input-wrapper">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={(e) => {
                    const selectedFiles = e.target.files;
                    setFiles(selectedFiles);
                    if (selectedFiles) {
                      // Revoke old previews to avoid memory leaks
                      previews.forEach(url => URL.revokeObjectURL(url));
                      const newPreviews = Array.from(selectedFiles).map(f => URL.createObjectURL(f));
                      setPreviews(newPreviews);
                    }
                  }} 
                />
                <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>يمكنك رفع أكثر من صورة</p>
                {previews.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', overflowX: 'auto', padding: '0.5rem 0' }}>
                    {previews.map((url, i) => (
                      <img key={i} src={url} alt="preview" style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--accent-light)' }} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100" style={{ height: '54px', fontSize: '1.1rem', marginTop: '1rem' }} disabled={loading}>
              {loading ? '⏳ جاري الإضافة...' : '🏠 إضافة السكن'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddHousing;
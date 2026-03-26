import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Tool { id: string; user_id: string; title: string; category: string | null; price: number; condition: string | null; description: string | null; created_at: string; }
interface Image { image_url: string; }
interface SellerProfile { id: string; full_name: string | null; avatar_url: string | null; }

const ToolDetails: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tool, setTool] = useState<Tool | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [isFavourite, setIsFavourite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTool = async () => {
      if (!id) return;
      const { data, error } = await supabase.from('tools').select('*, tool_images(image_url), profiles(full_name, avatar_url)').eq('id', id).single();
      if (!error && data) { const { tool_images, profiles, ...rest } = data as any; setTool(rest as Tool); setImages(tool_images as Image[]); setSeller(profiles as SellerProfile); }
      if (user) { const { data: fav } = await supabase.from('favorites').select('*').eq('user_id', user.id).eq('item_type', 'tool').eq('item_id', id); setIsFavourite((fav || []).length > 0); }
      setLoading(false);
    };
    fetchTool();
  }, [id, user]);

  const handleFavourite = async () => {
    if (!user || !tool) return;
    if (isFavourite) { await supabase.from('favorites').delete().eq('user_id', user.id).eq('item_type', 'tool').eq('item_id', tool.id); setIsFavourite(false); }
    else { await supabase.from('favorites').insert({ user_id: user.id, item_type: 'tool', item_id: tool.id }); setIsFavourite(true); }
  };

  const handleChat = async () => {
    if (!user || !tool) return;
    let { data } = await supabase.from('conversations').select('*').or(`user_one.eq.${user.id},user_two.eq.${user.id}`).or(`user_one.eq.${tool.user_id},user_two.eq.${tool.user_id}`);
    let convo = data?.find((c: any) => (c.user_one === user.id && c.user_two === tool.user_id) || (c.user_two === user.id && c.user_one === tool.user_id));
    if (!convo) { const { data: nc } = await supabase.from('conversations').insert({ user_one: user.id, user_two: tool.user_id }).select().single(); convo = nc; }
    navigate('/chat');
  };

  if (loading) return (<div className="page-container"><div className="loading-container"><div className="spinner"></div><span className="loading-text">جاري التحميل...</span></div></div>);
  if (!tool) return (<div className="page-container"><div className="alert alert-error">المنتج غير موجود</div></div>);

  return (
    <div className="detail-page animate-in">
      {images.length > 0 ? (
        <div className="detail-images">
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
            {images.map((img, idx) => (
              <img key={idx} src={img.image_url} alt="صورة الأداة" style={{ flex: '0 0 auto', width: images.length > 1 ? '50%' : '100%', maxHeight: '400px', objectFit: 'cover' }} />
            ))}
          </div>
        </div>
      ) : (
        <div className="card-img-placeholder" style={{ height: '280px', borderRadius: 'var(--radius-lg)', marginBottom: '2rem', fontSize: '5rem' }}>🧰</div>
      )}

      <div className="detail-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 className="detail-title">{tool.title}</h1>
          <div className="detail-price">{tool.price} جنيه</div>
        </div>

        <div className="detail-meta-row">
          {tool.condition && (
            <span className={`badge ${tool.condition === 'new' ? 'badge-new' : 'badge-used'}`}>
              {tool.condition === 'new' ? '✨ جديد' : '📦 مستعمل'}
            </span>
          )}
          {tool.category && <span className="detail-meta-item">🏷 {tool.category}</span>}
          {seller && <span className="detail-meta-item">👤 {seller.full_name || 'مستخدم'}</span>}
        </div>

        {tool.description && <div className="detail-description">{tool.description}</div>}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {user && user.id !== tool.user_id && <button className="btn btn-primary" onClick={handleChat}>💬 تواصل مع البائع</button>}
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

export default ToolDetails;
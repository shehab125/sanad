import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../../supabaseClient';

interface Tool {
  id: string;
  title: string;
  category: string | null;
  price: number;
  condition: string | null;
  description: string | null;
  created_at: string;
}

interface ToolWithImage extends Tool {
  image_url?: string;
}

const ToolsList: React.FC = () => {
  const [tools, setTools] = useState<ToolWithImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTools = async () => {
      const { data, error } = await supabase.from('tools').select('*, tool_images(image_url)').order('created_at', { ascending: false });
      if (!error && data) {
        const formatted = (data as any[]).map((row) => {
          const { tool_images, ...rest } = row;
          const img = row.tool_images?.[0]?.image_url;
          return { ...rest, image_url: img } as ToolWithImage;
        });
        setTools(formatted);
      }
      setLoading(false);
    };
    fetchTools();
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
          <h1 className="page-title">🧰 الأدوات</h1>
          <p className="page-subtitle">بيع وشراء الأدوات الدراسية</p>
        </div>
        <Link to="/tools/new" className="btn btn-primary">+ أضف أداة</Link>
      </div>
      {tools.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🧰</div>
          <div className="empty-state-title">لا توجد أدوات بعد</div>
        </div>
      ) : (
        <div className="grid grid-3">
          {tools.map((tool) => (
            <Link key={tool.id} to={`/tools/${tool.id}`} className="card" style={{ textDecoration: 'none' }}>
              {tool.image_url
                ? <img src={tool.image_url} alt="Tool" className="card-img" />
                : <div className="card-img-placeholder">🧰</div>
              }
              <div className="card-body">
                <div className="card-title">{tool.title}</div>
                <div className="card-price">{tool.price} جنيه</div>
                <div className="card-meta d-flex gap-1" style={{ marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {tool.condition && (
                    <span className={`badge ${tool.condition === 'new' ? 'badge-new' : 'badge-used'}`}>
                      {tool.condition === 'new' ? 'جديد' : 'مستعمل'}
                    </span>
                  )}
                  {tool.category && <span className="badge badge-accent">{tool.category}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ToolsList;
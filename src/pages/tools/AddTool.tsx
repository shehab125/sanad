import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { EGYPTIAN_UNIVERSITIES } from '../../data/universities';

const AddTool: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [condition, setCondition] = useState('new');
  const [university, setUniversity] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!user) return (
    <div className="page-container">
      <div className="empty-state"><div className="empty-state-icon">🔒</div><div className="empty-state-title">يجب تسجيل الدخول لإضافة أداة</div></div>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) return;
    setLoading(true);
    const { data, error } = await supabase.from('tools').insert({ 
      user_id: user.id, 
      title, 
      category: category || null, 
      university: university || null,
      price: Number(price), 
      condition, 
      description: description || null 
    }).select().single();
    if (error || !data) { alert(error?.message || 'خطأ في إضافة المنتج'); setLoading(false); return; }
    const toolId = data.id;
    if (files && files.length > 0) {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string);
        try {
          const response = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`, { 
            method: 'POST', 
            body: formData 
          });
          const result = await response.json();
          if (!response.ok) {
            console.error('Cloudinary Upload Error:', result);
            alert(`خطأ في رفع الصورة: ${result.error?.message || 'مشكلة في الإعدادات'}`);
            continue;
          }
          if (result.secure_url) uploadedUrls.push(result.secure_url);
        } catch (err) { console.error('Upload error', err); }
      }
      if (uploadedUrls.length > 0) await supabase.from('tool_images').insert(uploadedUrls.map((url) => ({ tool_id: toolId, image_url: url })));
    }
    setLoading(false);
    navigate(`/tools/${toolId}`);
  };

  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <div><h1 className="page-title">🧰 إضافة أداة جديدة</h1><p className="page-subtitle">أضف أداة للبيع في السوق</p></div>
      </div>
      <div style={{ maxWidth: '640px' }}>
        <div className="auth-card" style={{ maxWidth: '100%' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>اسم الأداة *</label><input type="text" className="form-control" placeholder="أدخل اسم الأداة" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
            <div className="form-group"><label>الفئة</label><input type="text" className="form-control" placeholder="مثل: مسطرة، آلة حاسبة..." value={category} onChange={(e) => setCategory(e.target.value)} /></div>
            <div className="form-group"><label>السعر (جنيه) *</label><input type="number" className="form-control" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')} required /></div>
            <div className="form-group">
              <label>الجامعة</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="ابحث عن جامعتك..." 
                value={university} 
                onChange={(e) => setUniversity(e.target.value)} 
                list="add-tool-uni-list"
              />
              <datalist id="add-tool-uni-list">
                {EGYPTIAN_UNIVERSITIES.map((uni, idx) => (
                  <option key={idx} value={uni} />
                ))}
              </datalist>
            </div>
            <div className="form-group"><label>الحالة</label><select className="form-control" value={condition} onChange={(e) => setCondition(e.target.value)}><option value="new">جديد ✨</option><option value="used">مستعمل 📦</option></select></div>
            <div className="form-group"><label>الوصف</label><textarea className="form-control" placeholder="اكتب وصفًا للأداة..." value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div className="form-group">
              <label>صور الأداة</label>
              <div className="file-input-wrapper">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={(e) => {
                    setFiles(e.target.files);
                    if (e.target.files) {
                      setPreviews(Array.from(e.target.files).map(f => URL.createObjectURL(f)));
                    }
                  }} 
                />
                {previews.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', overflowX: 'auto' }}>
                    {previews.map((url, i) => (
                      <img key={i} src={url} alt="preview" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>{loading ? '⏳ جاري الإضافة...' : '🧰 إضافة الأداة'}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTool;
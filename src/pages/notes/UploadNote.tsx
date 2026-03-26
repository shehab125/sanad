import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { EGYPTIAN_UNIVERSITIES } from '../../data/universities';

const UploadNote: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [university, setUniversity] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user) return (
    <div className="page-container">
      <div className="empty-state"><div className="empty-state-icon">🔒</div><div className="empty-state-title">يجب تسجيل الدخول لرفع ملخص</div></div>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) return;
    setLoading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from('notes').upload(filePath, file, { contentType: file.type });
    if (uploadError) { alert(uploadError.message); setLoading(false); return; }
    const { data: publicUrlData } = supabase.storage.from('notes').getPublicUrl(uploadData?.path || '');
    const pdfUrl = publicUrlData.publicUrl;
    const { data: noteData, error } = await supabase.from('notes').insert({ user_id: user.id, title, subject: subject || null, university: university || null, description: description || null, pdf_url: pdfUrl, price: price ? Number(price) : 0 }).select().single();
    if (error || !noteData) { alert(error?.message || 'خطأ في رفع الملخص'); setLoading(false); return; }
    setLoading(false);
    navigate(`/notes/${noteData.id}`);
  };

  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <div><h1 className="page-title">📝 رفع ملخص جديد</h1><p className="page-subtitle">شارك ملخصك مع بقية الطلاب</p></div>
      </div>
      <div style={{ maxWidth: '640px' }}>
        <div className="auth-card" style={{ maxWidth: '100%' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>عنوان الملخص *</label><input type="text" className="form-control" placeholder="أدخل عنوان الملخص" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
            <div className="form-group"><label>المادة</label><input type="text" className="form-control" placeholder="مثل: فيزياء، رياضيات..." value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
            <div className="form-group">
              <label>الجامعة</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="ابحث عن جامعتك..." 
                value={university} 
                onChange={(e) => setUniversity(e.target.value)} 
                list="upload-note-uni-list"
              />
              <datalist id="upload-note-uni-list">
                {EGYPTIAN_UNIVERSITIES.map((uni, idx) => (
                  <option key={idx} value={uni} />
                ))}
              </datalist>
            </div>
            <div className="form-group"><label>السعر (جنيه) – اتركه 0 للمجان</label><input type="number" className="form-control" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')} /></div>
            <div className="form-group"><label>الوصف</label><textarea className="form-control" placeholder="اكتب وصفًا مختصرًا للملخص..." value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div className="form-group">
              <label>ملف PDF *</label>
              <div className="file-input-wrapper">
                <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
                <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>يُقبل ملفات PDF فقط</p>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>{loading ? '⏳ جاري الرفع...' : '📝 رفع الملخص'}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadNote;
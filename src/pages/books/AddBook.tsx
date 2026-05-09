import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { ensureUserProfile } from '../../lib/ensureProfile';
import { EGYPTIAN_UNIVERSITIES } from '../../data/universities';

const AddBook: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [university, setUniversity] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [condition, setCondition] = useState('new');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!user) return (
    <div className="page-container">
      <div className="empty-state">
        <div className="empty-state-icon">🔒</div>
        <div className="empty-state-title">يجب تسجيل الدخول لإضافة كتاب</div>
      </div>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) return;
    setLoading(true);
    setSubmitError(null);

    const { error: profErr } = await ensureUserProfile(supabase, user.id, user.email || '', {
      full_name: user.full_name,
      username: user.username,
    });
    if (profErr) {
      setSubmitError(
        `لا يمكن ربط الكتاب بحسابك: ${profErr.message}. تأكد من وجود صف في جدول profiles أو سياسات الملف الشخصي في Supabase.`
      );
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('books')
      .insert({
        user_id: user.id,
        title,
        subject: subject || null,
        university: university || null,
        price: Number(price),
        condition,
        description: description || null,
      })
      .select()
      .single();
    if (error || !data) {
      setLoading(false);
      setSubmitError(
        error?.message ||
          'تعذر حفظ الكتاب. الأسباب الشائعة: صلاحيات Supabase على جدول books، أو أعمدة ناقصة. انظر ملف supabase_rls_marketplace.sql في المشروع.'
      );
      return;
    }
    const bookId = data.id;
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
          if (result.secure_url) {
            uploadedUrls.push(result.secure_url);
          }
        } catch (err) {
          console.error('Upload error', err);
        }
      }
      if (uploadedUrls.length > 0) {
        const bookImages = uploadedUrls.map((url) => ({ book_id: bookId, image_url: url }));
        const { error: imgError } = await supabase.from('book_images').insert(bookImages);
        if (imgError) {
          console.error('Error saving book images:', imgError);
          alert('تم إضافة الكتاب ولكن حدث خطأ في حفظ الصور: ' + imgError.message);
        }
      }
    }
    setLoading(false);
    navigate(`/books/${bookId}`);
  };

  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📚 إضافة كتاب جديد</h1>
          <p className="page-subtitle">أضف كتابًا للبيع في السوق</p>
        </div>
      </div>

      <div style={{ maxWidth: '640px' }}>
        <div className="auth-card" style={{ maxWidth: '100%' }}>
          {submitError && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              {submitError}
            </div>
          )}
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            بعد الحفظ يظهر الكتاب في{' '}
            <Link to="/books" style={{ color: 'var(--accent-light)' }}>
              قائمة الكتب
            </Link>
            . صفحة الدفع تُفتح من زر الشراء على صفحة الكتاب (سعر أكبر من صفر). معاينة الشكل:{' '}
            <Link to="/payment/preview" style={{ color: 'var(--accent-light)' }}>
              /payment/preview
            </Link>
            .
          </p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>عنوان الكتاب *</label>
              <input
                type="text"
                className="form-control"
                placeholder="أدخل عنوان الكتاب"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>المادة</label>
              <input
                type="text"
                className="form-control"
                placeholder="مثل: رياضيات، فيزياء..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>الجامعة</label>
              <input
                type="text"
                className="form-control"
                placeholder="ابحث عن جامعتك..."
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                list="add-book-uni-list"
              />
              <datalist id="add-book-uni-list">
                {EGYPTIAN_UNIVERSITIES.map((uni, idx) => (
                  <option key={idx} value={uni} />
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label>السعر (جنيه) *</label>
              <input
                type="number"
                className="form-control"
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                required
              />
            </div>
            <div className="form-group">
              <label>الحالة</label>
              <select className="form-control" value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option value="new">جديد ✨</option>
                <option value="used">مستعمل 📖</option>
              </select>
            </div>
            <div className="form-group">
              <label>الوصف</label>
              <textarea
                className="form-control"
                placeholder="اكتب وصفاً للكتاب..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>صور الكتاب</label>
              <div className="file-input-wrapper">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={(e) => {
                    setFiles(e.target.files);
                    // Generate previews
                    if (e.target.files) {
                      const newPreviews = Array.from(e.target.files).map(f => URL.createObjectURL(f));
                      setPreviews(newPreviews);
                    }
                  }} 
                />
                <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>يمكنك رفع أكثر من صورة</p>
                {previews.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', overflowX: 'auto', padding: '0.5rem 0' }}>
                    {previews.map((url, i) => (
                      <img key={i} src={url} alt="preview" style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover', border: '2px solid var(--accent-light)' }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? '⏳ جاري الإضافة...' : '📚 إضافة الكتاب'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBook;
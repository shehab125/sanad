import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { EGYPTIAN_UNIVERSITIES } from '../../data/universities';
import { useTranslation } from 'react-i18next';

const Register: React.FC = () => {
  const { signUp } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectAfterLogin = searchParams.get('redirect');
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [university, setUniversity] = useState('');
  const [faculty, setFaculty] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const u = username.trim().toLowerCase();
    if (u.length < 2) {
      setError('اسم المستخدم يجب أن يكون حرفين على الأقل.');
      setLoading(false);
      return;
    }
    if (!/^[a-z0-9_\-\u0600-\u06FF]+$/.test(u)) {
      setError('اسم المستخدم: حروف إنجليزية أو عربية وأرقام وشرطة (- أو _).');
      setLoading(false);
      return;
    }
    const { error } = await signUp(email, password, {
      full_name: fullName,
      username: u,
      university,
      faculty,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      // بما أن تأكيد البريد ملغي، المستخدم سجل دخوله فعلياً الآن.
      // نقوم بالتحويل للصفحة الرئيسية أو الصفحة المطلوبة.
      window.location.href = redirectAfterLogin || '/';
    }
  };

  // إزالة واجهة "تفقد بريدك" لأنها لم تعد مطلوبة

  return (
    <div className="auth-page">
      <div className="auth-card animate-in">
        <div className="auth-logo">
          <h1>سند</h1>
        </div>
        <p className="auth-title">إنشاء حساب جديد</p>
        <p className="auth-subtitle">انضم لمجتمع الطلاب الجامعيين</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>الاسم الكامل</label>
            <input type="text" className="form-control" placeholder="اسمك الكامل" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>اسم المستخدم *</label>
            <input
              type="text"
              className="form-control"
              placeholder="مثل: ahmed_khaled"
              dir="ltr"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.35rem' }}>
              يُخزَّن في ملفك الشخصي ويُستخدم للتعرّف عليك داخل المنصة.
            </p>
          </div>
          <div className="form-group">
            <label>الجامعة</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="ابحث عن جامعتك..." 
              value={university} 
              onChange={(e) => setUniversity(e.target.value)} 
              list="university-list"
              required
            />
            <datalist id="university-list">
              {EGYPTIAN_UNIVERSITIES.map((uni, idx) => (
                <option key={idx} value={uni} />
              ))}
            </datalist>
          </div>
          <div className="form-group">
            <label>الكلية</label>
            <input type="text" className="form-control" placeholder="اسم كليتك" value={faculty} onChange={(e) => setFaculty(e.target.value)} />
          </div>
          <div className="form-group">
            <label>البريد الإلكتروني</label>
            <input type="email" className="form-control" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>كلمة المرور</label>
            <input type="password" className="form-control" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? '⏳ جاري التسجيل...' : '🚀 إنشاء الحساب'}
          </button>
        </form>

        <div className="auth-footer">
          {t('nav.login_prompt')}{' '}
          <Link
            to={
              redirectAfterLogin
                ? `/login?redirect=${encodeURIComponent(redirectAfterLogin)}`
                : '/login'
            }
          >
            {t('nav.login')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
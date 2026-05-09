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
  const [success, setSuccess] = useState(false);

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
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card animate-in success-flow" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div className="success-icon-wrapper" style={{ 
            width: '100px', 
            height: '100px', 
            background: 'rgba(108, 99, 255, 0.1)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 2rem',
            border: '2px solid var(--accent-glow)'
          }} >
            <span style={{ fontSize: '3rem' }}>✉️</span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, background: 'linear-gradient(135deg, #fff, var(--accent-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1rem' }}>
            {i18n.language === 'ar' ? '🎉 تفقد بريدك الإلكتروني!' : '🎉 Check your email!'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.05rem', lineHeight: 1.8 }}>
            {i18n.language === 'ar' ? (
              <>أهلاً بك في عائلة <span style={{ color: 'var(--accent-light)', fontWeight: 700 }}>سند</span>!<br />لقد أرسلنا رابط التأكيد إلى:</>
            ) : (
              <>Welcome to <span style={{ color: 'var(--accent-light)', fontWeight: 700 }}>SANAD</span> family!<br />We sent a confirmation link to:</>
            )}
            <br />
            <strong style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'var(--bg-secondary)', borderRadius: '50px', border: '1px solid var(--border)', marginTop: '0.5rem', color: 'var(--text-white)' }}>{email}</strong>
          </p>
          
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem', textAlign: i18n.language === 'ar' ? 'right' : 'left', border: '1px solid var(--border)' }}>
            <h4 style={{ color: 'var(--gold)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>💡 {i18n.language === 'ar' ? 'نصائح سريعة:' : 'Quick Tips:'}</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <li>• {i18n.language === 'ar' ? 'قد يستغرق وصول البريد دقيقتين.' : 'It might take up to 2 minutes.'}</li>
              <li>• {i18n.language === 'ar' ? 'تأكد من فحص مجلد الرسائل المزعجة (Spam).' : 'Check your Spam/Junk folder.'}</li>
              <li>• {i18n.language === 'ar' ? 'الرابط صالح لمدة 24 ساعة فقط.' : 'The link is valid for 24 hours.'}</li>
            </ul>
          </div>

          <Link
            to={
              redirectAfterLogin
                ? `/login?redirect=${encodeURIComponent(redirectAfterLogin)}`
                : '/login'
            }
            className="btn btn-primary w-100"
            style={{ height: '54px', fontSize: '1.1rem' }}
          >
            🔐 {t('nav.login')}
          </Link>
        </div>
      </div>
    );
  }

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
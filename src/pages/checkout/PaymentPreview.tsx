import React from 'react';
import { Link } from 'react-router-dom';
import { currencyLabel, paymentCurrency, stripePublishableKey } from '../../lib/payment';

/**
 * معاينة واجهة الدفع بدون تسجيل دخول أو منتج حقيقي — للتأكد من الشكل ومسار الصفحة.
 */
const PaymentPreview: React.FC = () => {
  const currency = paymentCurrency();
  const hasKey = Boolean(stripePublishableKey());

  return (
    <div className="auth-page checkout-page">
      <div className="auth-card animate-in checkout-card" style={{ maxWidth: 560 }}>
        <p className="auth-title" style={{ marginBottom: '0.25rem' }}>
          معاينة صفحة الدفع
        </p>
        <p className="auth-subtitle" style={{ marginBottom: '1rem' }}>
          هذا عرض توضيحي فقط. الدفع الحقيقي يبدأ من صفحة كتاب أو أداة بعد تسجيل الدخول.
        </p>

        <div
          style={{
            marginBottom: '1rem',
            fontSize: '0.9rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-accent)',
            color: 'var(--text-secondary)',
          }}
        >
          مثال وهمي: كتاب تجريبي — <strong style={{ color: 'var(--text-white)' }}>49.00 {currencyLabel(currency)}</strong>
        </div>

        <div
          className="card"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>كتاب</div>
              <div style={{ color: 'var(--text-white)', fontWeight: 700 }}>مقدمة في البرمجة</div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>الإجمالي</div>
              <div className="detail-price" style={{ fontSize: '1.35rem' }}>
                49.00 {currencyLabel(currency)}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            border: '1px dashed var(--border-accent)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            minHeight: 120,
            marginBottom: '1rem',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            lineHeight: 1.7,
          }}
        >
          {hasKey ? (
            <>
              عند شراء حقيقي، يظهر هنا زر التحويل إلى <strong>Stripe Checkout</strong>.
            </>
          ) : (
            <>
              لإظهار نموذج الدفع الحقيقي أضف في ملف البيئة:{' '}
              <code style={{ color: 'var(--accent-light)' }}>VITE_STRIPE_PUBLISHABLE_KEY</code> ثم أعد تشغيل السيرفر.
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link className="btn btn-primary" to="/books">
            تصفح الكتب
          </Link>
          <Link className="btn btn-secondary" to="/tools">
            تصفح الأدوات
          </Link>
          <Link className="btn btn-secondary" to="/">
            الرئيسية
          </Link>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '1.25rem' }}>
          رابط الدفع الفعلي يكون بهذا الشكل:{' '}
          <code style={{ wordBreak: 'break-all' }}>/checkout?type=book&id=…</code>
        </p>
      </div>
    </div>
  );
};

export default PaymentPreview;

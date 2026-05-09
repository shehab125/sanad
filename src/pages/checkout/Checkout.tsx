import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import supabase from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import {
  currencyLabel,
  paymentCurrency,
  paymentProvider,
  stripeCheckoutFunctionName,
  stripePublishableKey,
} from '../../lib/payment';

const CHECKOUT_TYPES = ['book', 'note', 'tool'] as const;
type ItemType = (typeof CHECKOUT_TYPES)[number];

function parseCheckoutType(raw: string | null): ItemType {
  return CHECKOUT_TYPES.includes(raw as ItemType) ? (raw as ItemType) : 'book';
}

function itemKindLabel(type: ItemType): string {
  if (type === 'book') return 'كتاب';
  if (type === 'note') return 'ملخص';
  return 'منتج (أداة)';
}

interface LineItem {
  type: ItemType;
  id: string;
  title: string;
  price: number;
  sellerId: string;
}

function isMissingOrdersTableError(message?: string): boolean {
  const raw = (message || '').toLowerCase();
  return raw.includes("could not find the table 'public.orders'") || raw.includes('schema cache');
}

function mapPaymentError(message?: string): string {
  const raw = (message || '').trim();
  if (!raw) return 'حدث خطأ أثناء تجهيز الدفع.';
  if (raw.includes("Could not find the table 'public.orders'")) {
    return 'جدول الطلبات (orders) غير موجود في قاعدة البيانات. نفّذ ملف migration الخاص بالدفع في Supabase SQL Editor ثم أعد المحاولة.';
  }
  if (raw.toLowerCase().includes('schema cache')) {
    return 'تم تعديل قاعدة البيانات حديثاً. انتظر ثوانٍ ثم أعد المحاولة، أو نفّذ Reload Schema من Supabase.';
  }
  return raw;
}

const Checkout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const type = parseCheckoutType(searchParams.get('type'));
  const rawId = searchParams.get('id');
  const currency = paymentCurrency();
  const provider = paymentProvider();
  const pk = stripePublishableKey();
  const checkoutFn = stripeCheckoutFunctionName();

  const [item, setItem] = useState<LineItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const ensureOrder = useCallback(async (): Promise<string | null> => {
    if (!user || !item || item.price <= 0 || item.sellerId === user.id) return null;
    if (provider === 'none') return null;
    if (orderId) return orderId;

    const { data: existing, error: existingErr } = await supabase
      .from('orders')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('item_type', item.type)
      .eq('item_id', item.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingErr) {
      setError(mapPaymentError(existingErr.message));
      return null;
    }

    if (existing?.id) {
      setOrderId(existing.id);
      return existing.id;
    }

    const { data: inserted, error: insErr } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        seller_id: item.sellerId,
        item_type: item.type,
        item_id: item.id,
        amount: item.price,
        currency,
        status: 'pending',
        gateway: 'stripe',
      })
      .select('id')
      .single();

    if (insErr) {
      setError(mapPaymentError(insErr.message));
      return null;
    }

    const id = (inserted as { id: string }).id;
    setOrderId(id);
    return id;
  }, [user, item, provider, orderId, currency]);

  const fetchItem = useCallback(async () => {
    if (!rawId) {
      setError('رابط الدفع غير صالح (ناقص معرف المنتج).');
      setLoading(false);
      return;
    }
    if (type === 'book') {
      const { data, error: qErr } = await supabase
        .from('books')
        .select('id, user_id, title, price')
        .eq('id', rawId)
        .single();
      if (qErr || !data) {
        setError(qErr?.message || 'الكتاب غير موجود.');
        setLoading(false);
        return;
      }
      const row = data as { id: string; user_id: string; title: string; price: number };
      setItem({
        type: 'book',
        id: row.id,
        title: row.title,
        price: Number(row.price),
        sellerId: row.user_id,
      });
    } else if (type === 'note') {
      const { data, error: qErr } = await supabase
        .from('notes')
        .select('id, user_id, title, price')
        .eq('id', rawId)
        .single();
      if (qErr || !data) {
        setError(qErr?.message || 'الملخص غير موجود.');
        setLoading(false);
        return;
      }
      const row = data as { id: string; user_id: string; title: string; price: number };
      setItem({
        type: 'note',
        id: row.id,
        title: row.title,
        price: Number(row.price),
        sellerId: row.user_id,
      });
    } else if (type === 'tool') {
      const { data, error: qErr } = await supabase
        .from('tools')
        .select('id, user_id, title, price')
        .eq('id', rawId)
        .single();
      if (qErr || !data) {
        setError(qErr?.message || 'المنتج غير موجود.');
        setLoading(false);
        return;
      }
      const row = data as { id: string; user_id: string; title: string; price: number };
      setItem({
        type: 'tool',
        id: row.id,
        title: row.title,
        price: Number(row.price),
        sellerId: row.user_id,
      });
    }
    setLoading(false);
  }, [rawId, type]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  useEffect(() => {
    if (!user || !item) return;
    if (item.sellerId === user.id) {
      setError('لا يمكنك شراء إعلانك أنت.');
      return;
    }
    if (item.price <= 0) {
      setError('هذا العنصر مجاني — لا حاجة للدفع.');
      return;
    }
  }, [user, item]);

  useEffect(() => {
    ensureOrder();
  }, [ensureOrder]);

  const startStripeCheckout = useCallback(async () => {
    if (!user || !item) return;
    setError(null);
    setIsRedirecting(true);

    try {
      let activeOrderId = await ensureOrder();
      let successUrl = activeOrderId
        ? `${window.location.origin}/payment/success?order_id=${encodeURIComponent(activeOrderId)}&session_id={CHECKOUT_SESSION_ID}`
        : `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/checkout?type=${encodeURIComponent(item.type)}&id=${encodeURIComponent(item.id)}`;

      let invokePayload = {
        orderId: activeOrderId || undefined,
        buyerId: user.id,
        itemType: item.type,
        itemId: item.id,
        title: item.title,
        amount: item.price,
        currency,
        successUrl,
        cancelUrl,
        bypassOrderCheck: !activeOrderId,
      };

      let { data, error: fnErr } = await supabase.functions.invoke(checkoutFn, {
        body: invokePayload,
      });

      if (fnErr && isMissingOrdersTableError(fnErr.message)) {
        activeOrderId = null;
        successUrl = `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
        ({ data, error: fnErr } = await supabase.functions.invoke(checkoutFn, {
          body: {
            ...invokePayload,
            orderId: undefined,
            successUrl,
            bypassOrderCheck: true,
          },
        }));
      }

      if (fnErr) {
        throw new Error(fnErr.message || 'تعذر إنشاء جلسة الدفع على الخادم.');
      }

      const payload = (data || {}) as { url?: string; sessionId?: string; message?: string };
      if (payload.url) {
        window.location.assign(payload.url);
        return;
      }

      if (!payload.sessionId) {
        throw new Error(payload.message || 'الخادم لم يرجع رابط أو sessionId للدفع.');
      }

      if (!pk) {
        throw new Error('الخادم رجّع sessionId فقط. أضف VITE_STRIPE_PUBLISHABLE_KEY أو اجعل الدالة ترجع url مباشر.');
      }

      const stripe = await loadStripe(pk);
      if (!stripe) throw new Error('تعذر تهيئة Stripe SDK.');
      const redirectResult = await stripe.redirectToCheckout({ sessionId: payload.sessionId });
      if (redirectResult.error) throw new Error(redirectResult.error.message);
    } catch (e) {
      setError(mapPaymentError(e instanceof Error ? e.message : 'فشل بدء الدفع عبر Stripe.'));
      setIsRedirecting(false);
    }
  }, [user, item, pk, currency, checkoutFn, ensureOrder]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner" />
          <span className="loading-text">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (error && !item) {
    return (
      <div className="page-container">
        <div className="alert alert-error">{error}</div>
        <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
          رجوع
        </button>
      </div>
    );
  }

  if (!item) return null;

  const showGateway = provider !== 'none' && item.price > 0 && item.sellerId !== user.id;

  return (
    <div className="auth-page checkout-page">
      <div className="auth-card animate-in checkout-card" style={{ maxWidth: 560 }}>
        <p className="auth-title" style={{ marginBottom: '0.25rem' }}>
          إتمام الدفع
        </p>
        <p className="auth-subtitle" style={{ marginBottom: '1.25rem' }}>
          مراجعة الطلب ثم الدفع عبر بوابة آمنة (Stripe).
        </p>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

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
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {itemKindLabel(item.type)}
              </div>
              <div style={{ color: 'var(--text-white)', fontWeight: 700 }}>{item.title}</div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>الإجمالي</div>
              <div className="detail-price" style={{ fontSize: '1.35rem' }}>
                {item.price.toFixed(2)} {currencyLabel(currency)}
              </div>
            </div>
          </div>
        </div>

        {!showGateway && item.price > 0 && item.sellerId !== user.id && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            لم يُضبط الدفع بعد: تأكد من إعداد Stripe Edge Function ومفاتيح البيئة (على الأقل{' '}
            <code style={{ color: 'var(--accent-light)' }}>VITE_PAYMENT_CURRENCY</code>
            ). وإذا كانت الدالة ترجع sessionId فقط، أضف{' '}
            <code style={{ color: 'var(--accent-light)' }}>VITE_STRIPE_PUBLISHABLE_KEY</code>. للاختبار فقط يمكنك تعطيل الدفع عبر{' '}
            <code>VITE_PAYMENT_PROVIDER=none</code>.
          </div>
        )}

        {showGateway && (
          <>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              اضغط على زر الدفع للانتقال إلى صفحة Stripe Checkout ثم ستعود تلقائياً بعد نجاح العملية.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={startStripeCheckout}
              disabled={isRedirecting}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              {isRedirecting ? 'جاري التحويل إلى Stripe...' : 'الدفع عبر Stripe'}
            </button>
            {!orderId && !error && (
              <div className="loading-container" style={{ padding: '1rem' }}>
                <div className="spinner" />
                <span className="loading-text">جاري تجهيز الطلب...</span>
              </div>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            رجوع
          </button>
          {item.type === 'book' && (
            <Link className="btn btn-secondary" to={`/books/${item.id}`}>
              صفحة الكتاب
            </Link>
          )}
          {item.type === 'note' && (
            <Link className="btn btn-secondary" to={`/notes/${item.id}`}>
              صفحة الملخص
            </Link>
          )}
          {item.type === 'tool' && (
            <Link className="btn btn-secondary" to={`/tools/${item.id}`}>
              صفحة المنتج
            </Link>
          )}
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '1.25rem', lineHeight: 1.6 }}>
          للإنتاج: تحقّق من صحة المبلغ عبر خادم (مثل Supabase Edge Function أو Webhook من Stripe) قبل اعتماد الطلب نهائياً.
          المفتاح السري لا يُخزَّن أبداً في الواجهة.
        </p>
      </div>
    </div>
  );
};

export default Checkout;

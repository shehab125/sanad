import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import supabase from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Stripe يعيد التوجيه إلى success_url مع session_id ومعرفات الدفع حسب الإعداد.
 * نحدّث الطلب كـ "paid" ونسجّل شراء الملخص عند الحاجة.
 * للإنتاج أضف تحققاً من الخادم/Webhook.
 */
const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const orderId = searchParams.get('order_id');
  const gatewayPaymentId =
    searchParams.get('session_id') ||
    searchParams.get('id') ||
    searchParams.get('payment_id') ||
    searchParams.get('paymentId') ||
    null;

  const [status, setStatus] = useState<'working' | 'ok' | 'err'>('working');
  const [message, setMessage] = useState<string | null>(null);
  const [itemType, setItemType] = useState<string | null>(null);
  const [itemUuid, setItemUuid] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!user) {
        setStatus('err');
        setMessage('يجب تسجيل الدخول لعرض حالة الدفع.');
        return;
      }
      if (!orderId) {
        if (gatewayPaymentId) {
          setStatus('ok');
          setMessage('تم تنفيذ عملية الدفع بنجاح عبر Stripe.');
          return;
        }
        setStatus('err');
        setMessage('لا يوجد رقم طلب في الرابط.');
        return;
      }

      const { data: order, error: fetchErr } = await supabase
        .from('orders')
        .select('id, buyer_id, item_type, item_id, status, amount, currency')
        .eq('id', orderId)
        .single();

      if (fetchErr || !order) {
        setStatus('err');
        setMessage(fetchErr?.message || 'الطلب غير موجود.');
        return;
      }

      const row = order as {
        buyer_id: string;
        item_type: string;
        item_id: string;
        status: string;
      };

      if (row.buyer_id !== user.id) {
        setStatus('err');
        setMessage('غير مصرح بعرض هذا الطلب.');
        return;
      }

      setItemType(row.item_type);
      setItemUuid(row.item_id);

      if (row.status === 'paid') {
        setStatus('ok');
        setMessage('تم تأكيد هذا الطلب مسبقاً.');
        return;
      }

      const { error: upErr } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          gateway_payment_id: gatewayPaymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('buyer_id', user.id)
        .eq('status', 'pending');

      if (upErr) {
        setStatus('err');
        setMessage(upErr.message);
        return;
      }

      if (row.item_type === 'note') {
        const { error: pErr } = await supabase.from('note_purchases').insert({
          user_id: user.id,
          note_id: row.item_id,
          order_id: orderId,
        });
        if (pErr && pErr.code !== '23505') {
          setStatus('err');
          setMessage(pErr.message);
          return;
        }
      }

      setStatus('ok');
      setMessage('تم الدفع بنجاح.');
    };

    run();
  }, [user, orderId, gatewayPaymentId]);

  return (
    <div className="auth-page">
      <div className="auth-card animate-in" style={{ textAlign: 'center', maxWidth: 480 }}>
        {status === 'working' && (
          <>
            <div className="loading-container" style={{ marginBottom: '1rem' }}>
              <div className="spinner" />
            </div>
            <p className="auth-title">جاري تأكيد الدفع...</p>
          </>
        )}
        {status === 'ok' && (
          <>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>✅</div>
            <p className="auth-title">تم الدفع</p>
            <p className="auth-subtitle" style={{ marginBottom: '1.25rem' }}>
              {message}
            </p>
            {itemType === 'note' && itemUuid && (
              <Link className="btn btn-primary" to={`/notes/${itemUuid}`}>
                فتح الملخص والتحميل
              </Link>
            )}
            {itemType === 'book' && itemUuid && (
              <Link className="btn btn-primary" to={`/books/${itemUuid}`}>
                العودة لصفحة الكتاب
              </Link>
            )}
            {itemType === 'tool' && itemUuid && (
              <Link className="btn btn-primary" to={`/tools/${itemUuid}`}>
                العودة لصفحة المنتج
              </Link>
            )}
            {!itemUuid && <Link to="/">الرئيسية</Link>}
          </>
        )}
        {status === 'err' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⚠️</div>
            <p className="auth-title">تعذر التأكيد</p>
            <p className="auth-subtitle" style={{ marginBottom: '1rem' }}>
              {message}
            </p>
            <Link className="btn btn-secondary" to="/">
              الرئيسية
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;

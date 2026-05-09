import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import Stripe from 'npm:stripe@16.12.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

type Json = Record<string, unknown>;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Json, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!stripeSecret || !supabaseUrl || !supabaseServiceRole) {
      return jsonResponse({ error: 'Server secrets are not configured.' }, 500);
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });
    const admin = createClient(supabaseUrl, supabaseServiceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const payload = (await req.json()) as {
      orderId?: string;
      buyerId?: string;
      itemType?: string;
      itemId?: string;
      title?: string;
      amount?: number;
      currency?: string;
      successUrl?: string;
      cancelUrl?: string;
      bypassOrderCheck?: boolean;
    };

    const orderId = (payload.orderId || '').trim();
    const buyerId = (payload.buyerId || '').trim();
    const currency = (payload.currency || 'EGP').trim().toLowerCase();
    const successUrl = (payload.successUrl || '').trim();
    const cancelUrl = (payload.cancelUrl || '').trim();
    const fallbackTitle = (payload.title || '').trim() || 'طلب شراء';
    const bypassOrderCheck = Boolean(payload.bypassOrderCheck);

    if (!buyerId || !successUrl || !cancelUrl) {
      return jsonResponse({ error: 'Missing required fields.' }, 400);
    }

    let itemType = String(payload.itemType || '');
    let itemId = String(payload.itemId || '');
    let amount = Number(payload.amount || 0);
    let metadataOrderId = '';

    if (!bypassOrderCheck && orderId) {
      const { data: order, error: orderErr } = await admin
        .from('orders')
        .select('id, buyer_id, item_type, item_id, amount, currency, status')
        .eq('id', orderId)
        .single();

      if (orderErr || !order) {
        return jsonResponse({ error: orderErr?.message || 'Order not found.' }, 404);
      }

      if (order.buyer_id !== buyerId) {
        return jsonResponse({ error: 'Order does not belong to current buyer.' }, 403);
      }
      if (order.status !== 'pending') {
        return jsonResponse({ error: 'Order is not pending.' }, 400);
      }

      itemType = String(order.item_type || itemType);
      itemId = String(order.item_id || itemId);
      amount = Number(order.amount);
      metadataOrderId = order.id;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return jsonResponse({ error: 'Invalid order amount.' }, 400);
    }
    const minorAmount = Math.round(amount * 100);
    if (minorAmount < 50) {
      return jsonResponse({ error: 'Amount is below Stripe minimum for this currency.' }, 400);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      currency,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: minorAmount,
            product_data: {
              name: fallbackTitle.slice(0, 120),
              metadata: {
                order_id: metadataOrderId,
                item_type: itemType,
                item_id: itemId,
              },
            },
          },
        },
      ],
      metadata: {
        order_id: metadataOrderId,
        buyer_id: buyerId,
        item_type: itemType,
        item_id: itemId,
      },
      payment_intent_data: {
        metadata: {
          order_id: metadataOrderId,
          buyer_id: buyerId,
        },
      },
    });

    if (metadataOrderId) {
      await admin
        .from('orders')
        .update({
          gateway: 'stripe',
          gateway_payment_id: session.id,
          currency: currency.toUpperCase(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', metadataOrderId)
        .eq('status', 'pending');
    }

    return jsonResponse({ url: session.url, sessionId: session.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return jsonResponse({ error: message }, 500);
  }
});

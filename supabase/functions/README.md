# Stripe Checkout Function

This project uses `create-stripe-checkout-session` to start payment from `/checkout`.

## Deploy

```bash
supabase functions deploy create-stripe-checkout-session
```

## Required Secrets

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

After setting secrets, redeploy the function.

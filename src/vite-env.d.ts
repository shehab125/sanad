/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_PAYMENT_PROVIDER?: 'stripe' | 'none';
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  readonly VITE_STRIPE_CHECKOUT_FUNCTION?: string;
  readonly VITE_PAYMENT_CURRENCY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


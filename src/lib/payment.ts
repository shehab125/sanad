/** Minor units (e.g. cents / piastres) for gateways like Stripe. */
export function amountToMinorUnits(amount: number): number {
  return Math.round(Number(amount) * 100);
}

export function paymentProvider(): 'stripe' | 'none' {
  const p = import.meta.env.VITE_PAYMENT_PROVIDER;
  if (p === 'none') return 'none';
  return 'stripe';
}

export function stripePublishableKey(): string {
  return (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim();
}

export function stripeCheckoutFunctionName(): string {
  return (import.meta.env.VITE_STRIPE_CHECKOUT_FUNCTION || 'create-stripe-checkout-session').trim();
}

export function paymentCurrency(): string {
  return (import.meta.env.VITE_PAYMENT_CURRENCY || 'EGP').trim().toUpperCase();
}

const CURRENCY_AR: Record<string, string> = {
  SAR: 'ر.س',
  EGP: 'ج.م',
  USD: 'USD',
  AED: 'د.إ',
};

export function currencyLabel(code: string): string {
  return CURRENCY_AR[code] || code;
}

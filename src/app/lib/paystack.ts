// Thin wrapper around Paystack's inline popup (https://js.paystack.co/v1/inline.js).
// Loaded on demand (only checkout needs it) rather than in index.html.

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: PaystackSetupOptions) => { openIframe: () => void };
    };
  }
}

interface PaystackSetupOptions {
  key: string;
  email: string;
  amount: number;
  ref: string;
  currency?: string;
  callback: (response: { reference: string }) => void;
  onClose: () => void;
}

let scriptPromise: Promise<void> | null = null;

function loadPaystackScript(): Promise<void> {
  if (window.PaystackPop) return Promise.resolve();

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Could not load Paystack'));
      document.body.appendChild(script);
    });
  }

  return scriptPromise;
}

export async function openPaystackPopup(options: {
  publicKey: string;
  email: string;
  amountInNaira: number;
  reference: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}): Promise<void> {
  await loadPaystackScript();

  if (!window.PaystackPop) {
    throw new Error('Paystack failed to load');
  }

  const handler = window.PaystackPop.setup({
    key: options.publicKey,
    email: options.email,
    amount: Math.round(options.amountInNaira * 100), // kobo
    ref: options.reference,
    callback: response => options.onSuccess(response.reference),
    onClose: options.onClose,
  });

  handler.openIframe();
}

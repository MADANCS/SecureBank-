import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open(): void;
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface Props {
  orderId: string;
  amount: number;       // in paise
  currency: string;
  keyId: string;
  description: string;
  username: string;
  onSuccess: (response: RazorpayResponse) => void;
  onDismiss: () => void;
}

export default function RazorpayCheckout({
  orderId, amount, currency, keyId, description, username, onSuccess, onDismiss,
}: Props) {
  const openedRef = useRef(false);

  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;

    const loadAndOpen = () => {
      const options: RazorpayOptions = {
        key: keyId,
        amount,
        currency,
        name: 'SecureBank',
        description,
        order_id: orderId,
        prefill: { name: username },
        theme: { color: '#3b82f6' },
        handler: (response) => onSuccess(response),
        modal: { ondismiss: onDismiss },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    };

    if (window.Razorpay) {
      loadAndOpen();
    } else {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = loadAndOpen;
      document.body.appendChild(script);
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Renders nothing — Razorpay opens as an overlay
  return null;
}

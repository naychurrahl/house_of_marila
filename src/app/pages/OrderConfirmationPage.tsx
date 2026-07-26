import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { Check, X, Loader2 } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { Order } from '@/app/data/types';

export function OrderConfirmationPage() {
  const { id } = useParams();
  const { orders, verifyPayment } = useApp();

  const knownOrder = orders.find(o => o.id === id);
  const [order, setOrder] = useState<Order | undefined>(knownOrder);
  const [gatewayStatus, setGatewayStatus] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(!knownOrder || knownOrder.paymentStatus === 'pending');

  // The order id doubles as the Paystack reference, so this page can always
  // confirm the real payment status from the URL alone - no query param
  // needed. Already-settled orders (seen via account history, say) skip the
  // extra round trip to Paystack.
  useEffect(() => {
    if (!id) return;
    if (knownOrder && knownOrder.paymentStatus !== 'pending') {
      setOrder(knownOrder);
      setIsVerifying(false);
      return;
    }

    verifyPayment(id)
      .then(result => {
        setOrder(result);
        setGatewayStatus(result.gatewayStatus);
      })
      .catch(console.error)
      .finally(() => setIsVerifying(false));
  }, [id]);

  const paymentFailed = gatewayStatus === 'failed' || gatewayStatus === 'abandoned'
    || (!gatewayStatus && order?.paymentStatus === 'failed');

  return (
    <div className="pt-14 min-h-screen flex items-center justify-center">
      <div className="text-center px-4 max-w-md">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
            isVerifying ? 'bg-neutral-100' : paymentFailed ? 'bg-red-100' : 'bg-green-100'
          }`}
        >
          {isVerifying ? (
            <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
          ) : paymentFailed ? (
            <X className="w-8 h-8 text-red-600" />
          ) : (
            <Check className="w-8 h-8 text-green-600" />
          )}
        </div>

        <h1 className="text-4xl mb-4 tracking-tight">
          {isVerifying ? 'Confirming Payment...' : paymentFailed ? 'Payment Not Completed' : 'Order Confirmed'}
        </h1>
        <p className="text-neutral-600 mb-2">
          {paymentFailed
            ? "We didn't receive payment for this order - it hasn't been processed."
            : 'Thank you for your purchase!'}
        </p>
        <p className="text-sm text-neutral-500 mb-8">Order #{id}</p>

        {order && (
          <div className="bg-neutral-50 p-6 mb-8 text-left">
            <h2 className="text-sm tracking-wide uppercase mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm text-neutral-700 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>${order.shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutral-200">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
            {!paymentFailed && !isVerifying && (
              <ul className="space-y-3 text-sm text-neutral-700">
                <li>• You'll receive a confirmation email shortly</li>
                <li>• We'll notify you when your order ships</li>
                <li>• Track your order in your account</li>
              </ul>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {paymentFailed ? (
            <Link
              to="/cart"
              className="block bg-black text-white py-3 text-sm tracking-wide hover:bg-neutral-800 transition-colors"
            >
              RETURN TO CART
            </Link>
          ) : (
            <Link
              to="/account"
              className="block bg-black text-white py-3 text-sm tracking-wide hover:bg-neutral-800 transition-colors"
            >
              VIEW ORDER DETAILS
            </Link>
          )}
          <Link
            to="/shop"
            className="block border border-black py-3 text-sm tracking-wide hover:bg-neutral-50 transition-colors"
          >
            CONTINUE SHOPPING
          </Link>
        </div>
      </div>
    </div>
  );
}

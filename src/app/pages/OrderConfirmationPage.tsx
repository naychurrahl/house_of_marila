import { useParams, Link } from 'react-router';
import { Check } from 'lucide-react';

export function OrderConfirmationPage() {
  const { id } = useParams();

  return (
    <div className="pt-14 min-h-screen flex items-center justify-center">
      <div className="text-center px-4 max-w-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        
        <h1 className="text-4xl mb-4 tracking-tight">Order Confirmed</h1>
        <p className="text-neutral-600 mb-2">Thank you for your purchase!</p>
        <p className="text-sm text-neutral-500 mb-8">
          Order #{id}
        </p>

        <div className="bg-neutral-50 p-6 mb-8 text-left">
          <h2 className="text-sm tracking-wide uppercase mb-4">What's Next?</h2>
          <ul className="space-y-3 text-sm text-neutral-700">
            <li>• You'll receive a confirmation email shortly</li>
            <li>• We'll notify you when your order ships</li>
            <li>• Track your order in your account</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            to="/account"
            className="block bg-black text-white py-3 text-sm tracking-wide hover:bg-neutral-800 transition-colors"
          >
            VIEW ORDER DETAILS
          </Link>
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

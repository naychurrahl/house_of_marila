import { RouterProvider } from 'react-router';
import { router } from '@/app/routes';
import { CartProvider } from '@/app/context/CartContext';

export default function App() {
  return (
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  );
}

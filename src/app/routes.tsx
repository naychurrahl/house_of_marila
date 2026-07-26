import { createBrowserRouter } from 'react-router';
import { RootLayout } from '@/app/layouts/RootLayout';
import { HomePage } from '@/app/pages/HomePage';
import { CollectionsPage } from '@/app/pages/CollectionsPage';
import { CollectionDetailPage } from '@/app/pages/CollectionDetailPage';
import { ShopPage } from '@/app/pages/ShopPage';
import { ProductDetailPage } from '@/app/pages/ProductDetailPage';
import { JournalPage } from '@/app/pages/JournalPage';
import { ArticleDetailPage } from '@/app/pages/ArticleDetailPage';
import { AccountPage } from '@/app/pages/AccountPage';
import { CartPage } from '@/app/pages/CartPage';
import { CheckoutPage } from '@/app/pages/CheckoutPage';
import { OrderConfirmationPage } from '@/app/pages/OrderConfirmationPage';
import { ContactPage } from '@/app/pages/ContactPage';
import { StoreLocatorPage } from '@/app/pages/StoreLocatorPage';
import { AdminPage } from '@/app/pages/AdminPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: 'collections', Component: CollectionsPage },
      { path: 'collections/:id', Component: CollectionDetailPage },
      { path: 'shop', Component: ShopPage },
      { path: 'product/:id', Component: ProductDetailPage },
      { path: 'journal', Component: JournalPage },
      { path: 'journal/:id', Component: ArticleDetailPage },
      { path: 'account', Component: AccountPage },
      { path: 'cart', Component: CartPage },
      { path: 'checkout', Component: CheckoutPage },
      { path: 'order-confirmation/:id', Component: OrderConfirmationPage },
      { path: 'contact', Component: ContactPage },
      { path: 'stores', Component: StoreLocatorPage },
      { path: 'admin', Component: AdminPage },
    ],
  },
]);

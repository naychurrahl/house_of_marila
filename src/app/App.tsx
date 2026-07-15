import { RouterProvider } from 'react-router';
import { router } from '@/app/routes';
import { AppProvider } from '@/app/context/AppContext';

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}

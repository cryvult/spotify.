import { useState } from 'react';
import { RouterProvider } from 'react-router';
import { Providers } from './providers';
import { createAppRouter } from './router';

export function App() {
  // Router tworzymy raz na całe życie aplikacji.
  const [router] = useState(createAppRouter);
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}

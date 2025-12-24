'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider
        defaultColorScheme="light"
        theme={{
          primaryColor: 'blue',
          dir: 'rtl',
          fontFamily: 'Vazirmatn, sans-serif',
        }}
      >
        <Notifications position="top-center" />
        {children}
      </MantineProvider>
    </QueryClientProvider>
  );
}


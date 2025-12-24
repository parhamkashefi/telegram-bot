'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Loader, Center } from '@mantine/core';

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    // Check if token exists in localStorage as well (for initial load)
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      if (!storedToken && !isAuthenticated) {
        router.push('/login');
      }
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated && !token) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  return <>{children}</>;
}


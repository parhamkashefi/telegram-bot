'use client';

import { AppShell } from '@mantine/core';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [opened, setOpened] = useState(false);

  return (
    <ProtectedRoute>
      <AppShell
        navbar={{
          width: 250,
          breakpoint: 'sm',
          collapsed: { mobile: !opened },
        }}
        header={{
          height: 60,
        }}
      >
        <AppShell.Header>
          <Header />
        </AppShell.Header>

        <AppShell.Navbar>
          <Sidebar />
        </AppShell.Navbar>

        <AppShell.Main>{children}</AppShell.Main>
      </AppShell>
    </ProtectedRoute>
  );
}


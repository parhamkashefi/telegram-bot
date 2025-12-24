'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavLink, Stack, Text } from '@mantine/core';
import {
  IconLayoutDashboard,
  IconCurrencyDollar,
  IconPackage,
  IconSettings,
} from '@tabler/icons-react';

const navItems = [
  {
    label: 'داشبورد',
    href: '/dashboard',
    icon: IconLayoutDashboard,
  },
  {
    label: 'قیمت‌ها',
    href: '/prices',
    icon: IconCurrencyDollar,
  },
  {
    label: 'محصولات',
    href: '/products',
    icon: IconPackage,
  },
  {
    label: 'تنظیمات',
    href: '/settings',
    icon: IconSettings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <Stack gap="xs" p="md">
      <Text fw={700} size="lg" mb="md">
        سوپرانو
      </Text>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        
        return (
          <NavLink
            key={item.href}
            component={Link}
            href={item.href}
            label={item.label}
            leftSection={<Icon size={20} />}
            active={isActive}
            variant="subtle"
          />
        );
      })}
    </Stack>
  );
}


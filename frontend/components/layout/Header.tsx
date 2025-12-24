'use client';

import { Group, Button, Text } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { notifications } from '@mantine/notifications';

export function Header() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    notifications.show({
      title: 'خروج',
      message: 'با موفقیت خارج شدید',
      color: 'blue',
    });
    router.push('/login');
  };

  return (
    <Group justify="space-between" p="md">
      <Text fw={700} size="xl">
        پنل مدیریت
      </Text>
      <Button
        variant="subtle"
        leftSection={<IconLogout size={18} />}
        onClick={handleLogout}
      >
        خروج
      </Button>
    </Group>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Stack,
  Container,
  Text,
  Box,
  Group,
  rem,
} from '@mantine/core';
import { IconCurrencyDollar, IconShield } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { priceApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock login - no backend call, just set a mock token
    // This allows viewing the frontend without backend connection
    setTimeout(() => {
      const mockToken = 'mock-jwt-token-for-frontend-preview';
      login(mockToken);
      
      notifications.show({
        title: 'موفق',
        message: 'ورود با موفقیت انجام شد (حالت نمایشی)',
        color: 'green',
      });
      
      router.push('/dashboard');
      setLoading(false);
    }, 500); // Small delay to show loading state
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: rem(20),
      }}
    >
      <Container size="xs" w="100%">
        <Paper
          shadow="xl"
          p="xl"
          radius="lg"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Logo/Brand Section */}
          <Stack align="center" mb="xl">
            <Box
              style={{
                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                borderRadius: '50%',
                padding: rem(16),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconCurrencyDollar size={32} color="white" />
            </Box>
            <Title
              order={1}
              ta="center"
              style={{
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: rem(28),
                fontWeight: 700,
              }}
            >
              سوپرانو
            </Title>
            <Text size="sm" c="dimmed" ta="center">
              سیستم مدیریت قیمت طلا و نقره
            </Text>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack gap="lg">
              <TextInput
                label="نام کاربری"
                placeholder="نام کاربری را وارد کنید"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
                disabled={loading}
                size="md"
                styles={{
                  input: {
                    borderRadius: rem(8),
                    border: '2px solid #e9ecef',
                    '&:focus': {
                      borderColor: '#667eea',
                    },
                  },
                }}
              />
              <PasswordInput
                label="رمز عبور"
                placeholder="رمز عبور را وارد کنید"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                disabled={loading}
                size="md"
                styles={{
                  input: {
                    borderRadius: rem(8),
                    border: '2px solid #e9ecef',
                    '&:focus': {
                      borderColor: '#667eea',
                    },
                  },
                }}
              />
              <Button
                type="submit"
                loading={loading}
                fullWidth
                size="md"
                mt="md"
                style={{
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  borderRadius: rem(8),
                  height: rem(48),
                }}
              >
                ورود به پنل
              </Button>
            </Stack>
          </form>

          {/* Security Notice */}
          <Group justify="center" mt="xl" gap="xs">
            <IconShield size={16} color="#6c757d" />
            <Text size="xs" c="dimmed">
              ورود امن با رمزگذاری SSL
            </Text>
          </Group>
        </Paper>
      </Container>
    </Box>
  );
}

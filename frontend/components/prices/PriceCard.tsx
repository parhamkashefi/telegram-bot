'use client';

import { Card, Text, Group, Stack, Badge, Loader } from '@mantine/core';
import { IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-react';
import { formatPrice, getTimeAgo } from '@/lib/utils';
import type { Price } from '@/types';

interface PriceCardProps {
  title: string;
  price: Price | null;
  loading?: boolean;
  material: 'gold' | 'silver';
}

export function PriceCard({ title, price, loading, material }: PriceCardProps) {
  if (loading) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack align="center" gap="md">
          <Loader size="md" />
          <Text size="sm" c="dimmed">
            در حال بارگذاری...
          </Text>
        </Stack>
      </Card>
    );
  }

  if (!price || !price.prices) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text size="sm" c="dimmed">
          داده‌ای موجود نیست
        </Text>
      </Card>
    );
  }

  // Get average price from all sources
  const prices = Object.values(price.prices).filter((p) => p > 0);
  const averagePrice = prices.length > 0 
    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    : 0;

  // Get the first available price as main price
  const mainPrice = prices[0] || 0;

  // Calculate price change (mock for now - you can implement real comparison)
  const priceChange = 0; // This would compare with previous price
  const priceChangePercent = 0;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text fw={700} size="xl">
              {title}
            </Text>
            <Text size="sm" c="dimmed" mt={4}>
              {price.createdAt && getTimeAgo(price.createdAt)}
            </Text>
          </div>
          <Badge
            color={material === 'gold' ? 'yellow' : 'gray'}
            variant="light"
            size="lg"
          >
            {material === 'gold' ? 'طلا' : 'نقره'}
          </Badge>
        </Group>

        <div>
          <Text size="2xl" fw={700} c={material === 'gold' ? 'yellow.7' : 'gray.7'}>
            {formatPrice(mainPrice)} تومان
          </Text>
          {averagePrice > 0 && averagePrice !== mainPrice && (
            <Text size="sm" c="dimmed" mt={4}>
              میانگین: {formatPrice(averagePrice)} تومان
            </Text>
          )}
        </div>

        {priceChange !== 0 && (
          <Group gap="xs">
            {priceChange > 0 ? (
              <IconTrendingUp size={16} color="green" />
            ) : priceChange < 0 ? (
              <IconTrendingDown size={16} color="red" />
            ) : (
              <IconMinus size={16} color="gray" />
            )}
            <Text
              size="sm"
              c={priceChange > 0 ? 'green' : priceChange < 0 ? 'red' : 'gray'}
            >
              {priceChange > 0 ? '+' : ''}
              {priceChangePercent.toFixed(2)}%
            </Text>
          </Group>
        )}

        {price.prices && Object.keys(price.prices).length > 0 && (
          <div>
            <Text size="xs" c="dimmed" mb="xs">
              منابع: {Object.keys(price.prices).length}
            </Text>
          </div>
        )}
      </Stack>
    </Card>
  );
}


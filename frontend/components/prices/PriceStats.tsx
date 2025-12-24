'use client';

import { Group, Paper, Text, Stack } from '@mantine/core';
import { IconTrendingUp, IconTrendingDown, IconChartBar } from '@tabler/icons-react';
import { formatPrice } from '@/lib/utils';

interface PriceStatsProps {
  prices: Record<string, number>;
  title?: string;
}

export function PriceStats({ prices, title }: PriceStatsProps) {
  const priceValues = Object.values(prices).filter((p) => p > 0);

  if (priceValues.length === 0) {
    return (
      <Paper shadow="sm" p="md" radius="md" withBorder>
        <Text size="sm" c="dimmed" ta="center">
          داده‌ای برای محاسبه آمار وجود ندارد
        </Text>
      </Paper>
    );
  }

  const min = Math.min(...priceValues);
  const max = Math.max(...priceValues);
  const avg = Math.round(priceValues.reduce((a, b) => a + b, 0) / priceValues.length);
  const count = priceValues.length;
  const range = max - min;
  const rangePercent = ((range / avg) * 100).toFixed(2);

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder h="100%" style={{ width: '100%' }}>
      <Text fw={600} size="lg" mb="md">
        {title || 'آمار قیمت‌ها'}
      </Text>
      <Stack gap="sm">
        <Group justify="space-between">
          <Group gap="xs">
            <IconTrendingUp size={18} color="green" />
            <Text size="sm" c="dimmed">
              بیشترین قیمت:
            </Text>
          </Group>
          <Text fw={600} c="green">
            {formatPrice(max)} تومان
          </Text>
        </Group>

        <Group justify="space-between">
          <Group gap="xs">
            <IconTrendingDown size={18} color="red" />
            <Text size="sm" c="dimmed">
              کمترین قیمت:
            </Text>
          </Group>
          <Text fw={600} c="red">
            {formatPrice(min)} تومان
          </Text>
        </Group>

        <Group justify="space-between">
          <Group gap="xs">
            <IconChartBar size={18} color="blue" />
            <Text size="sm" c="dimmed">
              میانگین:
            </Text>
          </Group>
          <Text fw={600} c="blue">
            {formatPrice(avg)} تومان
          </Text>
        </Group>

        <Group justify="space-between" mt="xs" pt="xs" style={{ borderTop: '1px solid #e9ecef' }}>
          <Text size="sm" c="dimmed">
            تعداد منابع:
          </Text>
          <Text fw={500}>{count}</Text>
        </Group>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            اختلاف قیمت:
          </Text>
          <Text fw={500} c="orange">
            {formatPrice(range)} تومان ({rangePercent}%)
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
}


'use client';

import { Paper, Stack, Text, Group, Badge } from '@mantine/core';
import { IconCurrencyDollar } from '@tabler/icons-react';

interface KitcoPriceCardProps {
  dollarPrices?: {
    kitcoGold?: number;
    kitcoSilver?: number;
  };
}

export function KitcoPriceCard({ dollarPrices }: KitcoPriceCardProps) {
  if (!dollarPrices || (!dollarPrices.kitcoGold && !dollarPrices.kitcoSilver)) {
    return null;
  }

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder h="100%" style={{ width: '100%' }}>
      <Group mb="md" gap="xs">
        <IconCurrencyDollar size={20} />
        <Text fw={600} size="lg">
          قیمت‌های بین‌المللی (Kitco)
        </Text>
      </Group>
      <Stack gap="md" justify="flex-start">
        {dollarPrices.kitcoGold && dollarPrices.kitcoGold > 0 && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              طلا:
            </Text>
            <Badge color="yellow" size="lg" variant="light">
              ${dollarPrices.kitcoGold.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Badge>
          </Group>
        )}
        {dollarPrices.kitcoSilver && dollarPrices.kitcoSilver > 0 && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              نقره:
            </Text>
            <Badge color="gray" size="lg" variant="light">
              ${dollarPrices.kitcoSilver.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Badge>
          </Group>
        )}
      </Stack>
    </Paper>
  );
}


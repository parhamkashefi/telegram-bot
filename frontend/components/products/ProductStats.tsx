'use client';

import { 
  SimpleGrid, 
  Card, 
  Text, 
  Group, 
  ThemeIcon, 
  Box,
  Progress,
  Stack,
  Skeleton
} from '@mantine/core';
import { 
  IconPackage, 
  IconCoin, 
  IconDiamond, 
  IconEye,
  IconEyeOff,
  IconTrendingUp,
  IconCurrencyDollar
} from '@tabler/icons-react';
import { formatPrice } from '@/lib/utils';

interface ProductStatsProps {
  stats: {
    total: number;
    available: number;
    unavailable: number;
    gold: number;
    silver: number;
    totalValue: number;
    totalProfit: number;
  };
  loading?: boolean;
}

export function ProductStats({ stats, loading }: ProductStatsProps) {
  if (loading) {
    return (
      <SimpleGrid cols={{ base: 2, sm: 4, lg: 7 }} mb="xl">
        {Array.from({ length: 7 }).map((_, index) => (
          <Card key={index} shadow="sm" padding="lg" radius="md" withBorder>
            <Skeleton height={60} />
          </Card>
        ))}
      </SimpleGrid>
    );
  }

  const availabilityPercentage = stats.total > 0 ? (stats.available / stats.total) * 100 : 0;
  const goldPercentage = stats.total > 0 ? (stats.gold / stats.total) * 100 : 0;

  return (
    <SimpleGrid cols={{ base: 2, sm: 4, lg: 7 }} mb="xl">
      {/* Total Products */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between">
          <Box>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed">
              کل محصولات
            </Text>
            <Text fw={700} size="xl">
              {stats.total}
            </Text>
          </Box>
          <ThemeIcon color="blue" size="xl" radius="md">
            <IconPackage size={28} />
          </ThemeIcon>
        </Group>
      </Card>

      {/* Available Products */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between">
          <Box>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed">
              موجود
            </Text>
            <Text fw={700} size="xl" c="green">
              {stats.available}
            </Text>
          </Box>
          <ThemeIcon color="green" size="xl" radius="md">
            <IconEye size={28} />
          </ThemeIcon>
        </Group>
      </Card>

      {/* Unavailable Products */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between">
          <Box>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed">
              ناموجود
            </Text>
            <Text fw={700} size="xl" c="red">
              {stats.unavailable}
            </Text>
          </Box>
          <ThemeIcon color="red" size="xl" radius="md">
            <IconEyeOff size={28} />
          </ThemeIcon>
        </Group>
      </Card>

      {/* Gold Products */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between">
          <Box>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed">
              محصولات طلا
            </Text>
            <Text fw={700} size="xl" c="yellow.7">
              {stats.gold}
            </Text>
          </Box>
          <ThemeIcon color="yellow" size="xl" radius="md">
            <IconCoin size={28} />
          </ThemeIcon>
        </Group>
      </Card>

      {/* Silver Products */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between">
          <Box>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed">
              محصولات نقره
            </Text>
            <Text fw={700} size="xl" c="gray.7">
              {stats.silver}
            </Text>
          </Box>
          <ThemeIcon color="gray" size="xl" radius="md">
            <IconDiamond size={28} />
          </ThemeIcon>
        </Group>
      </Card>

      {/* Total Value */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="xs">
          <Group justify="space-between">
            <Box>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                ارزش کل
              </Text>
              <Text fw={700} size="sm" c="blue">
                {formatPrice(stats.totalValue)}
              </Text>
            </Box>
            <ThemeIcon color="blue" size="lg" radius="md">
              <IconCurrencyDollar size={20} />
            </ThemeIcon>
          </Group>
          <Progress 
            value={availabilityPercentage} 
            color="blue" 
            size="xs" 
            radius="xl" 
          />
          <Text size="xs" c="dimmed">
            {availabilityPercentage.toFixed(1)}% موجود
          </Text>
        </Stack>
      </Card>

      {/* Total Profit */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="xs">
          <Group justify="space-between">
            <Box>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                سود کل
              </Text>
              <Text fw={700} size="sm" c="green">
                {formatPrice(stats.totalProfit)}
              </Text>
            </Box>
            <ThemeIcon color="green" size="lg" radius="md">
              <IconTrendingUp size={20} />
            </ThemeIcon>
          </Group>
          <Progress 
            value={goldPercentage} 
            color="yellow" 
            size="xs" 
            radius="xl" 
          />
          <Text size="xs" c="dimmed">
            {goldPercentage.toFixed(1)}% طلا
          </Text>
        </Stack>
      </Card>
    </SimpleGrid>
  );
}

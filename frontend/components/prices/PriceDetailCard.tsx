'use client';

import { 
  Card, 
  Text, 
  Group, 
  Stack, 
  Badge, 
  Loader, 
  Progress,
  Box,
  ThemeIcon,
  Divider,
  Grid
} from '@mantine/core';
import { 
  IconCoin, 
  IconDiamond, 
  IconTrendingUp, 
  IconTrendingDown,
  IconClock
} from '@tabler/icons-react';
import { formatPrice, getTimeAgo } from '@/lib/utils';
import type { Price } from '@/types';

interface PriceDetailCardProps {
  price: Price | null;
  loading?: boolean;
  material: 'gold' | 'silver';
}

export function PriceDetailCard({ price, loading, material }: PriceDetailCardProps) {
  if (loading) {
    return (
      <Card shadow="lg" padding="xl" radius="lg" withBorder>
        <Stack align="center" gap="xl">
          <Loader size="lg" />
          <Text size="lg" c="dimmed">
            در حال بارگذاری قیمت‌ها...
          </Text>
        </Stack>
      </Card>
    );
  }

  if (!price || !price.prices) {
    return (
      <Card shadow="lg" padding="xl" radius="lg" withBorder>
        <Text size="lg" c="dimmed" ta="center">
          داده‌ای موجود نیست
        </Text>
      </Card>
    );
  }

  const prices = Object.values(price.prices).filter((p) => p > 0);
  const averagePrice = prices.length > 0 
    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const priceRange = maxPrice - minPrice;
  const priceVariation = averagePrice > 0 ? ((priceRange / averagePrice) * 100).toFixed(1) : '0';

  const materialConfig = {
    gold: {
      color: 'yellow',
      gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
      icon: IconCoin,
      title: 'طلا',
      bgColor: '#FFF8DC'
    },
    silver: {
      color: 'gray',
      gradient: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
      icon: IconDiamond,
      title: 'نقره',
      bgColor: '#F8F8FF'
    }
  };

  const config = materialConfig[material];
  const Icon = config.icon;

  return (
    <Card 
      shadow="lg" 
      padding="xl" 
      radius="lg" 
      withBorder
      style={{ background: config.bgColor }}
    >
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Group gap="md">
            <ThemeIcon 
              size="xl" 
              radius="lg"
              variant="gradient"
              gradient={{ from: config.color + '.4', to: config.color + '.7', deg: 135 }}
            >
              <Icon size={28} />
            </ThemeIcon>
            <Box>
              <Text size="xl" fw={700} c={config.color + '.8'}>
                قیمت لحظه‌ای {config.title}
              </Text>
              <Group gap="xs" mt={4}>
                <IconClock size={14} />
                <Text size="sm" c="dimmed">
                  {price.fetchedAtIran || (price.createdAt && getTimeAgo(price.createdAt))}
                </Text>
              </Group>
            </Box>
          </Group>
          <Badge
            size="lg"
            variant="gradient"
            gradient={{ from: config.color + '.4', to: config.color + '.7', deg: 135 }}
          >
            {Object.keys(price.prices).length} منبع
          </Badge>
        </Group>

        <Divider />

        {/* Main Price Display */}
        <Box ta="center">
          <Text 
            size="3rem" 
            fw={900} 
            variant="gradient"
            gradient={{ from: config.color + '.6', to: config.color + '.9', deg: 135 }}
            lh={1}
          >
            {formatPrice(maxPrice)}
          </Text>
          <Text size="lg" c="dimmed" mt={4}>
            تومان (بیشترین قیمت)
          </Text>
        </Box>

        {/* Price Statistics */}
        <Grid>
          <Grid.Col span={4}>
            <Stack gap={4} ta="center">
              <Group justify="center" gap="xs">
                <IconTrendingUp size={16} color="green" />
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  بیشترین
                </Text>
              </Group>
              <Text size="lg" fw={700} c="green">
                {formatPrice(maxPrice)}
              </Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={4}>
            <Stack gap={4} ta="center">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                میانگین
              </Text>
              <Text size="lg" fw={700} c="blue">
                {formatPrice(averagePrice)}
              </Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={4}>
            <Stack gap={4} ta="center">
              <Group justify="center" gap="xs">
                <IconTrendingDown size={16} color="red" />
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  کمترین
                </Text>
              </Group>
              <Text size="lg" fw={700} c="red">
                {formatPrice(minPrice)}
              </Text>
            </Stack>
          </Grid.Col>
        </Grid>

        {/* Price Variation Indicator */}
        <Box>
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">
              نوسان قیمت
            </Text>
            <Text size="sm" fw={600} c="orange">
              {priceVariation}%
            </Text>
          </Group>
          <Progress 
            value={Math.min(parseFloat(priceVariation), 100)} 
            color={parseFloat(priceVariation) > 5 ? 'red' : parseFloat(priceVariation) > 2 ? 'orange' : 'green'}
            size="sm"
            radius="xl"
          />
        </Box>
      </Stack>
    </Card>
  );
}


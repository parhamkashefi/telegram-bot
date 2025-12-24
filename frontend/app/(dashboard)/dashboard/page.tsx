'use client';

import { 
  Container, 
  Grid, 
  Title, 
  Stack, 
  Paper, 
  Text, 
  Group,
  Badge,
  SimpleGrid,
  Progress,
  Box,
  ThemeIcon,
  Card,
  RingProgress,
  Center
} from '@mantine/core';
import { useState, useEffect } from 'react';
import { 
  IconTrendingUp, 
  IconTrendingDown, 
  IconCoin,
  IconDiamond,
  IconCurrencyDollar,
  IconRefresh,
  IconClock,
  IconActivity,
  IconUsers,
  IconDatabase
} from '@tabler/icons-react';
import { PriceCard } from '@/components/prices/PriceCard';
import { PriceComparisonTable } from '@/components/prices/PriceComparisonTable';
import { formatPrice } from '@/lib/utils';
import type { Price } from '@/types';

// Mock data for Gold
const mockGoldData: Price = {
  _id: 'mock-gold-1',
  productMaterial: 'gold',
  productType: 'ball',
  prices: {
    'estjt.ir': 2500000,
    'tv.tablotala.app': 2495000,
    'tabangohar.com': 2510000,
    'tala.ir': 2505000,
    'source5.com': 2498000,
  },
  dollarPrices: {
    kitcoGold: 2650.50,
  },
  fetchedAtIran: '1402/09/15 - 14:30:00',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock data for Silver
const mockSilverData: Price = {
  _id: 'mock-silver-1',
  productMaterial: 'silver',
  productType: 'bar',
  prices: {
    'sarzamineshemsh.ir': 150000,
    'noghra.com': 152000,
    'tokeniko.com': 151500,
    'silverin.ir': 150500,
    'noghresea.ir': 151000,
    'tajnoghreh.com': 150800,
  },
  weightPrices: [
    {
      site: 'tokeniko.com',
      weights: [
        { weight: '10g', price: 150000, available: true },
        { weight: '20g', price: 300000, available: true },
        { weight: '1oz', price: 4700000, available: true },
        { weight: '50g', price: 750000, available: true },
        { weight: '100g', price: 1500000, available: true },
        { weight: '250g', price: 3750000, available: false },
        { weight: '500g', price: 7500000, available: true },
      ],
    },
  ],
  dollarPrices: {
    kitcoSilver: 28.75,
  },
  fetchedAtIran: '1402/09/15 - 14:30:00',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock statistics
const mockStats = {
  totalSources: 11,
  activeUpdates: 24,
  lastUpdate: '2 دقیقه پیش',
  systemUptime: 99.8,
  dailyRequests: 1247,
  avgResponseTime: 0.8
};

export default function DashboardPage() {
  const [goldData, setGoldData] = useState<Price | null>(null);
  const [silverData, setSilverData] = useState<Price | null>(null);
  const [goldLoading, setGoldLoading] = useState(true);
  const [silverLoading, setSilverLoading] = useState(true);

  // Simulate API loading with mock data
  useEffect(() => {
    setTimeout(() => {
      setGoldData(mockGoldData);
      setGoldLoading(false);
    }, 500);

    setTimeout(() => {
      setSilverData(mockSilverData);
      setSilverLoading(false);
    }, 700);
  }, []);

  // Calculate price statistics
  const goldPrices = goldData?.prices ? Object.values(goldData.prices).filter(p => p > 0) : [];
  const silverPrices = silverData?.prices ? Object.values(silverData.prices).filter(p => p > 0) : [];
  
  const goldAvg = goldPrices.length > 0 ? Math.round(goldPrices.reduce((a, b) => a + b, 0) / goldPrices.length) : 0;
  const silverAvg = silverPrices.length > 0 ? Math.round(silverPrices.reduce((a, b) => a + b, 0) / silverPrices.length) : 0;

  return (
    <Container size="xl" py="xl">
      {/* Header Section */}
      <Group justify="space-between" mb="xl">
        <Box>
          <Title order={1} mb="xs">
            داشبورد مدیریت
          </Title>
          <Text size="sm" c="dimmed">
            نمای کلی از سیستم قیمت‌گذاری طلا و نقره
          </Text>
        </Box>
        <Group gap="xs">
          <Badge variant="light" color="green" size="lg">
            آنلاین
          </Badge>
          <Text size="sm" c="dimmed">
            آخرین به‌روزرسانی: {mockStats.lastUpdate}
          </Text>
        </Group>
      </Group>

      {/* Quick Stats Cards */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <Box>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                منابع فعال
              </Text>
              <Text fw={700} size="xl">
                {mockStats.totalSources}
              </Text>
            </Box>
            <ThemeIcon color="blue" size="xl" radius="md">
              <IconDatabase size={28} />
            </ThemeIcon>
          </Group>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <Box>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                به‌روزرسانی امروز
              </Text>
              <Text fw={700} size="xl">
                {mockStats.activeUpdates}
              </Text>
            </Box>
            <ThemeIcon color="green" size="xl" radius="md">
              <IconActivity size={28} />
            </ThemeIcon>
          </Group>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <Box>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                درخواست‌های امروز
              </Text>
              <Text fw={700} size="xl">
                {mockStats.dailyRequests.toLocaleString('fa-IR')}
              </Text>
            </Box>
            <ThemeIcon color="orange" size="xl" radius="md">
              <IconUsers size={28} />
            </ThemeIcon>
          </Group>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <Box>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                زمان پاسخ میانگین
              </Text>
              <Text fw={700} size="xl">
                {mockStats.avgResponseTime}s
              </Text>
            </Box>
            <ThemeIcon color="teal" size="xl" radius="md">
              <IconClock size={28} />
            </ThemeIcon>
          </Group>
        </Card>
      </SimpleGrid>

      {/* Main Price Cards */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, md: 4 }} style={{ display: 'flex', minWidth: 0 }}>
          <Card shadow="lg" padding="xl" radius="lg" withBorder style={{ background: '#FFF8DC', width: '100%', height: '100%' }}>
            <Stack gap="md" justify="space-between" style={{ height: '100%' }}>
              <Group justify="space-between">
                <Group gap="md">
                  <ThemeIcon size="xl" radius="lg" variant="gradient" 
                           gradient={{ from: 'yellow.4', to: 'yellow.7', deg: 135 }}>
                    <IconCoin size={28} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={700} size="lg" c="yellow.8">
                      قیمت طلا
                    </Text>
                    <Text size="sm" c="dimmed">
                      {goldPrices.length} منبع
                    </Text>
                  </Box>
                </Group>
                <IconTrendingUp size={20} color="green" />
              </Group>
              
              <Box ta="center">
                <Text size="2.5rem" fw={900} variant="gradient" 
                      gradient={{ from: 'yellow.6', to: 'yellow.9', deg: 135 }} lh={1}>
                  {goldLoading ? '...' : formatPrice(Math.max(...goldPrices))}
                </Text>
                <Text size="sm" c="dimmed" mt={4}>
                  تومان (بیشترین قیمت)
                </Text>
                {!goldLoading && (
                  <Text size="xs" c="dimmed" mt="xs">
                    میانگین: {formatPrice(goldAvg)} تومان
                  </Text>
                )}
              </Box>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }} style={{ display: 'flex', minWidth: 0 }}>
          <Card shadow="lg" padding="xl" radius="lg" withBorder style={{ background: '#F8F8FF', width: '100%', height: '100%' }}>
            <Stack gap="md" justify="space-between" style={{ height: '100%' }}>
              <Group justify="space-between">
                <Group gap="md">
                  <ThemeIcon size="xl" radius="lg" variant="gradient" 
                           gradient={{ from: 'gray.4', to: 'gray.7', deg: 135 }}>
                    <IconDiamond size={28} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={700} size="lg" c="gray.8">
                      قیمت نقره
                    </Text>
                    <Text size="sm" c="dimmed">
                      {silverPrices.length} منبع
                    </Text>
                  </Box>
                </Group>
                <IconTrendingUp size={20} color="green" />
              </Group>
              
              <Box ta="center">
                <Text size="2.5rem" fw={900} variant="gradient" 
                      gradient={{ from: 'gray.6', to: 'gray.9', deg: 135 }} lh={1}>
                  {silverLoading ? '...' : formatPrice(Math.max(...silverPrices))}
                </Text>
                <Text size="sm" c="dimmed" mt={4}>
                  تومان (بیشترین قیمت)
                </Text>
                {!silverLoading && (
                  <Text size="xs" c="dimmed" mt="xs">
                    میانگین: {formatPrice(silverAvg)} تومان
                  </Text>
                )}
              </Box>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }} style={{ display: 'flex', minWidth: 0 }}>
          <Card shadow="lg" padding="xl" radius="lg" withBorder style={{ width: '100%', height: '100%' }}>
            <Stack gap="md" justify="space-between" style={{ height: '100%' }}>
              <Group justify="space-between">
                <Group gap="md">
                  <ThemeIcon size="xl" radius="lg" variant="gradient" 
                           gradient={{ from: 'blue.4', to: 'blue.7', deg: 135 }}>
                    <IconCurrencyDollar size={28} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={700} size="lg" c="blue.8">
                      قیمت‌های بین‌المللی
                    </Text>
                    <Text size="sm" c="dimmed">
                      Kitco
                    </Text>
                  </Box>
                </Group>
              </Group>
              
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">طلا:</Text>
                  <Badge color="yellow" size="lg" variant="light">
                    ${goldData?.dollarPrices?.kitcoGold?.toFixed(2) || '0.00'}
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">نقره:</Text>
                  <Badge color="gray" size="lg" variant="light">
                    ${silverData?.dollarPrices?.kitcoSilver?.toFixed(2) || '0.00'}
                  </Badge>
                </Group>
              </Stack>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* System Health */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <PriceComparisonTable
            goldData={goldData}
            silverData={silverData}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper shadow="sm" p="lg" radius="md" withBorder h="100%">
            <Stack gap="lg">
              <Text fw={600} size="lg">
                وضعیت سیستم
              </Text>
              
              <Center>
                <RingProgress
                  size={120}
                  thickness={8}
                  sections={[{ value: mockStats.systemUptime, color: 'green' }]}
                  label={
                    <Text c="green" fw={700} ta="center" size="lg">
                      {mockStats.systemUptime}%
                    </Text>
                  }
                />
              </Center>
              
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">آپتایم سیستم</Text>
                  <Text size="sm" fw={600} c="green">عالی</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">آخرین خطا</Text>
                  <Text size="sm" fw={600}>هیچ</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">حافظه استفاده شده</Text>
                  <Text size="sm" fw={600}>68%</Text>
                </Group>
              </Stack>
              
              <Progress value={68} color="blue" size="sm" radius="xl" />
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}


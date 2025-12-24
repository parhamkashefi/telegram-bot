'use client';

import { 
  Container, 
  Tabs, 
  Grid, 
  Stack, 
  Text, 
  Paper,
  Group,
  ActionIcon,
  Tooltip,
  Divider,
  Box
} from '@mantine/core';
import { useState, useEffect } from 'react';
import { 
  IconCoin, 
  IconDiamond, 
  IconRefresh,
  IconTrendingUp
} from '@tabler/icons-react';
import { PriceDetailCard } from '@/components/prices/PriceDetailCard';
import { PriceSourceTable } from '@/components/prices/PriceSourceTable';
import { PriceStats } from '@/components/prices/PriceStats';
import { SilverWeightTable } from '@/components/prices/SilverWeightTable';
import { KitcoPriceCard } from '@/components/prices/KitcoPriceCard';
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
    {
      site: 'parsisgold.com',
      weights: [
        { weight: '1oz', price: 4750000, available: true },
        { weight: '50g', price: 760000, available: true },
        { weight: '100g', price: 1520000, available: true },
      ],
    },
    {
      site: 'zioto.gold',
      weights: [
        { weight: '1oz', price: 4720000, available: true },
        { weight: '50g', price: 755000, available: true },
        { weight: '100g', price: 1510000, available: true },
        { weight: '250g', price: 3775000, available: true },
        { weight: '500g', price: 7550000, available: true },
        { weight: '1000g', price: 15100000, available: true },
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

export default function PricesPage() {
  const [goldData, setGoldData] = useState<Price | null>(null);
  const [silverData, setSilverData] = useState<Price | null>(null);
  const [goldLoading, setGoldLoading] = useState(true);
  const [silverLoading, setSilverLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <Container size="xl" py="xl">
      {/* Header Section */}
      <Paper 
        shadow="sm" 
        p="xl" 
        radius="lg" 
        withBorder 
        mb="xl" 
        style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Group justify="space-between" align="center">
          <Box>
            <Group gap="md" mb="xs">
              <IconTrendingUp size={32} />
              <Text size="xl" fw={700}>
                قیمت‌های لحظه‌ای طلا و نقره
              </Text>
            </Group>
            <Text size="sm" opacity={0.9}>
              آخرین به‌روزرسانی: {mockGoldData.fetchedAtIran}
            </Text>
          </Box>
          <Tooltip label="به‌روزرسانی قیمت‌ها">
            <ActionIcon 
              variant="white" 
              size="lg" 
              loading={refreshing}
              onClick={handleRefresh}
            >
              <IconRefresh size={20} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Paper>

      <Tabs defaultValue="gold" variant="pills" radius="md">
        <Tabs.List grow>
          <Tabs.Tab 
            value="gold" 
            leftSection={<IconCoin size={20} />}
            style={{ fontSize: '16px', fontWeight: 600 }}
          >
            قیمت طلا
          </Tabs.Tab>
          <Tabs.Tab 
            value="silver" 
            leftSection={<IconDiamond size={20} />}
            style={{ fontSize: '16px', fontWeight: 600 }}
          >
            قیمت نقره
          </Tabs.Tab>
        </Tabs.List>

        {/* Gold Tab */}
        <Tabs.Panel value="gold" pt="xl">
          <Stack gap="xl">
            {/* Main Price Card */}
            <PriceDetailCard
              price={goldData}
              loading={goldLoading}
              material="gold"
            />

            {goldData && (
              <>
                {/* Stats and International Prices Row */}
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }} style={{ display: 'flex', minWidth: 0 }}>
                    <PriceStats 
                      prices={goldData.prices || {}} 
                      title="آمار قیمت طلا" 
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }} style={{ display: 'flex', minWidth: 0 }}>
                    <KitcoPriceCard dollarPrices={goldData.dollarPrices} />
                  </Grid.Col>
                </Grid>

                <Divider my="md" />

                {/* Price Sources Table */}
                <PriceSourceTable price={goldData} material="gold" />
              </>
            )}
          </Stack>
        </Tabs.Panel>

        {/* Silver Tab */}
        <Tabs.Panel value="silver" pt="xl">
          <Stack gap="xl">
            {/* Main Price Card */}
            <PriceDetailCard
              price={silverData}
              loading={silverLoading}
              material="silver"
            />

            {silverData && (
              <>
                {/* Stats and International Prices Row */}
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }} style={{ display: 'flex', minWidth: 0 }}>
                    <PriceStats 
                      prices={silverData.prices || {}} 
                      title="آمار قیمت نقره" 
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }} style={{ display: 'flex', minWidth: 0 }}>
                    <KitcoPriceCard dollarPrices={silverData.dollarPrices} />
                  </Grid.Col>
                </Grid>

                <Divider my="md" />

                {/* Price Sources Table */}
                <PriceSourceTable price={silverData} material="silver" />

                <Divider my="md" />

                {/* Silver Weight Table */}
                <SilverWeightTable price={silverData} />
              </>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}


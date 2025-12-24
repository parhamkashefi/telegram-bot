'use client';

import { 
  Table, 
  Paper, 
  Title, 
  Text, 
  Badge, 
  Group, 
  Stack,
  ThemeIcon,
  Box,
  Progress,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import { 
  IconTrendingUp, 
  IconTrendingDown, 
  IconMinus,
  IconCrown,
  IconArrowsSort,
  IconRefresh
} from '@tabler/icons-react';
import { formatPrice } from '@/lib/utils';
import { useState } from 'react';
import type { Price } from '@/types';

interface PriceComparisonTableProps {
  goldData: Price | null;
  silverData: Price | null;
}

type SortField = 'source' | 'gold' | 'silver' | 'difference';
type SortOrder = 'asc' | 'desc';

export function PriceComparisonTable({
  goldData,
  silverData,
}: PriceComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField>('source');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Combine all price sources with their data
  const allSources = new Set<string>();
  
  if (goldData?.prices) {
    Object.keys(goldData.prices).forEach((source) => allSources.add(source));
  }
  
  if (silverData?.prices) {
    Object.keys(silverData.prices).forEach((source) => allSources.add(source));
  }

  // Create enhanced source data
  const sourceData = Array.from(allSources).map((source) => {
    const goldPrice = goldData?.prices?.[source] || 0;
    const silverPrice = silverData?.prices?.[source] || 0;
    const difference = goldPrice > 0 && silverPrice > 0 ? goldPrice - silverPrice : 0;
    
    return {
      source,
      goldPrice,
      silverPrice,
      difference,
      hasGold: goldPrice > 0,
      hasSilver: silverPrice > 0,
      hasBoth: goldPrice > 0 && silverPrice > 0
    };
  });

  // Calculate statistics
  const goldPrices = sourceData.filter(s => s.hasGold).map(s => s.goldPrice);
  const silverPrices = sourceData.filter(s => s.hasSilver).map(s => s.silverPrice);
  
  const goldMax = goldPrices.length > 0 ? Math.max(...goldPrices) : 0;
  const goldMin = goldPrices.length > 0 ? Math.min(...goldPrices) : 0;
  const silverMax = silverPrices.length > 0 ? Math.max(...silverPrices) : 0;
  const silverMin = silverPrices.length > 0 ? Math.min(...silverPrices) : 0;

  // Sort data
  const sortedData = [...sourceData].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'source':
        aValue = a.source;
        bValue = b.source;
        break;
      case 'gold':
        aValue = a.goldPrice;
        bValue = b.goldPrice;
        break;
      case 'silver':
        aValue = a.silverPrice;
        bValue = b.silverPrice;
        break;
      case 'difference':
        aValue = a.difference;
        bValue = b.difference;
        break;
      default:
        aValue = a.source;
        bValue = b.source;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    
    return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  if (sourceData.length === 0) {
    return (
      <Paper shadow="sm" p="lg" radius="md" withBorder>
        <Text c="dimmed" ta="center">
          داده‌ای برای نمایش وجود ندارد
        </Text>
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder>
      <Group justify="space-between" mb="lg">
        <Box>
          <Title order={3} mb="xs">
            مقایسه قیمت‌ها از منابع مختلف
          </Title>
          <Text size="sm" c="dimmed">
            {sourceData.length} منبع • {goldPrices.length} طلا • {silverPrices.length} نقره
          </Text>
        </Box>
        <Group gap="xs">
          <Badge variant="light" color="green">
            آنلاین
          </Badge>
          <Tooltip label="به‌روزرسانی">
            <ActionIcon variant="light" size="sm">
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* Statistics Summary */}
      <Group mb="lg" gap="xl">
        <Stack gap={4}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            طلا - بیشترین
          </Text>
          <Text fw={700} c="yellow.7">
            {goldMax > 0 ? formatPrice(goldMax) : '-'}
          </Text>
        </Stack>
        <Stack gap={4}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            طلا - کمترین
          </Text>
          <Text fw={700} c="yellow.7">
            {goldMin > 0 ? formatPrice(goldMin) : '-'}
          </Text>
        </Stack>
        <Stack gap={4}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            نقره - بیشترین
          </Text>
          <Text fw={700} c="gray.7">
            {silverMax > 0 ? formatPrice(silverMax) : '-'}
          </Text>
        </Stack>
        <Stack gap={4}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            نقره - کمترین
          </Text>
          <Text fw={700} c="gray.7">
            {silverMin > 0 ? formatPrice(silverMin) : '-'}
          </Text>
        </Stack>
      </Group>

      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th 
              style={{ cursor: 'pointer' }}
              onClick={() => handleSort('source')}
            >
              <Group gap="xs">
                <Text fw={600}>منبع</Text>
                <IconArrowsSort size={14} />
              </Group>
            </Table.Th>
            <Table.Th 
              style={{ cursor: 'pointer' }}
              onClick={() => handleSort('gold')}
            >
              <Group gap="xs">
                <Text fw={600}>قیمت طلا (تومان)</Text>
                <IconArrowsSort size={14} />
              </Group>
            </Table.Th>
            <Table.Th 
              style={{ cursor: 'pointer' }}
              onClick={() => handleSort('silver')}
            >
              <Group gap="xs">
                <Text fw={600}>قیمت نقره (تومان)</Text>
                <IconArrowsSort size={14} />
              </Group>
            </Table.Th>
            <Table.Th>
              <Text fw={600}>اختلاف</Text>
            </Table.Th>
            <Table.Th>
              <Text fw={600}>وضعیت</Text>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sortedData.map((item) => {
            const isGoldMax = item.goldPrice === goldMax && goldMax > 0;
            const isGoldMin = item.goldPrice === goldMin && goldMin > 0 && goldMin !== goldMax;
            const isSilverMax = item.silverPrice === silverMax && silverMax > 0;
            const isSilverMin = item.silverPrice === silverMin && silverMin > 0 && silverMin !== silverMax;

            return (
              <Table.Tr key={item.source}>
                <Table.Td>
                  <Group gap="xs">
                    <Text fw={500}>{item.source}</Text>
                    {(isGoldMax || isSilverMax) && (
                      <ThemeIcon size="xs" color="yellow" variant="light">
                        <IconCrown size={10} />
                      </ThemeIcon>
                    )}
                  </Group>
                </Table.Td>
                
                <Table.Td>
                  {item.hasGold ? (
                    <Group gap="xs">
                      <Text fw={600} c="yellow.7">
                        {formatPrice(item.goldPrice)}
                      </Text>
                      {isGoldMax && (
                        <Badge size="xs" color="green" variant="light">
                          بیشترین
                        </Badge>
                      )}
                      {isGoldMin && (
                        <Badge size="xs" color="red" variant="light">
                          کمترین
                        </Badge>
                      )}
                    </Group>
                  ) : (
                    <Text c="dimmed">-</Text>
                  )}
                </Table.Td>
                
                <Table.Td>
                  {item.hasSilver ? (
                    <Group gap="xs">
                      <Text fw={600} c="gray.7">
                        {formatPrice(item.silverPrice)}
                      </Text>
                      {isSilverMax && (
                        <Badge size="xs" color="green" variant="light">
                          بیشترین
                        </Badge>
                      )}
                      {isSilverMin && (
                        <Badge size="xs" color="red" variant="light">
                          کمترین
                        </Badge>
                      )}
                    </Group>
                  ) : (
                    <Text c="dimmed">-</Text>
                  )}
                </Table.Td>
                
                <Table.Td>
                  {item.hasBoth ? (
                    <Group gap="xs">
                      {item.difference > 0 ? (
                        <IconTrendingUp size={16} color="green" />
                      ) : item.difference < 0 ? (
                        <IconTrendingDown size={16} color="red" />
                      ) : (
                        <IconMinus size={16} color="gray" />
                      )}
                      <Text 
                        size="sm" 
                        c={item.difference > 0 ? 'green' : item.difference < 0 ? 'red' : 'gray'}
                        fw={500}
                      >
                        {formatPrice(Math.abs(item.difference))}
                      </Text>
                    </Group>
                  ) : (
                    <Text c="dimmed">-</Text>
                  )}
                </Table.Td>
                
                <Table.Td>
                  <Group gap="xs">
                    {item.hasGold && (
                      <Badge size="xs" color="yellow" variant="light">
                        طلا
                      </Badge>
                    )}
                    {item.hasSilver && (
                      <Badge size="xs" color="gray" variant="light">
                        نقره
                      </Badge>
                    )}
                    {item.hasBoth && (
                      <Badge size="xs" color="blue" variant="light">
                        کامل
                      </Badge>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>

      {/* Price Range Indicators */}
      {goldPrices.length > 0 && (
        <Box mt="lg">
          <Text size="sm" fw={600} mb="xs">
            نوسان قیمت طلا
          </Text>
          <Progress 
            value={goldMax > 0 ? ((goldMax - goldMin) / goldMax) * 100 : 0}
            color="yellow"
            size="sm"
            radius="xl"
          />
          <Group justify="space-between" mt="xs">
            <Text size="xs" c="dimmed">
              کمترین: {formatPrice(goldMin)}
            </Text>
            <Text size="xs" c="dimmed">
              بیشترین: {formatPrice(goldMax)}
            </Text>
          </Group>
        </Box>
      )}
    </Paper>
  );
}


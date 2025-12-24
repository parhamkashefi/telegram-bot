'use client';

import { Table, Paper, Title, Text, Badge } from '@mantine/core';
import { formatPrice } from '@/lib/utils';
import type { Price } from '@/types';

interface PriceSourceTableProps {
  price: Price | null;
  material: 'gold' | 'silver';
}

export function PriceSourceTable({ price, material }: PriceSourceTableProps) {
  if (!price || !price.prices) {
    return (
      <Paper shadow="sm" p="lg" radius="md" withBorder>
        <Text c="dimmed" ta="center">
          داده‌ای برای نمایش وجود ندارد
        </Text>
      </Paper>
    );
  }

  const prices = price.prices;
  const sources = Object.entries(prices)
    .filter(([_, value]) => value > 0)
    .sort(([_, a], [__, b]) => b - a); // Sort by price descending

  if (sources.length === 0) {
    return (
      <Paper shadow="sm" p="lg" radius="md" withBorder>
        <Text c="dimmed" ta="center">
          قیمت معتبری یافت نشد
        </Text>
      </Paper>
    );
  }

  const maxPrice = Math.max(...sources.map(([_, price]) => price));
  const minPrice = Math.min(...sources.map(([_, price]) => price));

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder>
      <Title order={3} mb="md">
        قیمت‌ها از منابع مختلف
      </Title>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>منبع</Table.Th>
            <Table.Th>قیمت (تومان)</Table.Th>
            <Table.Th>وضعیت</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sources.map(([source, priceValue]) => {
            const isMax = priceValue === maxPrice;
            const isMin = priceValue === minPrice;

            return (
              <Table.Tr key={source}>
                <Table.Td>
                  <Text fw={500}>{source}</Text>
                </Table.Td>
                <Table.Td>
                  <Text
                    fw={600}
                    c={material === 'gold' ? 'yellow.7' : 'gray.7'}
                    size="lg"
                  >
                    {formatPrice(priceValue)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {isMax && (
                    <Badge color="green" variant="light">
                      بیشترین
                    </Badge>
                  )}
                  {isMin && !isMax && (
                    <Badge color="red" variant="light">
                      کمترین
                    </Badge>
                  )}
                  {!isMax && !isMin && (
                    <Badge color="gray" variant="light">
                      متوسط
                    </Badge>
                  )}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}


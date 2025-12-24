'use client';

import { Table, Paper, Title, Text, Badge } from '@mantine/core';
import { formatPrice } from '@/lib/utils';
import type { Price } from '@/types';

interface SilverWeightTableProps {
  price: Price | null;
}

export function SilverWeightTable({ price }: SilverWeightTableProps) {
  if (!price || !price.weightPrices || price.weightPrices.length === 0) {
    return null;
  }

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder>
      <Title order={3} mb="md">
        قیمت شمش‌های نقره بر اساس وزن
      </Title>
      {price.weightPrices.map((siteData, index) => (
        <div key={index} style={{ marginBottom: index < price.weightPrices!.length - 1 ? 24 : 0 }}>
          <Text fw={600} size="sm" mb="sm" c="dimmed">
            {siteData.site}
          </Text>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>وزن</Table.Th>
                <Table.Th>قیمت (تومان)</Table.Th>
                <Table.Th>وضعیت</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {siteData.weights.map((weight, weightIndex) => (
                <Table.Tr key={weightIndex}>
                  <Table.Td>
                    <Text fw={500}>{weight.weight}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={600} c="gray.7">
                      {weight.price > 0 ? formatPrice(weight.price) : '-'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {weight.available && weight.price > 0 ? (
                      <Badge color="green" variant="light">
                        موجود
                      </Badge>
                    ) : (
                      <Badge color="red" variant="light">
                        ناموجود
                      </Badge>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      ))}
    </Paper>
  );
}


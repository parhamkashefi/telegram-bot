'use client';

import { 
  Table, 
  Paper, 
  Text, 
  Badge, 
  Group, 
  ActionIcon,
  Tooltip,
  ThemeIcon,
  Box,
  Skeleton,
  Stack
} from '@mantine/core';
import { 
  IconEdit, 
  IconTrash, 
  IconEye,
  IconEyeOff,
  IconCoin,
  IconDiamond
} from '@tabler/icons-react';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductTableProps {
  products: Product[];
  loading?: boolean;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onToggleStatus: (productId: string) => void;
}

export function ProductTable({ 
  products, 
  loading, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}: ProductTableProps) {
  if (loading) {
    return (
      <Paper shadow="sm" p="lg" radius="md" withBorder>
        <Stack gap="md">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} height={60} />
          ))}
        </Stack>
      </Paper>
    );
  }

  if (products.length === 0) {
    return (
      <Paper shadow="sm" p="lg" radius="md" withBorder>
        <Text c="dimmed" ta="center" py="xl">
          محصولی یافت نشد
        </Text>
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder>
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Text fw={600}>محصول</Text>
            </Table.Th>
            <Table.Th>
              <Text fw={600}>دسته‌بندی</Text>
            </Table.Th>
            <Table.Th>
              <Text fw={600}>وزن</Text>
            </Table.Th>
            <Table.Th>
              <Text fw={600}>قیمت خرید</Text>
            </Table.Th>
            <Table.Th>
              <Text fw={600}>قیمت فروش</Text>
            </Table.Th>
            <Table.Th>
              <Text fw={600}>سود</Text>
            </Table.Th>
            <Table.Th>
              <Text fw={600}>وضعیت</Text>
            </Table.Th>
            <Table.Th>
              <Text fw={600}>عملیات</Text>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {products.map((product) => {
            const profit = product.sellPrice - product.buyPrice;
            const profitPercentage = ((profit / product.buyPrice) * 100).toFixed(1);
            
            return (
              <Table.Tr key={product._id}>
                <Table.Td>
                  <Group gap="sm">
                    <ThemeIcon 
                      size="sm" 
                      color={product.category === 'gold' ? 'yellow' : 'gray'}
                      variant="light"
                    >
                      {product.category === 'gold' ? (
                        <IconCoin size={14} />
                      ) : (
                        <IconDiamond size={14} />
                      )}
                    </ThemeIcon>
                    <Box>
                      <Text fw={500} size="sm">
                        {product.productType === 'bar' ? 'شمش' : 'سکه'} {product.category === 'gold' ? 'طلا' : 'نقره'}
                      </Text>
                      <Text size="xs" c="dimmed">
                        شناسه: {product._id}
                      </Text>
                    </Box>
                  </Group>
                </Table.Td>
                
                <Table.Td>
                  <Badge 
                    color={product.category === 'gold' ? 'yellow' : 'gray'}
                    variant="light"
                  >
                    {product.category === 'gold' ? 'طلا' : 'نقره'}
                  </Badge>
                </Table.Td>
                
                <Table.Td>
                  <Text fw={500}>
                    {product.weight} گرم
                  </Text>
                </Table.Td>
                
                <Table.Td>
                  <Text fw={500} c="red.6">
                    {formatPrice(product.buyPrice)} تومان
                  </Text>
                </Table.Td>
                
                <Table.Td>
                  <Text fw={500} c="green.6">
                    {formatPrice(product.sellPrice)} تومان
                  </Text>
                </Table.Td>
                
                <Table.Td>
                  <Box>
                    <Text fw={500} c="blue.6">
                      {formatPrice(profit)} تومان
                    </Text>
                    <Text size="xs" c="dimmed">
                      {profitPercentage}% سود
                    </Text>
                  </Box>
                </Table.Td>
                
                <Table.Td>
                  <Group gap="xs">
                    <Badge 
                      color={product.exist ? 'green' : 'red'}
                      variant="light"
                    >
                      {product.exist ? 'موجود' : 'ناموجود'}
                    </Badge>
                    <ActionIcon
                      size="sm"
                      variant="light"
                      color={product.exist ? 'red' : 'green'}
                      onClick={() => onToggleStatus(product._id!)}
                    >
                      {product.exist ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                    </ActionIcon>
                  </Group>
                </Table.Td>
                
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="ویرایش">
                      <ActionIcon
                        size="sm"
                        variant="light"
                        color="blue"
                        onClick={() => onEdit(product)}
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="حذف">
                      <ActionIcon
                        size="sm"
                        variant="light"
                        color="red"
                        onClick={() => onDelete(product._id!)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}

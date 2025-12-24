'use client';

import { 
  Paper, 
  Group, 
  TextInput, 
  Select, 
  ActionIcon,
  Tooltip
} from '@mantine/core';
import { 
  IconSearch, 
  IconFilter,
  IconX
} from '@tabler/icons-react';

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
}

export function ProductFilters({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
}: ProductFiltersProps) {
  const handleClearFilters = () => {
    onSearchChange('');
    onCategoryChange('all');
    onTypeChange('all');
    onStatusChange('all');
  };

  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all';

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder mb="xl">
      <Group gap="md">
        <TextInput
          placeholder="جستجو در محصولات..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ flex: 1 }}
        />
        
        <Select
          placeholder="دسته‌بندی"
          data={[
            { value: 'all', label: 'همه دسته‌ها' },
            { value: 'gold', label: 'طلا' },
            { value: 'silver', label: 'نقره' },
          ]}
          value={categoryFilter}
          onChange={(value) => onCategoryChange(value || 'all')}
          w={150}
        />
        
        <Select
          placeholder="نوع محصول"
          data={[
            { value: 'all', label: 'همه انواع' },
            { value: 'bar', label: 'شمش' },
            { value: 'ball', label: 'سکه' },
          ]}
          value={typeFilter}
          onChange={(value) => onTypeChange(value || 'all')}
          w={150}
        />
        
        <Select
          placeholder="وضعیت"
          data={[
            { value: 'all', label: 'همه وضعیت‌ها' },
            { value: 'available', label: 'موجود' },
            { value: 'unavailable', label: 'ناموجود' },
          ]}
          value={statusFilter}
          onChange={(value) => onStatusChange(value || 'all')}
          w={150}
        />

        {hasActiveFilters && (
          <Tooltip label="پاک کردن فیلترها">
            <ActionIcon 
              variant="light" 
              color="red" 
              onClick={handleClearFilters}
            >
              <IconX size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
    </Paper>
  );
}

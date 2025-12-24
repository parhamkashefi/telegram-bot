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
  Button,
  ActionIcon,
  Tooltip,
  Box,
  ThemeIcon,
  Card,
  Modal,
  TextInput,
  Select,
  NumberInput,
  Switch,
  Tabs
} from '@mantine/core';
import { useState, useEffect } from 'react';
import { 
  IconPlus,
  IconSearch,
  IconFilter,
  IconPackage,
  IconCoin,
  IconDiamond,
  IconTrendingUp,
  IconTrendingDown,
  IconEdit,
  IconTrash,
  IconEye,
  IconEyeOff,
  IconRefresh
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { ProductTable } from '@/components/products/ProductTable';
import { ProductForm } from '@/components/products/ProductForm';
import { ProductStats } from '@/components/products/ProductStats';
import { ProductFilters } from '@/components/products/ProductFilters';
import type { Product } from '@/types';

// Mock data for products
const mockProducts: Product[] = [
  {
    _id: '1',
    category: 'gold',
    productType: 'bar',
    weight: 1,
    sellPrice: 2500000,
    buyPrice: 2450000,
    exist: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '2',
    category: 'gold',
    productType: 'ball',
    weight: 0.5,
    sellPrice: 1250000,
    buyPrice: 1225000,
    exist: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '3',
    category: 'silver',
    productType: 'bar',
    weight: 10,
    sellPrice: 1500000,
    buyPrice: 1475000,
    exist: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '4',
    category: 'silver',
    productType: 'ball',
    weight: 5,
    sellPrice: 750000,
    buyPrice: 735000,
    exist: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '5',
    category: 'gold',
    productType: 'bar',
    weight: 2.5,
    sellPrice: 6250000,
    buyPrice: 6200000,
    exist: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '6',
    category: 'silver',
    productType: 'bar',
    weight: 20,
    sellPrice: 3000000,
    buyPrice: 2950000,
    exist: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [opened, { open, close }] = useDisclosure(false);
  const [editMode, setEditMode] = useState(false);

  // Simulate API loading
  useEffect(() => {
    setTimeout(() => {
      setProducts(mockProducts);
      setFilteredProducts(mockProducts);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter products based on search and filters
  useEffect(() => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.productType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.weight.toString().includes(searchQuery)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(product => product.productType === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      const isAvailable = statusFilter === 'available';
      filtered = filtered.filter(product => product.exist === isAvailable);
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, categoryFilter, typeFilter, statusFilter]);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setEditMode(false);
    open();
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditMode(true);
    open();
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p._id !== productId));
    notifications.show({
      title: 'موفق',
      message: 'محصول با موفقیت حذف شد',
      color: 'green',
    });
  };

  const handleToggleStatus = (productId: string) => {
    setProducts(prev => prev.map(p => 
      p._id === productId ? { ...p, exist: !p.exist } : p
    ));
    notifications.show({
      title: 'موفق',
      message: 'وضعیت محصول به‌روزرسانی شد',
      color: 'blue',
    });
  };

  const handleSaveProduct = (productData: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>) => {
    if (editMode && selectedProduct) {
      // Update existing product
      setProducts(prev => prev.map(p => 
        p._id === selectedProduct._id 
          ? { ...p, ...productData, updatedAt: new Date().toISOString() }
          : p
      ));
      notifications.show({
        title: 'موفق',
        message: 'محصول با موفقیت به‌روزرسانی شد',
        color: 'green',
      });
    } else {
      // Add new product
      const newProduct: Product = {
        ...productData,
        _id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProducts(prev => [newProduct, ...prev]);
      notifications.show({
        title: 'موفق',
        message: 'محصول جدید با موفقیت اضافه شد',
        color: 'green',
      });
    }
    close();
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setProducts(mockProducts);
      setLoading(false);
      notifications.show({
        title: 'به‌روزرسانی',
        message: 'لیست محصولات به‌روزرسانی شد',
        color: 'blue',
      });
    }, 1000);
  };

  // Calculate statistics
  const stats = {
    total: products.length,
    available: products.filter(p => p.exist).length,
    unavailable: products.filter(p => !p.exist).length,
    gold: products.filter(p => p.category === 'gold').length,
    silver: products.filter(p => p.category === 'silver').length,
    totalValue: products.reduce((sum, p) => sum + (p.exist ? p.sellPrice : 0), 0),
    totalProfit: products.reduce((sum, p) => sum + (p.exist ? (p.sellPrice - p.buyPrice) : 0), 0),
  };

  return (
    <Container size="xl" py="xl">
      {/* Header Section */}
      <Group justify="space-between" mb="xl">
        <Box>
          <Title order={1} mb="xs">
            مدیریت محصولات
          </Title>
          <Text size="sm" c="dimmed">
            مدیریت محصولات طلا و نقره
          </Text>
        </Box>
        <Group gap="xs">
          <Tooltip label="به‌روزرسانی">
            <ActionIcon 
              variant="light" 
              size="lg"
              loading={loading}
              onClick={handleRefresh}
            >
              <IconRefresh size={20} />
            </ActionIcon>
          </Tooltip>
          <Button 
            leftSection={<IconPlus size={18} />}
            onClick={handleAddProduct}
          >
            افزودن محصول
          </Button>
        </Group>
      </Group>

      {/* Statistics Cards */}
      <ProductStats stats={stats} loading={loading} />

      {/* Filters */}
      <ProductFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Products Table */}
      <ProductTable
        products={filteredProducts}
        loading={loading}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        onToggleStatus={handleToggleStatus}
      />

      {/* Add/Edit Product Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title=""
        size="lg"
        padding="xl"
        radius="lg"
        centered
      >
        <ProductForm
          product={selectedProduct}
          onSave={handleSaveProduct}
          onCancel={close}
        />
      </Modal>
    </Container>
  );
}

'use client';

import { 
  Stack, 
  Select, 
  NumberInput, 
  Switch, 
  Button,
  Group,
  Text,
  Box,
  Divider,
  Paper,
  ThemeIcon,
  Grid,
  Alert,
  Progress,
  Badge,
  Stepper,
  Card,
  Title
} from '@mantine/core';
import { 
  IconCoin,
  IconDiamond,
  IconScale,
  IconCurrencyDollar,
  IconTrendingUp,
  IconAlertCircle,
  IconCheck,
  IconPackage,
  IconCalculator
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductFormProps {
  product?: Product | null;
  onSave: (product: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [category, setCategory] = useState<'gold' | 'silver'>('gold');
  const [productType, setProductType] = useState<'bar' | 'ball'>('bar');
  const [weight, setWeight] = useState<number>(1);
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [exist, setExist] = useState<boolean>(true);
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when editing
  useEffect(() => {
    if (product) {
      setCategory(product.category);
      setProductType(product.productType);
      setWeight(product.weight);
      setBuyPrice(product.buyPrice);
      setSellPrice(product.sellPrice);
      setExist(product.exist);
      setActiveStep(2); // Skip to final step when editing
    }
  }, [product]);

  // Validation
  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    if (step >= 0) {
      if (!category) newErrors.category = 'دسته‌بندی الزامی است';
      if (!productType) newErrors.productType = 'نوع محصول الزامی است';
    }
    
    if (step >= 1) {
      if (!weight || weight <= 0) newErrors.weight = 'وزن باید بیشتر از صفر باشد';
      if (!buyPrice || buyPrice <= 0) newErrors.buyPrice = 'قیمت خرید الزامی است';
      if (!sellPrice || sellPrice <= 0) newErrors.sellPrice = 'قیمت فروش الزامی است';
      if (sellPrice <= buyPrice) newErrors.sellPrice = 'قیمت فروش باید بیشتر از قیمت خرید باشد';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, 2));
    }
  };

  const prevStep = () => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    if (validateStep(2)) {
      const productData = {
        category,
        productType,
        weight,
        buyPrice,
        sellPrice,
        exist,
      };
      onSave(productData);
    }
  };

  const profit = sellPrice - buyPrice;
  const profitPercentage = buyPrice > 0 ? ((profit / buyPrice) * 100).toFixed(1) : '0';
  const profitMargin = sellPrice > 0 ? ((profit / sellPrice) * 100).toFixed(1) : '0';
  const isValid = weight > 0 && buyPrice > 0 && sellPrice > 0 && sellPrice > buyPrice;

  // Get material config
  const materialConfig = {
    gold: {
      color: 'yellow',
      icon: IconCoin,
      title: 'طلا',
      bgColor: '#FFF8DC'
    },
    silver: {
      color: 'gray', 
      icon: IconDiamond,
      title: 'نقره',
      bgColor: '#F8F8FF'
    }
  };

  const config = materialConfig[category];
  const Icon = config.icon;

  return (
    <Stack gap="lg">
      {/* Header with Product Preview */}
      <Paper p="lg" radius="md" style={{ background: config.bgColor }}>
        <Group gap="md">
          <ThemeIcon size="xl" radius="lg" variant="gradient" 
                   gradient={{ from: config.color + '.4', to: config.color + '.7', deg: 135 }}>
            <Icon size={28} />
          </ThemeIcon>
          <Box>
            <Title order={4} c={config.color + '.8'}>
              {product ? 'ویرایش محصول' : 'افزودن محصول جدید'}
            </Title>
            <Text size="sm" c="dimmed">
              {category === 'gold' ? 'طلا' : 'نقره'} • {productType === 'bar' ? 'شمش' : 'سکه'}
              {weight > 0 && ` • ${weight} گرم`}
            </Text>
          </Box>
        </Group>
      </Paper>

      {/* Stepper for new products */}
      {!product && (
        <Stepper active={activeStep} size="sm" mb="md">
          <Stepper.Step 
            label="نوع محصول" 
            description="انتخاب دسته‌بندی و نوع"
            icon={<IconPackage size={18} />}
          />
          <Stepper.Step 
            label="مشخصات" 
            description="وزن و قیمت‌گذاری"
            icon={<IconScale size={18} />}
          />
          <Stepper.Step 
            label="تأیید نهایی" 
            description="بررسی و ثبت"
            icon={<IconCheck size={18} />}
          />
        </Stepper>
      )}

      {/* Step 1: Product Type Selection */}
      {(activeStep === 0 || product) && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group gap="xs" mb="md">
              <IconPackage size={20} />
              <Text fw={600} size="lg">نوع محصول</Text>
            </Group>

            <Grid>
              <Grid.Col span={6}>
                <Select
                  label="دسته‌بندی"
                  placeholder="انتخاب دسته‌بندی"
                  data={[
                    { value: 'gold', label: '🪙 طلا' },
                    { value: 'silver', label: '⚪ نقره' },
                  ]}
                  value={category}
                  onChange={(value) => setCategory(value as 'gold' | 'silver')}
                  error={errors.category}
                  required
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label="نوع محصول"
                  placeholder="انتخاب نوع محصول"
                  data={[
                    { value: 'bar', label: '📏 شمش' },
                    { value: 'ball', label: '🪙 سکه' },
                  ]}
                  value={productType}
                  onChange={(value) => setProductType(value as 'bar' | 'ball')}
                  error={errors.productType}
                  required
                />
              </Grid.Col>
            </Grid>
          </Stack>
        </Card>
      )}

      {/* Step 2: Specifications */}
      {(activeStep === 1 || product) && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group gap="xs" mb="md">
              <IconScale size={20} />
              <Text fw={600} size="lg">مشخصات و قیمت‌گذاری</Text>
            </Group>

            <NumberInput
              label="وزن (گرم)"
              placeholder="وزن محصول را وارد کنید"
              value={weight}
              onChange={(value) => setWeight(Number(value) || 0)}
              min={0.1}
              step={0.1}
              decimalScale={1}
              leftSection={<IconScale size={16} />}
              error={errors.weight}
              required
            />

            <Grid>
              <Grid.Col span={6}>
                <NumberInput
                  label="قیمت خرید (تومان)"
                  placeholder="قیمت خرید را وارد کنید"
                  value={buyPrice}
                  onChange={(value) => setBuyPrice(Number(value) || 0)}
                  min={0}
                  thousandSeparator=","
                  leftSection={<IconCurrencyDollar size={16} />}
                  error={errors.buyPrice}
                  required
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label="قیمت فروش (تومان)"
                  placeholder="قیمت فروش را وارد کنید"
                  value={sellPrice}
                  onChange={(value) => setSellPrice(Number(value) || 0)}
                  min={0}
                  thousandSeparator=","
                  leftSection={<IconCurrencyDollar size={16} />}
                  error={errors.sellPrice}
                  required
                />
              </Grid.Col>
            </Grid>
          </Stack>
        </Card>
      )}

      {/* Step 3: Final Review & Profit Calculation */}
      {(activeStep === 2 || product) && (
        <>
          {/* Profit Analysis */}
          {buyPrice > 0 && sellPrice > 0 && (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Group gap="xs" mb="md">
                  <IconCalculator size={20} />
                  <Text fw={600} size="lg">تحلیل سودآوری</Text>
                </Group>

                <Grid>
                  <Grid.Col span={4}>
                    <Paper p="md" radius="md" style={{ backgroundColor: '#e3f2fd' }}>
                      <Stack gap="xs" ta="center">
                        <ThemeIcon color="blue" size="lg" radius="xl">
                          <IconTrendingUp size={20} />
                        </ThemeIcon>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                          سود خالص
                        </Text>
                        <Text fw={700} size="lg" c="blue">
                          {formatPrice(profit)}
                        </Text>
                        <Text size="xs" c="dimmed">
                          تومان
                        </Text>
                      </Stack>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Paper p="md" radius="md" style={{ backgroundColor: '#e8f5e8' }}>
                      <Stack gap="xs" ta="center">
                        <ThemeIcon color="green" size="lg" radius="xl">
                          <IconTrendingUp size={20} />
                        </ThemeIcon>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                          نرخ بازده
                        </Text>
                        <Text fw={700} size="lg" c="green">
                          {profitPercentage}%
                        </Text>
                        <Text size="xs" c="dimmed">
                          ROI
                        </Text>
                      </Stack>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Paper p="md" radius="md" style={{ backgroundColor: '#fff3e0' }}>
                      <Stack gap="xs" ta="center">
                        <ThemeIcon color="orange" size="lg" radius="xl">
                          <IconCalculator size={20} />
                        </ThemeIcon>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                          حاشیه سود
                        </Text>
                        <Text fw={700} size="lg" c="orange">
                          {profitMargin}%
                        </Text>
                        <Text size="xs" c="dimmed">
                          Margin
                        </Text>
                      </Stack>
                    </Paper>
                  </Grid.Col>
                </Grid>

                {/* Profit Status Alert */}
                {profit > 0 ? (
                  <Alert 
                    icon={<IconCheck size={16} />} 
                    title="سودآوری مناسب" 
                    color="green"
                    variant="light"
                  >
                    این محصول دارای حاشیه سود مناسب {profitPercentage}% می‌باشد.
                  </Alert>
                ) : (
                  <Alert 
                    icon={<IconAlertCircle size={16} />} 
                    title="هشدار سودآوری" 
                    color="red"
                    variant="light"
                  >
                    قیمت فروش باید بیشتر از قیمت خرید باشد.
                  </Alert>
                )}
              </Stack>
            </Card>
          )}

          {/* Availability Setting */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <Box>
                <Text fw={600} mb="xs">وضعیت موجودی</Text>
                <Text size="sm" c="dimmed">
                  تعیین کنید که این محصول در حال حاضر موجود است یا خیر
                </Text>
              </Box>
              <Switch
                size="lg"
                checked={exist}
                onChange={(event) => setExist(event.currentTarget.checked)}
                onLabel="موجود"
                offLabel="ناموجود"
              />
            </Group>
          </Card>
        </>
      )}

      <Divider />

      {/* Navigation Buttons */}
      <Group justify="space-between">
        <Group gap="md">
          {!product && activeStep > 0 && (
            <Button variant="light" onClick={prevStep}>
              مرحله قبل
            </Button>
          )}
          <Button variant="light" onClick={onCancel}>
            انصراف
          </Button>
        </Group>
        
        <Group gap="md">
          {!product && activeStep < 2 ? (
            <Button onClick={nextStep}>
              مرحله بعد
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={!isValid}
              leftSection={<IconCheck size={16} />}
            >
              {product ? 'به‌روزرسانی' : 'ثبت'} محصول
            </Button>
          )}
        </Group>
      </Group>
    </Stack>
  );
}

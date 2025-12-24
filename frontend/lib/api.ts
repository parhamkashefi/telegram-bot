import axios from 'axios';
import type { LoginDto, LoginResponse, Price, Product } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const priceApi = {
  login: (data: LoginDto): Promise<{ data: LoginResponse }> =>
    api.post('/prices/login', data),
  
  getGoldPrice: (): Promise<{ data: Price }> =>
    api.get('/prices/gold'),
  
  getSilverPrice: (): Promise<{ data: Price }> =>
    api.get('/prices/silver'),
};

export const productApi = {
  getAll: (): Promise<{ data: Product[] }> =>
    api.get('/products'),
  
  create: (data: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>): Promise<{ data: Product }> =>
    api.post('/products', data),
  
  update: (id: string, data: Partial<Product>): Promise<{ data: Product }> =>
    api.patch(`/products/${id}`, data),
};


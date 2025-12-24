// Price related types
export interface Price {
  _id?: string;
  productMaterial: 'gold' | 'silver';
  productType: 'ball' | 'bar';
  prices?: Record<string, number>;
  weightPrices?: {
    site: string;
    weights: { weight: string; price: number; available: boolean }[];
  }[];
  dollarPrices?: {
    kitcoGold?: number;
    kitcoSilver?: number;
  };
  fetchedAtIran?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Product related types
export interface Product {
  _id?: string;
  category: 'gold' | 'silver';
  productType: 'bar' | 'ball';
  weight: number;
  sellPrice: number;
  buyPrice: number;
  exist: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Auth related types
export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}


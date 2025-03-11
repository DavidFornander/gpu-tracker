// src/types/index.ts
export interface ProductData {
  id?: string;
  brand: string;
  model: string;
  price: number;
  currency: string;
  inStock: boolean;
  retailer: string;
  url: string;
  dateAdded?: Date;
  lastUpdated?: Date;
}

export interface AlertData {
  id?: string;
  productId: string;
  priceThreshold: number;
  isActive?: boolean;
  telegramChatId?: string;
  createdAt?: Date;
}

export interface SelectorConfig {
  itemContainer: string;
  brand: string;
  model: string;
  price: string;
  stockStatus: string;
}

export interface ScrapeConfigData {
  id?: string;
  name: string;
  url?: string;
  html?: string;
  selectors: SelectorConfig;
  updateFrequency: number;
  isActive?: boolean;
  lastRun?: Date;
  createdAt?: Date;
}
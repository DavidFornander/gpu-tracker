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

// Enhanced scheduled task with execution history
export interface ScheduledScrapeTask {
  id: string;
  retailer: string;
  sourceUrl: string;
  divSelector: string;
  updateFrequency: number; // in minutes
  lastRun?: string;
  isActive: boolean;
  priority: number; // 1-10, higher number = higher priority
  executions: TaskExecution[];
}

// Task execution record
export interface TaskExecution {
  timestamp: string;
  success: boolean;
  productsFound: number;
  errorMessage?: string;
  duration: number; // milliseconds
}

// Task run queue item
export interface QueuedTask {
  taskId: string;
  retailer: string;
  scheduledTime: Date;
  priority: number;
}

// Notification rule interface
export interface NotificationRule {
  id: string;
  name: string;
  conditions: NotificationConditions;
  isActive: boolean;
  createdAt?: Date;
  lastTriggered?: Date;
}

export interface NotificationConditions {
  brandMatches?: string[];
  modelContains?: string[];
  minPrice?: number;
  maxPrice?: number;
  mustBeInStock?: boolean;
  retailerIs?: string[];
}
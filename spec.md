# GPU Tracker Project Specification - Open Source Local Application

## Project Overview

An open-source desktop application that tracks GPU availability and prices across multiple retailers, with filtering capabilities and price alerts. Designed to be run locally by individuals on their own machines.

## Core Features & Implementation

### 1. Data Collection System

- **User Input Methods**:
  - URL submission (with pre-set filters for in-stock items)
  - HTML snippet pasting (specific div containing products)
- **Data Points**: Brand, Model, Price, Stock Status, Retailer, URL, Date Added To Database
- **Frequency**: Configurable updates (hourly by default) using local scheduler
- **Error Handling**: Automatic retry with exponential backoff, error logs for debugging

### 2. Search & Filter Interface

- **Filters**:
  - Brand (NVIDIA, AMD, Intel)
  - Price Range (min-max)
  - Model Keywords (text search)
  - Only show latest search (based on date added to database)
- **Sorting**:
  - Price (low-high, high-low)
  - Most recently added

### 3. Local Configuration

- **Features**: Saved Searches, Price Alerts (Telegram bot integration)
- **Settings**: Update frequency, selector templates, notification preferences
- **Data Storage**: Local SQLite database with optional data export/import (CSV)

## Technical Stack (Finalized)

- **Architecture**: Next.js monolith with API routes (single application)
- **Frontend**: Next.js with Tailwind CSS (running as local UI)
- **Backend**: Next.js API routes (replacing separate Express server)
- **Database**: SQLite (local file-based storage)
- **Scraping**: Puppeteer for JavaScript rendering sites, Cheerio for static page/div parsing
- **Notifications**: Telegraf for Telegram bot integration
- **Distribution**: GitHub repository with detailed README

## Data Models

```typescript
// Product Model
interface Product {
  id: string;
  brand: string;
  model: string;
  price: number;
  currency: string;
  inStock: boolean;
  retailer: string;
  url: string;
  dateAdded: Date;
  lastUpdated: Date;
}

// Alert Model
interface Alert {
  id: string;
  productId: string;
  priceThreshold: number;
  isActive: boolean;
  createdAt: Date;
  telegramChatId?: string;
}

// Scrape Config Model
interface ScrapeConfig {
  url?: string;
  html?: string;
  selectors: {
    itemContainer: string;
    brand: string;
    model: string;
    price: string;
    stockStatus: string;
  };
  updateFrequency: number; // minutes
}
```

## Development Phases

1. **Core Extraction System**
   - Build basic HTML parser for content extraction (Cheerio)
   - Implement URL-based scraping with Puppeteer
   - Create simple selector configuration system

2. **UI & Storage**
   - Design minimal product listing interface with filters
   - Implement SQLite storage with basic CRUD operations
   - Create search functionality with sorting options

3. **Notifications & Packaging**
   - Implement basic Telegram integration
   - Add installation instructions and configuration options
   - Package application for easy distribution

## API Endpoints (Local)

- `POST /api/scrape/url` - Submit URL for scraping
- `POST /api/scrape/html` - Submit HTML div for parsing
- `GET /api/products` - List all GPUs with filtering
- `GET /api/products/:id` - Get specific GPU details
- `POST /api/alerts` - Create price alert
- `GET /api/alerts` - Get configured alerts
- `POST /api/telegram/setup` - Configure Telegram bot integration
- `PUT /api/config` - Update application preferences

## Risks and Mitigations

1. **Risk**: Inconsistent HTML structures across retailer websites
   - **Mitigation**: User-guided selector creation, template system for common retailers
2. **Risk**: JavaScript-rendered content not visible in pasted HTML
   - **Mitigation**: URL-based scraping option with full page rendering
3. **Risk**: System resource usage
   - **Mitigation**: Configurable update frequency, optional background mode

// src/lib/db-service.ts
import prisma from './db';
import type { ProductData, AlertData, ScrapeConfigData } from '@/types';
import type { Prisma } from '@prisma/client'; // added import

export async function createProduct(data: ProductData) {
  console.log("\n📥 ===================================");
  console.log("📥 [DB] INSERTING NEW PRODUCT");
  console.log("📥 ===================================");
  console.log(JSON.stringify(data, null, 2));
  
  const result = await prisma.product.create({
    data,
  });
  
  console.log("\n✅ ===================================");
  console.log(`✅ [DB] PRODUCT INSERTED: ID ${result.id}`);
  console.log("✅ ===================================\n");
  
  return result;
}

export async function getProducts(filters?: {
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
}) {
  const where: Prisma.ProductWhereInput = {}; // replaced any with Prisma.ProductWhereInput
  
  if (filters?.brand) {
    where.brand = filters.brand;
  }
  
  if (filters?.minPrice || filters?.maxPrice) {
    where.price = {};
    if (filters?.minPrice) where.price.gte = filters.minPrice;
    if (filters?.maxPrice) where.price.lte = filters.maxPrice;
  }
  
  if (filters?.inStock !== undefined) {
    where.inStock = filters.inStock;
  }
  
  if (filters?.search) {
    where.OR = [
      { brand: { contains: filters.search } },
      { model: { contains: filters.search } }   
    ];
  }
  
  return prisma.product.findMany({
    where,
    orderBy: { price: 'asc' }
  });
}

export async function createScrapeConfig(data: ScrapeConfigData) {
  console.log("\n⚙️ ===================================");
  console.log("⚙️ [DB] CREATING SCRAPE CONFIG");
  console.log("⚙️ ===================================");
  console.log(JSON.stringify(data, null, 2));
  
  // Convert the selectors object to a proper JSON structure first
  const selectorJson = JSON.parse(JSON.stringify(data.selectors || {}));
  
  const result = await prisma.scrapeConfig.create({
    data: {
      name: data.name || "Unnamed Configuration",
      url: data.url,
      html: data.html,
      // Fix the type casting
      selectors: selectorJson as Prisma.InputJsonValue,
      updateFrequency: data.updateFrequency || 60,
      isActive: data.isActive ?? true,
    },
  });
  
  console.log("\n✅ ===================================");
  console.log(`✅ [DB] SCRAPE CONFIG CREATED: ID ${result.id}`);
  console.log("✅ ===================================\n");
  
  return result;
}

export async function createAlert(data: AlertData) {
  console.log("\n🔔 ===================================");
  console.log(`🔔 [DB] CREATING ALERT FOR PRODUCT ${data.productId}`);
  console.log("🔔 ===================================\n");
  
  const result = await prisma.alert.create({
    data: {
      productId: data.productId,
      priceThreshold: data.priceThreshold,
      isActive: data.isActive ?? true,
      telegramChatId: data.telegramChatId,
    }
  });
  
  console.log("\n✅ ===================================");
  console.log(`✅ [DB] ALERT CREATED: ID ${result.id}`);
  console.log("✅ ===================================\n");
  
  return result;
}
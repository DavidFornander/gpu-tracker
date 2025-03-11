/*
  Warnings:

  - You are about to drop the column `brandSelector` on the `ScrapeConfig` table. All the data in the column will be lost.
  - You are about to drop the column `itemContainer` on the `ScrapeConfig` table. All the data in the column will be lost.
  - You are about to drop the column `modelSelector` on the `ScrapeConfig` table. All the data in the column will be lost.
  - You are about to drop the column `priceSelector` on the `ScrapeConfig` table. All the data in the column will be lost.
  - You are about to drop the column `stockSelector` on the `ScrapeConfig` table. All the data in the column will be lost.
  - Added the required column `selectors` to the `ScrapeConfig` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "TelegramConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "botToken" TEXT NOT NULL,
    "chatId" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "priceThreshold" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "telegramChatId" TEXT,
    CONSTRAINT "Alert_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Alert" ("createdAt", "id", "isActive", "priceThreshold", "productId", "telegramChatId") SELECT "createdAt", "id", "isActive", "priceThreshold", "productId", "telegramChatId" FROM "Alert";
DROP TABLE "Alert";
ALTER TABLE "new_Alert" RENAME TO "Alert";
CREATE INDEX "Alert_productId_idx" ON "Alert"("productId");
CREATE INDEX "Alert_isActive_idx" ON "Alert"("isActive");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "inStock" BOOLEAN NOT NULL,
    "retailer" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "dateAdded" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Product" ("brand", "currency", "dateAdded", "id", "inStock", "lastUpdated", "model", "price", "retailer", "url") SELECT "brand", "currency", "dateAdded", "id", "inStock", "lastUpdated", "model", "price", "retailer", "url" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE INDEX "Product_brand_idx" ON "Product"("brand");
CREATE INDEX "Product_price_idx" ON "Product"("price");
CREATE INDEX "Product_inStock_idx" ON "Product"("inStock");
CREATE TABLE "new_ScrapeConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'Unnamed Configuration',
    "url" TEXT,
    "html" TEXT,
    "selectors" JSONB NOT NULL,
    "updateFrequency" INTEGER NOT NULL DEFAULT 60,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRun" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_ScrapeConfig" ("createdAt", "html", "id", "lastRun", "updateFrequency", "url") SELECT "createdAt", "html", "id", "lastRun", "updateFrequency", "url" FROM "ScrapeConfig";
DROP TABLE "ScrapeConfig";
ALTER TABLE "new_ScrapeConfig" RENAME TO "ScrapeConfig";
CREATE INDEX "ScrapeConfig_isActive_idx" ON "ScrapeConfig"("isActive");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

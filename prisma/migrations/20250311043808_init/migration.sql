-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "inStock" BOOLEAN NOT NULL DEFAULT false,
    "retailer" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "dateAdded" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "priceThreshold" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "telegramChatId" TEXT,
    CONSTRAINT "Alert_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScrapeConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT,
    "html" TEXT,
    "itemContainer" TEXT NOT NULL,
    "brandSelector" TEXT NOT NULL,
    "modelSelector" TEXT NOT NULL,
    "priceSelector" TEXT NOT NULL,
    "stockSelector" TEXT NOT NULL,
    "updateFrequency" INTEGER NOT NULL DEFAULT 60,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRun" DATETIME
);

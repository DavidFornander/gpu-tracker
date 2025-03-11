// src/app/api/scrape/url/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { scrapeUrl } from '@/lib/url-scraper';
import prisma from '@/lib/db';
import { z } from 'zod';
import { Prisma } from '@prisma/client'; // Added import

// Input validation schema
const urlScrapeSchema = z.object({
  url: z.string().url(),
  retailer: z.string().min(1),
  selectors: z.object({
    itemContainer: z.string().min(1),
    brand: z.string().min(1),
    model: z.string().min(1),
    price: z.string().min(1),
    stockStatus: z.string().min(1)
  }),
  updateFrequency: z.number().int().min(5).default(60)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = urlScrapeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: validation.error.format() 
      }, { status: 400 });
    }
    
    const { url, retailer, selectors, updateFrequency } = validation.data;

    // Perform URL scraping
    const result = await scrapeUrl(url, selectors, retailer);

    if (result.products.length === 0) {
      return NextResponse.json(
        { 
          message: 'No products found', 
          errors: result.errors 
        },
        { status: 404 }
      );
    }

    // Save products to database
    const createdProducts = await Promise.all(
      result.products.map(product => 
        prisma.product.create({
          data: product
        })
      )
    );

    // Save scrape configuration for future updates
    await prisma.scrapeConfig.create({
      data: {
        name: `${retailer} - ${new Date().toLocaleDateString()}`,
        url,
        selectors: selectors as Prisma.InputJsonValue, // changed cast here
        updateFrequency: updateFrequency || 60,
        isActive: true
      }
    });

    return NextResponse.json({
      message: `Successfully scraped ${result.products.length} products`,
      products: createdProducts,
      warnings: result.errors
    });
  } catch (error) {
    console.error('Error processing URL scrape:', error);
    return NextResponse.json({
      error: 'Failed to scrape URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
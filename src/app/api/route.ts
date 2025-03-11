// src/app/api/scrape/html/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { parseHtmlSnippet } from '@/lib/html-parser';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { 
      html, 
      retailer, 
      sourceUrl = '', 
      selectors 
    } = body;
    
    if (!html || !retailer || !selectors) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse the HTML snippet
    const result = await parseHtmlSnippet(html, selectors, retailer, sourceUrl);

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

    // Save scrape configuration for future use
    const scrapeConfig = await prisma.scrapeConfig.create({
      data: {
        name: data.name || "Unnamed Configuration",
        url: data.url,
        html: data.html,
        selectors: data.selectors as any, // Type cast to any or properly type as Prisma.JsonValue
        updateFrequency: data.updateFrequency || 60,
        isActive: true,
      }
    });

    return NextResponse.json({
      message: `Successfully parsed ${result.products.length} products`,
      products: createdProducts,
      warnings: result.errors
    });
  } catch (error) {
    console.error('Error processing HTML snippet:', error);
    return NextResponse.json(
      { error: `Failed to process HTML: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
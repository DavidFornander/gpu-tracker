import { NextRequest, NextResponse } from 'next/server';
import { parseHtmlSnippet } from '@/lib/html-parser';
import { scrapeUrl } from '@/lib/url-scraper'; // new import

// Update input interface: html is optional, and add divSelector
interface ExtractDivRequest {
  html?: string;
  retailer: string;
  sourceUrl?: string;
  // For automatic scraping if html is not provided
  divSelector?: string;
  // Fallback selectors if manual extraction is desired
  selectors?: {
    itemContainer: string;
    brand: string;
    model: string;
    price: string;
    stockStatus: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ExtractDivRequest;
    const { html, retailer, sourceUrl = '', divSelector, selectors } = body;
    
    if (!retailer || (!html && !(sourceUrl && divSelector))) {
      return NextResponse.json(
        { error: 'Missing required fields: provide either HTML or both Source URL and Div Selector' },
        { status: 400 }
      );
    }
    
    let result;
    if (html) {
      // Use manual HTML parsing (with selectors)
      result = await parseHtmlSnippet(html, selectors!, retailer, sourceUrl);
    } else {
      // Automatic scraping using provided URL and divSelector
      const autoSelectors = { 
        itemContainer: divSelector!,  // non-null assertion added
        brand: '', 
        model: '', 
        price: '', 
        stockStatus: '' 
      };
      result = await scrapeUrl(sourceUrl, autoSelectors, retailer);
    }
    
    if (result.products.length === 0) {
      return NextResponse.json(
        { message: 'No products found', errors: result.errors },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: `Successfully parsed ${result.products.length} products`,
      products: result.products,
      warnings: result.errors,
      // Use a type guard to return rawDivs if available, otherwise an empty array
      rawDivData: 'rawDivs' in result ? result.rawDivs : [],
      // Similarly, return rawHtml only if available
      rawHtml: 'html' in result ? result.html : undefined
    });
    
  } catch (error) {
    console.error('Error processing extract-div request:', error);
    return NextResponse.json(
      {
        error: 'Failed to process extraction',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

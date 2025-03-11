// src/lib/url-scraper.ts
import puppeteer, { Browser } from 'puppeteer';
import { parseHtmlSnippet } from './html-parser';
import type { ProductData, SelectorConfig } from '@/types';

// Maximum number of retries
const MAX_RETRIES = 3;

interface ScrapeResult {
  products: ProductData[];
  errors?: string[];
  html?: string;
}

export async function scrapeUrl(
  url: string,
  selectors: SelectorConfig,
  retailer: string,
  retryCount = 0
): Promise<ScrapeResult> {
  let browser: Browser | null = null;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // or true for older Puppeteer versions
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });
    const page = await browser.newPage();
    
    // Set a user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to URL with timeout
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for the product container to appear
    try {
      await page.waitForSelector(selectors.itemContainer, { timeout: 5000 });
    } catch (_err) { // Fix here: Renamed err to _err
      console.log("\n⚠️ ===================================");
      console.log(`⚠️ [WARN] SELECTOR NOT FOUND: ${selectors.itemContainer}`);
      console.log("⚠️ ===================================");
      console.error(_err);
    }
    
    // Extract HTML content
    const html = await page.content();
    
    // Close browser
    await browser.close();
    browser = null;
    
    // Parse the HTML using our existing parser
    const parseResult = await parseHtmlSnippet(html, selectors, retailer, url);
    
    return {
      ...parseResult,
      html
    };
    
  } catch (_err) { // renamed err to _err so it's not reported as unused
    // Close browser if it's still open
    if (browser) {
      await browser.close();
      browser = null;
    }
    
    // Implement retry with exponential backoff
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
      console.log("\n🔄 ===================================");
      console.log(`🔄 [RETRY] ATTEMPT ${retryCount + 1}/${MAX_RETRIES}`);
      console.log(`🔄 [RETRY] WAITING ${delay}ms`);
      console.log("🔄 ===================================\n");
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return scrapeUrl(url, selectors, retailer, retryCount + 1);
    }
    
    return {
      products: [],
      errors: [`Failed to scrape URL after ${MAX_RETRIES} attempts: ${_err instanceof Error ? _err.message : String(_err)}`]
    };
  }
}
// src/lib/html-parser.ts
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import type { ProductData } from '@/types';

// Update interface to include rawDivs
export interface ParsingResult {
  products: ProductData[];
  errors?: string[];
  rawDivs?: string[];
}

// New helper: callOllama to communicate with your local Ollama instance
async function callOllama(prompt: string): Promise<string> {
    console.log("\n🤖 ===================================");
    console.log("🤖 [AI] SENDING PROMPT TO OLLAMA");
    console.log("🤖 ===================================");
    console.log("\n" + prompt + "\n"); // Fixed to display the actual prompt
    
    const response = await fetch('http://localhost:11434/api/generate', {  // updated endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: "mistral",  // model name
            prompt: prompt,
            format: "json",     // enforce JSON output
            stream: false       // disable streaming
        })
    });
    if (!response.ok) {
        console.log("\n❌ ===================================");
        console.log(`❌ [AI] ERROR: ${response.statusText}`);
        console.log("❌ ===================================\n");
        throw new Error(`Ollama API error: ${response.statusText}`);
    }
    const data = await response.json();
    console.log("\n✅ ===================================");
    console.log("✅ [AI] RESPONSE RECEIVED");
    console.log("✅ ===================================\n");
    console.log(data.response); // log AI response
    return data.response; // assuming the API returns { response: "..." }
}

// Updated AI extraction helper using sequential targeted requests
async function aiExtractData(
  htmlFragment: string,
  selectors: {
    itemContainer: string;
    brand: string;
    model: string;
    price: string;
    stockStatus: string;
  },
  retailer: string,
  sourceUrl: string
): Promise<ProductData> {
  console.log("\n📄 ===================================");
  console.log("📄 [AI] PROCESSING HTML FRAGMENT");
  console.log("📄 ===================================\n");
  
  try {
    // Extract visible text for AI processing
    const visibleText = extractVisibleText(htmlFragment);
    console.log("\n📝 ===================================");
    console.log("📝 [DEBUG] VISIBLE TEXT FROM HTML");
    console.log("📝 ===================================");
    console.log(visibleText);
    
    // 1. Extract BRAND only - using only visible text, not HTML
    const brandPrompt = `You are a specialized GPU brand extractor.
TASK: Identify ONLY the GPU manufacturer/brand name from the text.
INSTRUCTIONS:
- Return ONLY the brand name as a plain text string, no JSON, no additional text
- Common GPU brands: NVIDIA, AMD, ASUS, MSI, Gigabyte, EVGA, Zotac, PNY, XFX, Sapphire
- If multiple brands appear, choose the one most closely associated with the GPU
- If no brand is found, return "Unknown"

TEXT FROM PRODUCT:
${visibleText}`;

    const brandResponse = await callOllama(brandPrompt);
    const brand = brandResponse.trim();
    console.log(`\n[AI] BRAND EXTRACTION RESULT: "${brand}"`);
    
    // 2. Extract MODEL only - using only visible text
    const modelPrompt = `You are a specialized GPU model extractor.
TASK: Identify ONLY the GPU model name/number from the text.
INSTRUCTIONS:
- Return ONLY the model identifier as a plain text string, no JSON, no additional text
- Include full model name (e.g. "GeForce RTX 4090", "Radeon RX 7900 XTX", "Arc A770")
- Include any variant details if present (e.g. "GAMING OC", "STRIX", "FOUNDERS EDITION")
- If no model is found, return "Unknown"

TEXT FROM PRODUCT:
${visibleText}`;

    const modelResponse = await callOllama(modelPrompt);
    const model = modelResponse.trim();
    console.log(`\n[AI] MODEL EXTRACTION RESULT: "${model}"`);
    
    // 3. Extract PRICE only - using only visible text
    const pricePrompt = `You are a specialized price extractor.
TASK: Extract ONLY the numeric price value from the text.
INSTRUCTIONS:
- Return ONLY the number as plain text, no currency symbols, no formatting, no JSON
- Example: If you see "€1,299.99" or "1 299,99 kr", just return "1299.99"
- Remove all non-numeric characters except decimal point
- If multiple prices appear, extract the main product price
- If no price is found, return "0"

TEXT FROM PRODUCT:
${visibleText}`;

    const priceResponse = await callOllama(pricePrompt);
    // Clean and parse the price response
    let price = 0;
    try {
      // Remove all non-numeric characters except decimal point, then parse
      const cleanPrice = priceResponse.trim().replace(/[^0-9.]/g, '');
      price = parseFloat(cleanPrice);
      if (isNaN(price)) price = 0;
    } catch (err) {
      console.log("[AI] Price parsing error:", err);
      price = 0;
    }
    console.log(`\n[AI] PRICE EXTRACTION RESULT: ${price}`);
    
    // 4. Extract STOCK STATUS only - using only visible text
    const stockPrompt = `You are a specialized product availability detector.
TASK: Determine if the product is in stock from the text.
INSTRUCTIONS:
- Return ONLY "true" if in stock or "false" if out of stock, nothing else
- Look for indicators like:
  - IN STOCK: "Add to cart", "Buy now", "In stock", "Available", "Lägg i kundvagn"
  - OUT OF STOCK: "Out of stock", "Sold out", "Unavailable", "Notify me"
- If you cannot determine stock status, return "true" as default

TEXT FROM PRODUCT:
${visibleText}`;

    const stockResponse = await callOllama(stockPrompt);
    // Parse stock status (accepts true/false as text)
    const inStock = stockResponse.trim().toLowerCase() === 'true';
    console.log(`\n[AI] STOCK STATUS EXTRACTION RESULT: ${inStock}`);
    
    // Compile final product data
    const productData = {
      id: uuidv4(),
      brand: brand || "Unknown",
      model: model || "Unknown",
      price: price,
      currency: 'USD',
      inStock: inStock,
      retailer,
      url: sourceUrl || '',
      dateAdded: new Date(),
      lastUpdated: new Date()
    };
    
    console.log("\n📊 ===================================");
    console.log("📊 [AI] FINAL COMPILED DATA");
    console.log("📊 ===================================");
    console.log(JSON.stringify(productData, null, 2));
    
    return productData;
  } catch (error) {
    // Fall back to manual extraction
    console.log("\n⚠️ ===================================");
    console.log("⚠️ [AI] SEQUENTIAL EXTRACTION FAILED, FALLING BACK");
    console.log("⚠️ ===================================\n");
    console.error(error);
    
    console.log("\n⚠️ ===================================");
    console.log("⚠️ [AI] FALLING BACK TO MANUAL EXTRACTION");
    console.log("⚠️ ===================================\n");
    console.log("[AI] Falling back to manual extraction for fragment:", htmlFragment.slice(0, 200) + '...');
    const $ = cheerio.load(htmlFragment);
    const fallbackBrand = $(selectors.brand).text().trim() || "Unknown";
    const fallbackModel = $(selectors.model).text().trim() || "Unknown";
    const priceMatch = $(selectors.price).text().trim().match(/[\d,.]+/);
    const fallbackPrice = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;
    const stockText = $(selectors.stockStatus).text().trim().toLowerCase();
    const fallbackInStock = !(stockText.includes('out of stock') || stockText.includes('sold out') || stockText.includes('unavailable'));
    const fallbackData = {
      id: uuidv4(),
      brand: fallbackBrand,
      model: fallbackModel,
      price: fallbackPrice,
      currency: 'USD',
      inStock: fallbackInStock,
      retailer,
      url: sourceUrl || '',
      dateAdded: new Date(),
      lastUpdated: new Date()
    };
    console.log("\n📋 ===================================");
    console.log("📋 [AI] FALLBACK DATA");
    console.log("📋 ===================================");
    console.log(JSON.stringify(fallbackData, null, 2));
    console.log("[AI] Fallback extracted data:", fallbackData);
    return fallbackData;
  }
}

/**
 * Extracts all visible text from an HTML fragment, removing HTML tags
 * but preserving the text that would be visible on a rendered web page.
 */
export function extractVisibleText(html: string): string {
  const $ = cheerio.load(html);
  
  // Remove script and style elements as their content is not visible
  $('script, style, noscript, meta, link').remove();
  
  // Extract text from the body
  let text = '';
  
  // Process all text nodes
  const processNode = (i: number, elem: cheerio.Element) => {
    if (elem.type === 'text') {
      // Add the text content with proper spacing
      const trimmedText = $(elem).text().trim();
      if (trimmedText) {
        text += trimmedText + ' ';
      }
    }
    
    // Process child elements
    $(elem).contents().each(processNode);
    
    // Add line breaks after certain block elements
    if (['br', 'p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr'].includes(elem.tagName)) {
      text += '\n';
    }
  };
  
  // Start processing from the root
  $('body').contents().each(processNode);
  
  // Clean up the text - replace multiple spaces and line breaks with single ones
  return text
    .replace(/\s+/g, ' ')      // Replace multiple spaces with a single space
    .replace(/\n+/g, '\n')     // Replace multiple line breaks with a single line break
    .replace(/\n\s+/g, '\n')   // Remove spaces at the beginning of lines
    .trim();                   // Remove leading/trailing spaces
}

export async function parseHtmlSnippet(
  html: string,
  selectors: {
    itemContainer: string;
    brand: string;
    model: string;
    price: string;
    stockStatus: string;
  },
  retailer: string,
  sourceUrl?: string
): Promise<ParsingResult> {
  console.log("\n🔍 ===================================");
  console.log("🔍 [DEBUG] STARTING HTML PARSING");
  console.log("🔍 ===================================\n");
  console.log("[Debug] Starting parseHtmlSnippet with provided HTML."); // log start of parsing
  try {
    const $ = cheerio.load(html);
    const products: ProductData[] = [];
    const errors: string[] = [];

    // Find all product containers and capture their inner HTML
    const items = $(selectors.itemContainer);
    const productElements = items.toArray();
    const rawDivs = productElements.map(element => $(element).html() || "");

    console.log(`\n🔢 [DEBUG] FOUND ${productElements.length} PRODUCT ELEMENTS`);
    console.log(`[Debug] Found ${productElements.length} product elements.`);

    if (productElements.length === 0) {
      return { 
        products: [],
        errors: [`No items found matching selector: ${selectors.itemContainer}`],
        rawDivs: []
      };
    }

    // Use async iteration with AI extraction for each product div
    for (const element of productElements) {
      try {
        const htmlFragment = $(element).html() || "";
        console.log("\n🔄 [DEBUG] PROCESSING PRODUCT ELEMENT");
        console.log("[Debug] Processing one product element...");
        const product = await aiExtractData(htmlFragment, selectors, retailer, sourceUrl || '');
        products.push(product);
      } catch (err) {
        errors.push(`Error parsing item: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    console.log("\n✨ ===================================");
    console.log(`✨ [DEBUG] FINISHED PROCESSING: ${products.length} PRODUCTS`);
    console.log("✨ ===================================\n");
    console.log(`[Debug] Finished processing. Extracted ${products.length} products.`);
    return {
      products,
      errors: errors.length > 0 ? errors : undefined,
      rawDivs
    };
  } catch (err) {
    console.log("\n💥 ===================================");
    console.log("💥 [ERROR] PROBLEM IN parseHtmlSnippet");
    console.log("💥 ===================================");
    console.log(err);
    console.log("[Error] Problem in parseHtmlSnippet:", err);
    return {
      products: [],
      errors: [`Failed to parse HTML: ${err instanceof Error ? err.message : String(err)}`]
    };
  }
}
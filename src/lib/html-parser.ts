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
- Return ONLY the number as plain text, no currency symbols, no formatting
- For prices with spaces (e.g. "8 499:-"), combine all digits (8499)
- Always include ALL digits - prices below 1000 for GPUs are wrong, look again for leading digits
- If you see price like "8 499 kr" or "8 499:-", return "8499" not just "499"
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
      
      // Validate: GPU prices below 1000 are suspicious - might be missing leading digits
      if (price > 0 && price < 1000) {
        console.log("[AI] WARNING: Extracted price seems suspiciously low for a GPU: " + price + " Setting to 0.");
        price = 0;
      }
    } catch (err) {
      console.log("[AI] Price parsing error:", err);
      price = 0;
    }
    console.log(`\n[AI] PRICE EXTRACTION RESULT: ${price}`);
    
    // Compile final product data
    const productData = {
      id: uuidv4(),
      brand: brand || "Unknown",
      model: model || "Unknown",
      price: price,
      currency: 'SEK',
      inStock: true,  // Hardcoded to true
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
    const fallbackData = {
      id: uuidv4(),
      brand: fallbackBrand,
      model: fallbackModel,
      price: fallbackPrice,
      currency: 'SEK',
      inStock: true,  // Hardcoded to true
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
  
  // Process all text nodes - Use proper type handling
  const processNode = (_: number, elem: any) => {
    // Type checking inside the function instead of in the parameter
    if (elem && elem.type === 'text') {
      // Add the text content with proper spacing
      const trimmedText = $(elem).text().trim();
      if (trimmedText) {
        text += trimmedText + ' ';
      }
    }
    
    // Process child elements
    if (elem) { // Add null check here
      $(elem).contents().each(processNode);
      
      // Add line breaks after certain block elements
      // Make sure elem and elem.tagName exist before checking
      if (elem.tagName && ['br', 'p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr'].includes(elem.tagName)) {
        text += '\n';
      }
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
  
  try {
    const $ = cheerio.load(html);
    const products: ProductData[] = [];
    const errors: string[] = [];

    // Find the main container
    const containerElement = $(selectors.itemContainer);
    
    if (containerElement.length === 0) {
      console.log(`\n❌ [ERROR] Main container selector not found: ${selectors.itemContainer}`);
      return { 
        products: [],
        errors: [`No container found matching selector: ${selectors.itemContainer}`],
        rawDivs: []
      };
    }
    
    console.log(`\n🔍 [DEBUG] Found main container. Looking for product divs...`);
    
    // FIXED: Instead of looking for children, look for direct child items of the container
    // that match common product patterns or have specific characteristics
    
    // Start with direct children that look like product items (more likely to be complete products)
    let productElements = containerElement.children('.product-item, .product-card, .product, [data-product], [class*="product"]').toArray();
    
    // If no product items found, try direct children that are likely to be products based on content
    if (productElements.length === 0) {
      // Look for direct children with these characteristics
      productElements = containerElement.children().filter(function() {
        const $this = $(this);
        const hasPrice = $this.find('*:contains("kr"), *:contains(":-"), .price, [class*="price"]').length > 0;
        const hasModelName = $this.text().match(/(RTX|RX|GTX|AMD|NVIDIA)/i) !== null;
        const hasImage = $this.find('img').length > 0;
        const isSubstantial = $this.text().trim().length > 100; // Product divs usually have substantial content
        
        // Product elements typically have price + (model name or image)
        return (hasPrice && (hasModelName || hasImage)) || isSubstantial;
      }).toArray();
    }
    
    // If still nothing, just get the closest elements that look like product cards
    if (productElements.length === 0) {
      console.log(`\n⚠️ [WARN] No product items detected using standard patterns. Using container's direct children.`);
      // Get direct children that have a minimum structure
      productElements = containerElement.children('div').filter(function() {
        return $(this).children().length > 2; // Most product cards have several child elements
      }).toArray();
    }

    console.log(`\n🔢 [DEBUG] FOUND ${productElements.length} PRODUCT ELEMENTS`);
    
    // If we still can't find distinct product elements, the selector might be too deep already
    if (productElements.length === 0) {
      console.log(`\n⚠️ [WARN] Selector may be too specific. Trying parent container...`);
      
      // Try going up one level in the DOM
      const parentContainer = $(selectors.itemContainer).parent();
      productElements = parentContainer.children('div').filter(function() {
        const $this = $(this);
        return $this.find('.price, img, [class*="product"]').length > 0;
      }).toArray();
      
      // If we found products at the parent level, log the better selector for future use
      if (productElements.length > 0) {
        console.log(`\n💡 [TIP] Better selector might be: "${parentContainer.prop('tagName').toLowerCase()}${parentContainer.attr('class') ? '.' + parentContainer.attr('class').replace(/\s+/g, '.') : ''} > div"`);
      }
    }

    const rawDivs = productElements.map(element => $(element).html() || "");

    if (productElements.length === 0) {
      return { 
        products: [],
        errors: [`No product items found within container: ${selectors.itemContainer}`],
        rawDivs: []
      };
    }
    
    // Log the first product element to help with debugging
    console.log(`\n📄 [DEBUG] First product element structure (truncated):`);
    if (productElements.length > 0) {
      const firstElement = $(productElements[0]);
      console.log(`Tag: ${firstElement.prop('tagName')}, Classes: ${firstElement.attr('class') || 'none'}`);
      console.log(`Children elements: ${firstElement.children().length}`);
      const firstElementHtml = firstElement.html() || "";
      console.log(firstElementHtml.slice(0, 300) + '...');
    }

    // Process each product element
    for (const element of productElements) {
      try {
        const htmlFragment = $(element).html() || "";
        
        // QUALITY CHECK: Skip if the fragment is too small to be a complete product
        if (htmlFragment.length < 100) {
          console.log("\n⚠️ [WARN] Skipping small HTML fragment, likely not a complete product");
          continue;
        }
        
        console.log("\n🔄 [DEBUG] PROCESSING PRODUCT ELEMENT");
        const product = await aiExtractData(htmlFragment, selectors, retailer, sourceUrl || '');
        
        // Only add products that have meaningful data
        if ((product.brand !== "Unknown" && product.brand !== "") || 
            (product.model !== "Unknown" && product.model !== "") || 
            product.price > 0) {
          products.push(product);
        } else {
          console.log("\n⚠️ [WARN] Skipping product with insufficient data");
        }
      } catch (err) {
        errors.push(`Error parsing item: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    console.log("\n✨ ===================================");
    console.log(`✨ [DEBUG] FINISHED PROCESSING: ${products.length} PRODUCTS`);
    console.log("✨ ===================================\n");
    
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
    
    return {
      products: [],
      errors: [`Failed to parse HTML: ${err instanceof Error ? err.message : String(err)}`]
    };
  }
}
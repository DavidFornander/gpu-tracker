import prisma from './db';
import { ProductData, NotificationConditions } from '@/types';
import { sendNotification } from './telegram-service';

/**
 * Check a product against notification rules and send notifications if matched
 * @param product The product data to check
 */
export async function checkProductNotifications(product: ProductData): Promise<boolean> {
  try {
    // Get all active notification rules
    const rules = await prisma.notificationRule.findMany({
      where: { isActive: true }
    });
    
    if (rules.length === 0) return false;
    
    let notificationSent = false;
    
    // Check product against each rule
    for (const rule of rules) {
      // Safely cast the JSON conditions to our expected type
      const typedConditions = rule.conditions as unknown as NotificationConditions;
      const ruleMatches = doesProductMatchRule(product, typedConditions);
      
      if (ruleMatches) {
        // Rule matched, send notification
        await sendProductNotification(product, {
          ...rule,
          conditions: typedConditions // Use the typed conditions
        });
        notificationSent = true;
        
        // Update last triggered timestamp
        await prisma.notificationRule.update({
          where: { id: rule.id },
          data: { lastTriggered: new Date() }
        });
      }
    }
    
    return notificationSent;
  } catch (error) {
    console.error('Error checking product notifications:', error);
    return false;
  }
}

/**
 * Check if a product matches a notification rule's conditions
 */
function doesProductMatchRule(product: ProductData, conditions: NotificationConditions): boolean {
  // Brand check
  if (conditions.brandMatches && conditions.brandMatches.length > 0) {
    if (!conditions.brandMatches.some(brand => 
      product.brand.toLowerCase() === brand.toLowerCase()
    )) {
      return false;
    }
  }
  
  // Model contains check
  if (conditions.modelContains && conditions.modelContains.length > 0) {
    if (!conditions.modelContains.some(term => 
      product.model.toLowerCase().includes(term.toLowerCase())
    )) {
      return false;
    }
  }
  
  // Price range check
  if (conditions.minPrice !== undefined && product.price < conditions.minPrice) {
    return false;
  }
  
  if (conditions.maxPrice !== undefined && product.price > conditions.maxPrice) {
    return false;
  }
  
  // Stock check
  if (conditions.mustBeInStock && !product.inStock) {
    return false;
  }
  
  // Retailer check
  if (conditions.retailerIs && conditions.retailerIs.length > 0) {
    if (!conditions.retailerIs.some(retailer => 
      product.retailer.toLowerCase() === retailer.toLowerCase()
    )) {
      return false;
    }
  }
  
  // All conditions met
  return true;
}

/**
 * Send a notification about a product that matched a rule
 */
async function sendProductNotification(
  product: ProductData, 
  rule: { id: string; name: string; conditions: NotificationConditions }
): Promise<boolean> {
  try {
    const message = `🎯 *Notification Rule Triggered: ${rule.name}*\n\n` + 
      `🎮 ${product.brand} ${product.model}\n` +
      `💰 Price: ${product.price.toLocaleString()} ${product.currency}\n` +
      `🏪 Retailer: ${product.retailer}\n` +
      `🛒 In stock: ${product.inStock ? 'Yes' : 'No'}\n\n` +
      `[View Product](${product.url})`;
      
    return await sendNotification(message);
  } catch (error) {
    console.error('Error sending product notification:', error);
    return false;
  }
}

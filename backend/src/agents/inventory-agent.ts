#!/usr/bin/env node

/**
 * Inventory Management AI Agent
 * 
 * This agent:
 * 1. Fetches critical inventory items from the API
 * 2. Gets supplier information for each item
 * 3. Uses DeepSeek AI to generate purchase recommendations with cost estimates
 * 4. Falls back to local recommendations if AI API fails
 * 5. Saves recommendations back to the API
 */

import * as http from 'http';
import * as https from 'https';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const DEEPSEEK_ENDPOINT = 'https://deepseekv32-3ca9s.paas.ai.telus.com/v1/chat/completions';
const DEEPSEEK_AUTH = 'a12a7d3705b12aeb46eb4cc8d77f5446';
const DEEPSEEK_MODEL = 'deepseek-ai/DeepSeek-V3.2-Exp';

interface InventoryRiskItem {
  sku_id: string;
  item_name: string | null;
  category: string | null;
  current_stock: number | null;
  par_level: number | null;
  burn_rate_daily: number | null;
  days_until_stockout: number | null;
  status: string | null;
}

interface SupplierContract {
  contract_id: number;
  supplier_id: string;
  supplier_name: string | null;
  contract_type: string | null;
  sku_id: string;
  item_name: string | null;
  price_per_unit: number | null;
  lead_time_hours: number | null;
  reliability_score: number | null;
  min_order_qty: number | null;
  notes: string | null;
}

interface PurchaseRecommendation {
  sku_id: string;
  item_name: string;
  current_stock: number;
  par_level: number;
  days_until_stockout: number;
  recommended_quantity: number;
  suppliers: Array<{
    supplier_name: string;
    price_per_unit: number;
    lead_time_hours: number;
    reliability_score: number;
    min_order_qty: number;
    total_cost: number;
    recommended: boolean;
  }>;
  reasoning: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

// Helper function to make HTTP requests
function httpRequest(method: string, url: string, data?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers: data ? { 'Content-Type': 'application/json' } : {},
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Fetch critical inventory items
async function getCriticalInventory(days: number = 7): Promise<InventoryRiskItem[]> {
  const url = `${API_BASE_URL}/api/ui/inventory/risk?days=${days}`;
  console.log(`📦 Fetching critical inventory items (risk threshold: ${days} days)...`);
  const items = await httpRequest('GET', url);
  console.log(`   Found ${items.length} critical items`);
  return items;
}

// Fetch suppliers for multiple SKUs
async function getSuppliersForSkus(skuIds: string[]): Promise<SupplierContract[]> {
  if (skuIds.length === 0) return [];
  const url = `${API_BASE_URL}/api/ui/suppliers/by-skus`;
  const suppliers = await httpRequest('POST', url, { sku_ids: skuIds });
  return suppliers;
}

// Generate recommendations locally (fallback when AI API fails)
function generateRecommendationsLocal(
  inventoryItems: InventoryRiskItem[],
  suppliersBySku: Map<string, SupplierContract[]>
): PurchaseRecommendation[] {
  console.log('   Using local recommendation engine (fallback)...');
  
  return inventoryItems.map((item) => {
    const suppliers = suppliersBySku.get(item.sku_id) || [];
    
    // Calculate recommended quantity
    const currentStock = item.current_stock || 0;
    const parLevel = item.par_level || 0;
    const burnRate = item.burn_rate_daily || 0;
    const daysLeft = item.days_until_stockout || 0;
    
    // Recommended quantity = max of: (par - current), (burn_rate * 7 days), or min_order_qty
    const recommendedQty = Math.max(
      Math.max(0, parLevel - currentStock),
      Math.ceil(burnRate * 7),
      suppliers.length > 0 ? (suppliers[0].min_order_qty || 0) : 0
    );
    
    // Select best supplier (highest reliability, then lowest price, then shortest lead time)
    const bestSupplier = suppliers.length > 0
      ? suppliers.sort((a, b) => {
          const relDiff = (b.reliability_score || 0) - (a.reliability_score || 0);
          if (Math.abs(relDiff) > 0.1) return relDiff;
          const priceDiff = (a.price_per_unit || 0) - (b.price_per_unit || 0);
          if (priceDiff !== 0) return priceDiff;
          return (a.lead_time_hours || 0) - (b.lead_time_hours || 0);
        })[0]
      : null;
    
    // Determine urgency
    let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';
    if (daysLeft < 3) urgency = 'critical';
    else if (daysLeft < 7) urgency = 'high';
    else if (daysLeft < 14) urgency = 'medium';
    
    // Build suppliers array with recommendations
    const supplierRecommendations = suppliers.slice(0, 3).map((s, idx) => ({
      supplier_name: s.supplier_name || 'Unknown',
      price_per_unit: s.price_per_unit || 0,
      lead_time_hours: s.lead_time_hours || 0,
      reliability_score: s.reliability_score || 0,
      min_order_qty: s.min_order_qty || 0,
      total_cost: recommendedQty * (s.price_per_unit || 0),
      recommended: idx === 0 && s === bestSupplier,
    }));
    
    // Generate reasoning
    const reasoning = bestSupplier
      ? `Stock at ${currentStock} units, ${daysLeft.toFixed(1)} days remaining. Recommended ${recommendedQty} units from ${bestSupplier.supplier_name} (${bestSupplier.reliability_score ? (bestSupplier.reliability_score * 100).toFixed(0) : 'N/A'}% reliable, $${bestSupplier.price_per_unit?.toFixed(2)}/unit).`
      : `Stock at ${currentStock} units, ${daysLeft.toFixed(1)} days remaining. Recommended ${recommendedQty} units. No suppliers available.`;
    
    return {
      sku_id: item.sku_id,
      item_name: item.item_name || 'Unknown',
      current_stock: currentStock,
      par_level: parLevel,
      days_until_stockout: daysLeft,
      recommended_quantity: recommendedQty,
      suppliers: supplierRecommendations,
      reasoning,
      urgency,
    };
  });
}

// Process a single batch of items with AI
async function processBatchWithAI(
  batchItems: InventoryRiskItem[],
  suppliersBySku: Map<string, SupplierContract[]>,
  batchNumber: number,
  totalBatches: number
): Promise<PurchaseRecommendation[]> {
  const MAX_SUPPLIERS_PER_ITEM = 4;
  
  // Prepare context for AI - simplified structure
  const context = batchItems.map((item) => {
    const suppliers = suppliersBySku.get(item.sku_id) || [];
    // Sort suppliers by reliability_score DESC, then price ASC, take top suppliers
    const topSuppliers = suppliers
      .sort((a, b) => {
        const scoreDiff = (b.reliability_score || 0) - (a.reliability_score || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return (a.price_per_unit || 0) - (b.price_per_unit || 0);
      })
      .slice(0, MAX_SUPPLIERS_PER_ITEM)
      .map((s) => ({
        name: s.supplier_name || 'Unknown',
        price: s.price_per_unit || 0,
        lead_days: Math.round((s.lead_time_hours || 0) / 24 * 10) / 10,
        reliability: s.reliability_score || 0,
        min_qty: s.min_order_qty || 0,
      }));
    
    return {
      sku: item.sku_id,
      name: item.item_name || 'Unknown',
      stock: item.current_stock || 0,
      par: item.par_level || 0,
      days_left: Math.round((item.days_until_stockout || 0) * 10) / 10,
      burn_rate: Math.round((item.burn_rate_daily || 0) * 10) / 10,
      suppliers: topSuppliers,
    };
  });

  // Log payload size for debugging
  const contextStr = JSON.stringify(context);
  const promptSize = contextStr.length;
  console.log(`   📊 Batch ${batchNumber}/${totalBatches}: ${(promptSize / 1024).toFixed(1)} KB (${batchItems.length} items)`);

  const prompt = `Analyze these critical inventory items and provide purchase recommendations.

ITEMS:
${JSON.stringify(context)}

For each item:
1. Calculate recommended_quantity = max(par_level - current_stock, burn_rate_daily * 7, min_order_qty)
2. Select best supplier (balance: reliability > price > lead_days)
3. Calculate total_cost = recommended_quantity * supplier.price
4. Set urgency: days_left < 3 = "critical", < 7 = "high", < 14 = "medium", else "low"
5. Brief reasoning (1 sentence)

Return JSON array:
[{"sku_id":"string","item_name":"string","current_stock":0,"par_level":0,"days_until_stockout":0,"recommended_quantity":0,"suppliers":[{"supplier_name":"string","price_per_unit":0,"lead_time_hours":0,"reliability_score":0,"min_order_qty":0,"total_cost":0,"recommended":true}],"reasoning":"string","urgency":"critical|high|medium|low"}]

Return only JSON, no markdown or extra text.`;

  try {
    // Make request to DeepSeek API
    const url = new URL(DEEPSEEK_ENDPOINT);

    const requestData = JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 3000,
    });

    // Add timeout and retry logic
    const TIMEOUT_MS = 300000; // 5 minutes
    const MAX_RETRIES = 1;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`   Retry attempt ${attempt - 1}/${MAX_RETRIES}...`);
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }

        const response = await new Promise<string>((resolve, reject) => {
          const req = https.request(
            {
              hostname: url.hostname,
              path: url.pathname,
              method: 'POST',
              timeout: TIMEOUT_MS,
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${DEEPSEEK_AUTH}`,
                'Content-Length': Buffer.byteLength(requestData),
              },
            },
            (res: any) => {
              let body = '';
              res.on('data', (chunk: Buffer) => (body += chunk.toString()));
              res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                  resolve(body);
                } else {
                  if (res.statusCode === 524 || (res.statusCode >= 500 && res.statusCode < 600)) {
                    reject(new Error(`RETRYABLE_ERROR_${res.statusCode}: ${body.substring(0, 200)}`));
                  } else {
                    reject(new Error(`DeepSeek API error ${res.statusCode}: ${body.substring(0, 200)}`));
                  }
                }
              });
            }
          );

          req.on('error', (err) => {
            reject(new Error(`Request error: ${err.message}`));
          });

          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
          });

          req.write(requestData);
          req.end();
        });

        // Success - parse response
        const aiResponse = JSON.parse(response);
        const content = aiResponse.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error('No content in AI response');
        }

        // Extract JSON from response
        let jsonStr = content.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const recommendations = JSON.parse(jsonStr);
        console.log(`   ✅ Batch ${batchNumber}/${totalBatches}: Generated ${recommendations.length} recommendations using DeepSeek AI`);
        return recommendations;
      } catch (error: any) {
        lastError = error;
        const errorMsg = error.message || String(error);
        
        if (errorMsg.includes('RETRYABLE_ERROR_') || errorMsg.includes('timeout') || errorMsg.includes('Request timeout')) {
          if (attempt <= MAX_RETRIES) {
            console.log(`   ⚠️  Batch ${batchNumber} attempt ${attempt} failed: ${errorMsg.substring(0, 100)}...`);
            continue;
          }
        }
        
        throw error;
      }
    }

    // If we get here, all retries failed - use local fallback
    console.log(`   ⚠️  Batch ${batchNumber} AI API unavailable, using local recommendation engine...`);
    return generateRecommendationsLocal(batchItems, suppliersBySku);
  } catch (error) {
    console.error(`   ❌ Batch ${batchNumber} error:`, error);
    console.log(`   ⚠️  Falling back to local recommendation engine for batch ${batchNumber}...`);
    return generateRecommendationsLocal(batchItems, suppliersBySku);
  }
}

// Generate AI recommendations using DeepSeek - processes all items in batches
async function generateRecommendations(
  inventoryItems: InventoryRiskItem[],
  suppliersBySku: Map<string, SupplierContract[]>
): Promise<PurchaseRecommendation[]> {
  console.log('\n🤖 Generating AI recommendations...');

  const BATCH_SIZE = 4;
  const totalBatches = Math.ceil(inventoryItems.length / BATCH_SIZE);
  
  console.log(`   Processing ${inventoryItems.length} items in ${totalBatches} batches of ${BATCH_SIZE}...`);
  
  const allRecommendations: PurchaseRecommendation[] = [];
  
  // Process each batch sequentially
  for (let i = 0; i < inventoryItems.length; i += BATCH_SIZE) {
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const batchItems = inventoryItems.slice(i, i + BATCH_SIZE);
    
    console.log(`\n   Processing batch ${batchNumber}/${totalBatches} (items ${i + 1}-${Math.min(i + BATCH_SIZE, inventoryItems.length)})...`);
    
    const batchRecommendations = await processBatchWithAI(
      batchItems,
      suppliersBySku,
      batchNumber,
      totalBatches
    );
    
    allRecommendations.push(...batchRecommendations);
  }
  
  console.log(`\n   ✅ Completed all batches: Generated ${allRecommendations.length} total recommendations`);
  return allRecommendations;
}

// Save recommendations to API
async function saveRecommendations(recommendations: PurchaseRecommendation[]): Promise<number> {
  const url = `${API_BASE_URL}/api/agent/outputs`;
  const payload = {
    agent_name: 'inventory_agent',
    output_type: 'purchase_recommendation',
    window_start: new Date().toISOString().split('T')[0],
    window_end: null,
    payload: {
      generated_at: new Date().toISOString(),
      recommendations,
      summary: {
        total_items: recommendations.length,
        critical_count: recommendations.filter((r) => r.urgency === 'critical').length,
        high_count: recommendations.filter((r) => r.urgency === 'high').length,
        estimated_total_cost: recommendations.reduce((sum, r) => {
          const bestSupplier = r.suppliers.find((s) => s.recommended);
          return sum + (bestSupplier?.total_cost || 0);
        }, 0),
      },
    },
  };

  console.log('\n💾 Saving recommendations to API...');
  const result = await httpRequest('POST', url, payload);
  console.log(`   Saved with ID: ${result.id}`);
  return result.id;
}

// Main agent function
async function runInventoryAgent(days: number = 7) {
  console.log('=========================================');
  console.log('Inventory Management AI Agent');
  console.log('=========================================\n');

  try {
    // Step 1: Get critical inventory items
    const criticalItems = await getCriticalInventory(days);

    if (criticalItems.length === 0) {
      console.log('✅ No critical inventory items found. All items are well-stocked!');
      return;
    }

    // Step 2: Get suppliers for all critical items
    console.log('\n🔍 Fetching supplier information...');
    const skuIds = criticalItems.map((item) => item.sku_id);
    const allSuppliers = await getSuppliersForSkus(skuIds);

    // Group suppliers by SKU
    const suppliersBySku = new Map<string, SupplierContract[]>();
    for (const supplier of allSuppliers) {
      if (!suppliersBySku.has(supplier.sku_id)) {
        suppliersBySku.set(supplier.sku_id, []);
      }
      suppliersBySku.get(supplier.sku_id)!.push(supplier);
    }

    console.log(`   Found suppliers for ${suppliersBySku.size} items`);

    // Step 3: Generate AI recommendations
    const recommendations = await generateRecommendations(criticalItems, suppliersBySku);

    // Step 4: Display recommendations
    console.log('\n📋 Purchase Recommendations:');
    console.log('=========================================');
    for (const rec of recommendations) {
      const bestSupplier = rec.suppliers.find((s) => s.recommended);
      console.log(`\n${rec.item_name} (${rec.sku_id})`);
      console.log(`  Urgency: ${rec.urgency.toUpperCase()}`);
      console.log(`  Current Stock: ${rec.current_stock}`);
      console.log(`  Days Until Stockout: ${rec.days_until_stockout.toFixed(1)}`);
      console.log(`  Recommended Quantity: ${rec.recommended_quantity}`);
      if (bestSupplier) {
        console.log(`  Recommended Supplier: ${bestSupplier.supplier_name}`);
        console.log(`  Unit Price: $${bestSupplier.price_per_unit.toFixed(2)}`);
        console.log(`  Total Cost: $${bestSupplier.total_cost.toFixed(2)}`);
        console.log(`  Lead Time: ${(bestSupplier.lead_time_hours / 24).toFixed(1)} days`);
      }
      console.log(`  Reasoning: ${rec.reasoning}`);
    }

    // Step 5: Save recommendations
    const savedId = await saveRecommendations(recommendations);

    console.log('\n=========================================');
    console.log('✅ Agent completed successfully!');
    console.log(`   Recommendations saved with ID: ${savedId}`);
    console.log('=========================================');
  } catch (error) {
    console.error('\n❌ Agent failed:', error);
    process.exit(1);
  }
}

// Run the agent
const daysThreshold = process.argv[2] ? parseInt(process.argv[2], 10) : 7;
runInventoryAgent(daysThreshold).catch(console.error);

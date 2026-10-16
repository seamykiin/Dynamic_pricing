export interface Competitor {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
  rating: number;
  shippingDays: number;
  lastUpdated?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  costPrice?: number;
  currentPrice: number;
  previousPrice?: number;
  competitorPrice: number;
  minCompetitorPrice?: number;
  avgCompetitorPrice?: number;
  aiSuggestedPrice: number;
  margin: number; // %
  trend: "up" | "down" | "flat";
  strategy?: string;
  competitors?: Competitor[];
  competitorStockoutsCount?: number;
  guardrailStatus?: string;
  guardrailReason?: string;
  rating?: number;
  reviewsCount?: number;
  badge?: string | null;
  imageUrl?: string | null;
}

export interface KPIs {
  totalActiveSkus: number;
  revenueLiftPct: number;
  apiLatencyMs: number;
  enginePricedToday: number;
  recentOrdersCount?: number;
  pendingAiCount?: number;
  competitorStockouts?: number;
}

export interface PricePoint {
  time: string;
  ourPrice: number;
  competitorPrice: number;
}

export interface DashboardPayload {
  kpis: KPIs;
  products: Product[];
  elasticity: PricePoint[];
}

export interface VolumeTier {
  minQty: number;
  maxQty: number | null;
  label: string;
  discountPct: number;
  unitPrice: number;
}

export interface StoreProduct {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  costPrice?: number;
  referenceMrp: number;
  discountPct: number;
  competitorPrice: number;
  rating: number;
  reviewsCount: number;
  badge: string | null;
  imageUrl: string | null;
  priceTag: string;
  inStock: boolean;
  volumeTiers?: VolumeTier[];
}

export interface RFQPayload {
  ok: boolean;
  rfqId: string;
  companyName: string;
  productId: string;
  productName: string;
  requestedQuantity: number;
  deliveryDays: number;
  standardUnitPrice: number;
  quotedUnitPrice: number;
  totalQuote: number;
  totalSavings: number;
  savingsPct: number;
  marginPct: number;
  status: string;
  validForDays: number;
  aiRationale: string;
}

export interface TelemetryLog {
  id: number;
  productId: string;
  inventory: number;
  competitor_price: number;
  suggested_price: number;
  cost_price: number;
  status: string;
  reason: string;
  timestamp: string;
  previousPrice?: number;
  appliedPrice?: number;
  isRollback?: boolean;
  canRollback?: boolean;
}

export interface RecentOrder {
  id: number;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customer: string;
  timestamp: string;
}

export interface ReportsPayload {
  telemetry: TelemetryLog[];
  recentOrders: RecentOrder[];
}

export interface WhatIfCurvePoint {
  price: number;
  projectedDemand: number;
  unitsSold: number;
  projectedRevenue: number;
  projectedProfit: number;
  marginPct: number;
}

export interface WhatIfPayload {
  productId: string;
  productName: string;
  costPrice: number;
  simulatedCompetitorPrice: number;
  simulatedStock: number;
  demandSurgeMultiplier: number;
  aiRecommendedPrice: number;
  guardrailStatus: string;
  reason: string;
  optimalProfitPoint: WhatIfCurvePoint;
  curve: WhatIfCurvePoint[];
}

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export interface ProductElasticityTrajectory {
  productId: string;
  productName: string;
  category: string;
  currentPrice: number;
  competitorPrice: number;
  aiSuggestedPrice: number;
  costPrice: number;
  margin: number;
  stock: number;
  strategy: string;
  elasticityScore: number;
  elasticityLabel: string;
  trajectory: PricePoint[];
}

export async function fetchDashboard(productId?: string): Promise<DashboardPayload> {
  const url = productId
    ? `${API_BASE_URL}/api/dashboard?productId=${encodeURIComponent(productId)}`
    : `${API_BASE_URL}/api/dashboard`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch dashboard");
  return res.json();
}

export async function fetchProductElasticityTrajectory(productId: string): Promise<ProductElasticityTrajectory> {
  const res = await fetch(`${API_BASE_URL}/api/products/${encodeURIComponent(productId)}/elasticity-trajectory`);
  if (!res.ok) throw new Error("Failed to fetch product elasticity trajectory");
  return res.json();
}

export async function applyAiPrice(productId: string, newPrice: number) {
  const res = await fetch(`${API_BASE_URL}/api/apply-price`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, newPrice })
  });
  if (!res.ok) throw new Error("Failed to apply price");
  return res.json();
}

export async function applyAllAiPrices() {
  const res = await fetch(`${API_BASE_URL}/api/apply-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) throw new Error("Failed to apply all prices");
  return res.json();
}

export async function updateManualPrice(productId: string, newPrice: number) {
  const res = await fetch(`${API_BASE_URL}/api/products/${productId}/price`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newPrice })
  });
  if (!res.ok) throw new Error("Failed to update price");
  return res.json();
}

export async function createProduct(product: Partial<Product>) {
  const res = await fetch(`${API_BASE_URL}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product)
  });
  if (!res.ok) throw new Error("Failed to create product");
  return res.json();
}

export async function deleteProduct(productId: string): Promise<{ ok: boolean; productId: string; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/products/${encodeURIComponent(productId)}`, {
    method: "DELETE"
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to delete product");
  }
  return res.json();
}

export async function fetchReports(): Promise<ReportsPayload> {
  const res = await fetch(`${API_BASE_URL}/api/reports`);
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json();
}

// --- Storefront Methods ---

export async function fetchStoreProducts(): Promise<{ products: StoreProduct[] }> {
  const res = await fetch(`${API_BASE_URL}/api/store/products`);
  if (!res.ok) throw new Error("Failed to fetch store products");
  return res.json();
}

export async function placeStoreOrder(productId: string, quantity: number = 1, customerName?: string) {
  const res = await fetch(`${API_BASE_URL}/api/store/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity, customerName })
  });
  if (!res.ok) throw new Error("Failed to place order");
  return res.json();
}

export async function triggerSurgeSimulation(productId?: string, surgeMultiplier: number = 1.8, orderCount: number = 8) {
  const res = await fetch(`${API_BASE_URL}/api/store/surge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, surgeMultiplier, orderCount })
  });
  if (!res.ok) throw new Error("Failed to trigger surge");
  return res.json();
}

export async function fetchWhatIfSimulation(
  productId: string,
  competitorPriceDeltaPct: number,
  inventoryLevel: number,
  demandSurgeMultiplier: number
): Promise<WhatIfPayload> {
  const res = await fetch(`${API_BASE_URL}/api/simulate/what-if`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId,
      competitorPriceDeltaPct,
      inventoryLevel,
      demandSurgeMultiplier
    })
  });
  if (!res.ok) throw new Error("Failed to simulate what-if");
  return res.json();
}

export async function requestRFQ(params: {
  productId: string;
  quantity: number;
  targetPrice?: number;
  companyName: string;
  deliveryDays?: number;
}): Promise<RFQPayload> {
  const res = await fetch(`${API_BASE_URL}/api/store/rfq`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error("Failed to generate RFQ quote");
  return res.json();
}

export async function triggerRetraining() {
  const res = await fetch(`${API_BASE_URL}/api/train`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to trigger model retraining");
  return res.json();
}

export async function updateProductStrategy(productId: string, strategy: string) {
  const res = await fetch(`${API_BASE_URL}/api/products/${productId}/strategy`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ strategy })
  });
  if (!res.ok) throw new Error("Failed to update product strategy");
  return res.json();
}

export async function rollbackPrice(productId: string, logId?: number) {
  const res = await fetch(`${API_BASE_URL}/api/prices/rollback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, logId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to rollback price" }));
    throw new Error(err.detail || "Failed to rollback price");
  }
  return res.json();
}

export async function triggerCompetitorScrape() {
  const res = await fetch(`${API_BASE_URL}/api/competitors/scrape`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to scrape competitor market");
  return res.json();
}

export interface CopilotResponse {
  ok: boolean;
  query: string;
  answer: string;
  confidence: number;
  source?: string;
  actionRecommended?: string;
}

export interface MlElasticityDiagnostics {
  productId: string;
  productName: string;
  currentPrice: number;
  costPrice: number;
  competitorPrice: number;
  elasticityScore: number;
  elasticityLabel: string;
  optimalPrice: number;
  expectedDemand: number;
  expectedProfit: number;
  framework: string;
  featureImportances: Record<string, number>;
  hasCompetitorStockout: boolean;
  curve: WhatIfCurvePoint[];
}

export interface LiveScrapeResponse {
  ok: boolean;
  productId: string;
  competitors: Competitor[];
  newCompetitorPrice: number;
  newAiSuggestedPrice: number;
  status: string;
  reason: string;
}

export async function askAiCopilot(query: string, productId?: string): Promise<CopilotResponse> {
  const res = await fetch(`${API_BASE_URL}/api/ai/copilot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, productId })
  });
  if (!res.ok) throw new Error("Failed to consult AI Copilot");
  return res.json();
}

export async function fetchMlElasticity(productId: string): Promise<MlElasticityDiagnostics> {
  const res = await fetch(`${API_BASE_URL}/api/ai/elasticity/${productId}`);
  if (!res.ok) throw new Error("Failed to fetch ML elasticity diagnostics");
  return res.json();
}

export async function scrapeLiveCompetitors(params: {
  productId?: string;
  shopifyUrl?: string;
  serpapiKey?: string;
}): Promise<LiveScrapeResponse> {
  const res = await fetch(`${API_BASE_URL}/api/competitors/scrape-live`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error("Failed to execute live competitor scrape");
  return res.json();
}

export async function triggerMlRetraining(): Promise<{ ok: boolean; framework: string; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/ml/retrain`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to trigger ML retraining");
  return res.json();
}

export interface InspectUrlResponse {
  ok: boolean;
  title: string;
  vendor: string;
  price: number;
  currency: string;
  inStock: boolean;
  sku: string;
  imageUrl: string;
  category: string;
  sourceUrl: string;
  sourceType: string;
}

export interface TrackFromUrlParams {
  url: string;
  costPrice?: number;
  stock?: number;
  strategy?: string;
  customSku?: string;
  targetMargin?: number;
}

export async function inspectCompetitorUrl(url: string): Promise<InspectUrlResponse> {
  const res = await fetch(`${API_BASE_URL}/api/competitors/inspect-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to inspect URL" }));
    throw new Error(err.detail || "Failed to inspect URL");
  }
  return res.json();
}

export async function trackProductFromUrl(params: TrackFromUrlParams): Promise<{ ok: boolean; product: any }> {
  const res = await fetch(`${API_BASE_URL}/api/products/track-from-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to track product from URL" }));
    throw new Error(err.detail || "Failed to track product from URL");
  }
  return res.json();
}

export async function refreshTrackedCompetitorUrls(): Promise<{ ok: boolean; refreshedCount: number; updates: any[]; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/competitors/refresh-tracked-urls`, {
    method: "POST"
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to refresh tracked competitor URLs" }));
    throw new Error(err.detail || "Failed to refresh tracked competitor URLs");
  }
  return res.json();
}

export { API_BASE_URL };


// API client for Dynamic Pricing Engine & Amazon-Style Storefront

export interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  costPrice?: number;
  currentPrice: number;
  competitorPrice: number;
  aiSuggestedPrice: number;
  margin: number; // %
  trend: "up" | "down" | "flat";
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

export async function fetchDashboard(): Promise<DashboardPayload> {
  const res = await fetch(`${API_BASE_URL}/api/dashboard`);
  if (!res.ok) throw new Error("Failed to fetch dashboard");
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

export { API_BASE_URL };

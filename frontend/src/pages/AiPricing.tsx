import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TopNav } from "@/components/dashboard/TopNav";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  fetchDashboard,
  applyAiPrice,
  applyAllAiPrices,
  updateProductStrategy,
  rollbackPrice,
  triggerCompetitorScrape,
  askAiCopilot,
  fetchMlElasticity,
  scrapeLiveCompetitors,
  triggerMlRetraining,
  inspectCompetitorUrl,
  trackProductFromUrl,
  refreshTrackedCompetitorUrls,
  type Product,
  type Competitor,
  type DashboardPayload,
  type CopilotResponse,
  type MlElasticityDiagnostics,
  type InspectUrlResponse
} from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Sparkles,
  RefreshCw,
  Undo2,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  Check,
  CheckCheck,
  Search,
  ExternalLink,
  Sliders,
  Store,
  Layers,
  BarChart3,
  Building2,
  AlertCircle,
  Bot,
  Globe,
  Send,
  Cpu,
  CheckCircle2,
  HelpCircle,
  Plus,
  Link2,
  ArrowRight,
  Loader2
} from "lucide-react";

const STRATEGY_DEFINITIONS: Record<
  string,
  { label: string; desc: string; color: string; icon: string }
> = {
  profit_maximizer: {
    label: "Profit Maximizer",
    desc: "RL / Elasticity equilibrium maximizing gross profit yield",
    color: "bg-primary/10 text-primary border-primary/20",
    icon: "🎯"
  },
  aggressive_undercut: {
    label: "Buy Box Undercut",
    desc: "Undercuts lowest in-stock competitor by 1.5% to win market share",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: "⚡"
  },
  clearance_markdown: {
    label: "Clearance Markdown",
    desc: "Aggressive tiered markdowns (-5% to -12%) to liquidate aging inventory",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: "📦"
  },
  brand_premium: {
    label: "Brand Premium",
    desc: "Positions +6% above market average leveraging high seller reputation",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    icon: "👑"
  },
  margin_preservation: {
    label: "Margin Preservation",
    desc: "Locks price to cost-plus 35% gross margin floor",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: "🛡️"
  }
};

const fmt = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });

export default function AiPricing() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applyingAll, setApplyingAll] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);
  const [changingStrategyId, setChangingStrategyId] = useState<string | null>(null);

  // Copilot State
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResult, setCopilotResult] = useState<CopilotResponse | null>(null);

  // Live Scraper State
  const [shopifyUrl, setShopifyUrl] = useState("shop.machinemail.com");
  const [serpapiKey, setSerpapiKey] = useState("");
  const [selectedScrapeSku, setSelectedScrapeSku] = useState("VLV-X200");
  const [liveScraping, setLiveScraping] = useState(false);

  // AI Tab selection
  const [activeAiTab, setActiveAiTab] = useState<"copilot" | "scraper" | "diagnostics">("copilot");
  const [retrainingMl, setRetrainingMl] = useState(false);
  const [mlDiagnostics, setMlDiagnostics] = useState<MlElasticityDiagnostics | null>(null);

  // Competitor URL Tracking Modal State
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [inspectUrlInput, setInspectUrlInput] = useState("https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html");
  const [inspectingUrl, setInspectingUrl] = useState(false);
  const [inspectedProduct, setInspectedProduct] = useState<InspectUrlResponse | null>(null);
  const [trackCostPrice, setTrackCostPrice] = useState<number>(0);
  const [trackStock, setTrackStock] = useState<number>(100);
  const [trackStrategy, setTrackStrategy] = useState<string>("profit_maximizer");
  const [submittingTrack, setSubmittingTrack] = useState(false);
  const [refreshingTracked, setRefreshingTracked] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [strategyFilter, setStrategyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "diverged" | "stockout">("all");

  const loadData = async (showToast = false) => {
    try {
      const res = await fetchDashboard();
      setData(res);
      if (showToast) {
        toast.success("Telemetry Synced", { description: "Catalog and competitor benchmarks refreshed." });
      }
    } catch (err: any) {
      toast.error("Failed to load AI pricing telemetry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), 20000);
    return () => clearInterval(interval);
  }, []);

  const handleApply = async (p: Product) => {
    setApplyingId(p.id);
    try {
      await applyAiPrice(p.id, p.aiSuggestedPrice);
      toast.success(`Applied AI Price for ${p.id}`, {
        description: `${fmt(p.currentPrice)} → ${fmt(p.aiSuggestedPrice)} (Margin: ${p.margin}%)`
      });
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to apply AI price");
    } finally {
      setApplyingId(null);
    }
  };

  const handleApplyAll = async () => {
    setApplyingAll(true);
    try {
      const res = await applyAllAiPrices();
      toast.success(`Batch Applied AI Prices!`, {
        description: `Updated ${res.appliedCount} SKUs to optimal AI recommendations.`
      });
      await loadData();
    } catch (err: any) {
      toast.error("Failed to apply all prices");
    } finally {
      setApplyingAll(false);
    }
  };

  const handleStrategyChange = async (productId: string, newStrategy: string) => {
    setChangingStrategyId(productId);
    try {
      const res = await updateProductStrategy(productId, newStrategy);
      const stratDef = STRATEGY_DEFINITIONS[newStrategy];
      toast.success(`Strategy Updated: ${stratDef?.label ?? newStrategy}`, {
        description: `New suggested price: ${fmt(res.aiSuggestedPrice)} (${res.reason})`
      });
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update strategy");
    } finally {
      setChangingStrategyId(null);
    }
  };

  const handleRollback = async (productId: string) => {
    setRollingBackId(productId);
    try {
      const res = await rollbackPrice(productId);
      toast.success(`Price Rolled Back!`, {
        description: res.message || `Restored prior price: ${fmt(res.revertedPrice)}`
      });
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Rollback failed");
    } finally {
      setRollingBackId(null);
    }
  };

  const handleScrapeCompetitors = async () => {
    setScraping(true);
    try {
      const res = await triggerCompetitorScrape();
      toast.success(`Competitor Market Scrape Finished!`, {
        description: `Scraped ${res.scrapedSkusCount} SKUs. Found ${res.stockoutOpportunities} competitor stockout opportunities.`
      });
      await loadData();
    } catch (err: any) {
      toast.error("Failed to scrape competitors");
    } finally {
      setScraping(false);
    }
  };

  const handleAskCopilot = async (q?: string) => {
    const queryToAsk = q || copilotQuery;
    if (!queryToAsk.trim()) return;
    setCopilotLoading(true);
    try {
      const res = await askAiCopilot(queryToAsk);
      setCopilotResult(res);
      toast.success("AI Copilot Analysis Generated");
    } catch (err: any) {
      toast.error(err.message || "Failed to query AI Copilot");
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleLiveScrape = async () => {
    setLiveScraping(true);
    try {
      const res = await scrapeLiveCompetitors({
        productId: selectedScrapeSku,
        shopifyUrl: shopifyUrl.trim() || undefined,
        serpapiKey: serpapiKey.trim() || undefined
      });
      toast.success("Live Competitor Scrape Complete", {
        description: `Updated ${res.productId}: New comp price ${fmt(res.newCompetitorPrice)}, AI suggested ${fmt(res.newAiSuggestedPrice)}`
      });
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to scrape live competitors");
    } finally {
      setLiveScraping(false);
    }
  };

  const handleRetrainMl = async () => {
    setRetrainingMl(true);
    try {
      const res = await triggerMlRetraining();
      toast.success("ML Demand Forecaster Retrained", {
        description: res.message
      });
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Retraining failed");
    } finally {
      setRetrainingMl(false);
    }
  };

  const handleFetchDiagnostics = async (sku: string) => {
    try {
      const diag = await fetchMlElasticity(sku);
      setMlDiagnostics(diag);
      toast.success(`Loaded Elasticity Diagnostics for ${sku}`);
    } catch (err: any) {
      toast.error("Failed to load elasticity diagnostics");
    }
  };

  const handleInspectUrl = async () => {
    if (!inspectUrlInput.trim()) return;
    setInspectingUrl(true);
    try {
      const res = await inspectCompetitorUrl(inspectUrlInput.trim());
      setInspectedProduct(res);
      setTrackCostPrice(Number((res.price * 0.65).toFixed(2)));
      toast.success("Competitor Product Inspected", {
        description: `Found: ${res.title} at ${fmt(res.price)} (${res.vendor})`
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to inspect competitor URL");
    } finally {
      setInspectingUrl(false);
    }
  };

  const handleTrackProduct = async () => {
    if (!inspectUrlInput.trim()) return;
    setSubmittingTrack(true);
    try {
      const res = await trackProductFromUrl({
        url: inspectUrlInput.trim(),
        costPrice: trackCostPrice > 0 ? trackCostPrice : undefined,
        stock: trackStock > 0 ? trackStock : 100,
        strategy: trackStrategy
      });
      toast.success("Competitor Product Tracked & Added!", {
        description: `${res.product.name} (SKU: ${res.product.id}) is now monitored with AI pricing at ${fmt(res.product.aiSuggestedPrice)}.`
      });
      setTrackModalOpen(false);
      setInspectedProduct(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to track product from URL");
    } finally {
      setSubmittingTrack(false);
    }
  };

  const handleRefreshTrackedUrls = async () => {
    setRefreshingTracked(true);
    try {
      const res = await refreshTrackedCompetitorUrls();
      toast.success("Live Competitor Prices Refreshed!", {
        description: res.message
      });
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to refresh tracked competitor URLs");
    } finally {
      setRefreshingTracked(false);
    }
  };

  const products = data?.products ?? [];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    const activeStrat = p.strategy || "profit_maximizer";
    const matchesStrategy = strategyFilter === "all" || activeStrat === strategyFilter;

    const priceDelta = Math.abs(p.currentPrice - p.aiSuggestedPrice);
    const hasDivergence = priceDelta >= 0.5;
    const hasStockout = (p.competitorStockoutsCount ?? 0) > 0;

    let matchesStatus = true;
    if (statusFilter === "diverged") matchesStatus = hasDivergence;
    if (statusFilter === "stockout") matchesStatus = hasStockout;

    return matchesSearch && matchesStrategy && matchesStatus;
  });

  // Aggregated KPIs
  const totalSkus = products.length;
  const pendingCount = products.filter((p) => Math.abs(p.currentPrice - p.aiSuggestedPrice) >= 0.5).length;
  const stockoutOpps = products.filter((p) => (p.competitorStockoutsCount ?? 0) > 0).length;
  const rollbackAvailableCount = products.filter(
    (p) => p.previousPrice !== undefined && p.previousPrice !== null && p.previousPrice !== p.currentPrice
  ).length;

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="flex-1 px-6 py-6 lg:px-8">
          <div className="mx-auto max-w-[1440px] space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
                    AI Pricing Command Center
                  </h1>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Predictive ML Demand Forecaster (XGBoost/GBDT) + Generative AI Strategy Copilot with live SerpApi & Open Shopify feeds.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleScrapeCompetitors}
                  disabled={scraping}
                  className="h-9 gap-2 border-border bg-card hover:bg-secondary"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-primary ${scraping ? "animate-spin" : ""}`} />
                  {scraping ? "Crawling Market..." : "Crawl Competitors"}
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleApplyAll}
                  disabled={applyingAll || pendingCount === 0}
                  className="h-9 gap-2 bg-gradient-primary shadow-elevated"
                >
                  <CheckCheck className="h-4 w-4" />
                  Apply All AI Prices ({pendingCount})
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshTrackedUrls}
                  disabled={refreshingTracked}
                  className="h-9 gap-1.5 border-primary/40 text-primary hover:bg-primary/10 shadow-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshingTracked ? "animate-spin" : ""}`} />
                  {refreshingTracked ? "Scraping Live URLs..." : "Refresh Live URLs"}
                </Button>

                {/* Track Competitor Product Dialog */}
                <Dialog open={trackModalOpen} onOpenChange={setTrackModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5 border-primary/40 text-primary hover:bg-primary/10 shadow-xs"
                    >
                      <Plus className="h-4 w-4" />
                      Track Competitor URL
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[560px] bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-foreground text-lg">
                        <Globe className="h-5 w-5 text-primary" />
                        Track Product from Any Website
                      </DialogTitle>
                      <p className="text-xs text-muted-foreground">
                        Paste any competitor product page URL (Shopify, WooCommerce, Amazon, or any e-commerce site). Our Universal Extractor parses real-time prices, stock, and metadata.
                      </p>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                      {/* URL Input & Quick Examples */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Competitor Product URL
                        </label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://competitor.com/products/valve-x200"
                            value={inspectUrlInput}
                            onChange={(e) => setInspectUrlInput(e.target.value)}
                            className="h-10 text-sm border-border bg-surface font-mono"
                          />
                          <Button
                            onClick={handleInspectUrl}
                            disabled={inspectingUrl || !inspectUrlInput.trim()}
                            className="h-10 gap-1.5 bg-gradient-primary shrink-0"
                          >
                            {inspectingUrl ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                            {inspectingUrl ? "Extracting..." : "Inspect"}
                          </Button>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] text-muted-foreground">Quick test URLs:</span>
                          {[
                            "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html",
                            "https://books.toscrape.com/catalogue/soumission_998/index.html"
                          ].map((demoUrl, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setInspectUrlInput(demoUrl)}
                              className="text-[11px] text-primary/80 hover:text-primary underline font-mono truncate max-w-[230px]"
                            >
                              {demoUrl.split("/").slice(-2)[0]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Inspected Product Preview Card */}
                      {inspectedProduct && (
                        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-3 animate-in fade-in duration-300">
                          <div className="flex items-start gap-3">
                            <img
                              src={inspectedProduct.imageUrl}
                              alt={inspectedProduct.title}
                              className="h-16 w-16 rounded-lg object-cover border border-border bg-surface shrink-0"
                            />
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-foreground truncate">
                                  {inspectedProduct.title}
                                </span>
                                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10 shrink-0">
                                  {inspectedProduct.inStock ? "In Stock" : "Stockout"}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <span>Vendor: <strong className="text-foreground">{inspectedProduct.vendor}</strong></span>
                                <span>·</span>
                                <span>Source: <code className="text-primary font-mono text-[11px]">{inspectedProduct.sourceType}</code></span>
                              </div>
                              <div className="text-base font-bold text-foreground font-mono">
                                Live Competitor Price: <span className="text-primary">{fmt(inspectedProduct.price)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Listing Configuration */}
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-muted-foreground">
                                Your Cost Price (COGS)
                              </label>
                              <Input
                                type="number"
                                step="0.5"
                                value={trackCostPrice}
                                onChange={(e) => setTrackCostPrice(Number(e.target.value))}
                                className="h-8 text-xs border-border bg-surface"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-muted-foreground">
                                Initial Stock
                              </label>
                              <Input
                                type="number"
                                value={trackStock}
                                onChange={(e) => setTrackStock(Number(e.target.value))}
                                className="h-8 text-xs border-border bg-surface"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-muted-foreground">
                              AI Dynamic Pricing Strategy
                            </label>
                            <select
                              value={trackStrategy}
                              onChange={(e) => setTrackStrategy(e.target.value)}
                              className="w-full h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="profit_maximizer">🎯 Profit Maximizer (ML Demand Forecaster)</option>
                              <option value="aggressive_undercut">⚡ Buy Box Undercut (-1.5% below competitor)</option>
                              <option value="brand_premium">👑 Brand Premium (+6% above market)</option>
                              <option value="clearance_markdown">📦 Clearance Markdown</option>
                              <option value="margin_preservation">🛡️ Margin Preservation Floor (35%)</option>
                            </select>
                          </div>

                          <Button
                            onClick={handleTrackProduct}
                            disabled={submittingTrack}
                            className="w-full h-9 gap-2 bg-gradient-primary shadow-sm font-semibold text-xs"
                          >
                            <Check className="h-4 w-4" />
                            {submittingTrack ? "Activating AI Tracking..." : "Track & Add to AI Catalog"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Link to="/reports">
                  <Button variant="outline" size="sm" className="h-9 gap-1.5 border-border">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    Audit Logs
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick KPI Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Catalog SKUs Monitored</span>
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
                  {totalSkus} Active
                </div>
                <div className="mt-1 text-xs text-muted-foreground">5 Automated Policy Strategies</div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Pending AI Optimizations</span>
                  <AlertCircle className="h-4 w-4 text-warning" />
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-warning font-mono">
                  {pendingCount} SKUs
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Current price drifted from AI equilibrium</div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Competitor Stockout Margin Surcharges</span>
                  <Zap className="h-4 w-4 text-amber-500" />
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-amber-400 font-mono">
                  {stockoutOpps} SKUs
                </div>
                <div className="mt-1 text-xs text-muted-foreground">+4.5% margin boost automatically captured</div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Reversible Price Adjustments</span>
                  <Undo2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-400 font-mono">
                  {rollbackAvailableCount} SKUs
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Historical previous price saved in audit log</div>
              </div>
            </div>

            {/* AI Pricing Intelligence Hub */}
            <div className="rounded-xl border border-primary/20 bg-card p-5 shadow-elevated space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
              
              {/* Hub Header & Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-border/70">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-sm">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground tracking-tight">
                        AI Pricing Intelligence Hub
                      </h2>
                      <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-primary/5">
                        Production AI Suite
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Generative AI Commercial Copilot · Real-Time Competitor Scraping · Predictive ML Elasticity
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface p-1 text-xs">
                  <button
                    onClick={() => setActiveAiTab("copilot")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                      activeAiTab === "copilot"
                        ? "bg-card text-foreground shadow-xs font-semibold text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Bot className="h-3.5 w-3.5" />
                    Strategy Copilot
                  </button>
                  <button
                    onClick={() => setActiveAiTab("scraper")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                      activeAiTab === "scraper"
                        ? "bg-card text-foreground shadow-xs font-semibold text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Live Competitor Feeds
                  </button>
                  <button
                    onClick={() => setActiveAiTab("diagnostics")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                      activeAiTab === "diagnostics"
                        ? "bg-card text-foreground shadow-xs font-semibold text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Cpu className="h-3.5 w-3.5" />
                    ML Demand Forecaster
                  </button>
                </div>
              </div>

              {/* Tab 1: Strategy Copilot */}
              {activeAiTab === "copilot" && (
                <div className="space-y-4">
                  {/* Quick Strategy Prompt Chips */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-medium text-muted-foreground">Quick Analysis:</span>
                    {[
                      { label: "⚡ Competitor Stockout Advantage", q: "Are any competitors currently out of stock and what margin can we capture?" },
                      { label: "🔬 Demand Elasticity Audit", q: "Explain our current price elasticity and price sensitivity." },
                      { label: "🛡️ Margin Guardrails Check", q: "Which products have the lowest gross profit margins and need attention?" },
                      { label: "🎯 Buy Box Repricing", q: "What is our Buy Box undercutting strategy for high-velocity items?" }
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAskCopilot(chip.q)}
                        disabled={copilotLoading}
                        className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground/80 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {/* Question Input */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Ask AI Copilot: e.g. What happens if we lower prices by 5%? How should we adjust valve margins?"
                        value={copilotQuery}
                        onChange={(e) => setCopilotQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAskCopilot(); }}
                        className="h-10 border-border bg-surface text-sm pl-3 pr-10"
                      />
                    </div>
                    <Button
                      onClick={() => handleAskCopilot()}
                      disabled={copilotLoading || !copilotQuery.trim()}
                      className="h-10 gap-1.5 bg-gradient-primary shadow-sm"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {copilotLoading ? "Analyzing..." : "Ask Copilot"}
                    </Button>
                  </div>

                  {/* Copilot Result Box */}
                  {copilotResult && (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-primary">Executive Commercial Analysis</span>
                          {copilotResult.source && (
                            <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">
                              {copilotResult.source}
                            </Badge>
                          )}
                        </div>
                        {copilotResult.actionRecommended && (
                          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Recommended: {copilotResult.actionRecommended}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {copilotResult.answer}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Live Competitor Feeds (SerpApi & Open Shopify) */}
              {activeAiTab === "scraper" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Target SKU</label>
                      <select
                        value={selectedScrapeSku}
                        onChange={(e) => setSelectedScrapeSku(e.target.value)}
                        className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.id} — {p.name.slice(0, 32)}...
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Open Shopify Store URL / Domain
                      </label>
                      <Input
                        placeholder="e.g. shop.machinemail.com or gymshark.com"
                        value={shopifyUrl}
                        onChange={(e) => setShopifyUrl(e.target.value)}
                        className="h-9 border-border bg-surface text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        SerpApi Key (Optional Google Shopping)
                      </label>
                      <Input
                        placeholder="Leave blank to use SerpApi Benchmark"
                        type="password"
                        value={serpapiKey}
                        onChange={(e) => setSerpapiKey(e.target.value)}
                        className="h-9 border-border bg-surface text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Globe className="h-4 w-4 text-primary" />
                      <span>
                        Queries public Shopify <code className="text-primary font-mono bg-surface px-1 py-0.5 rounded">/products.json</code> & SerpApi Google Shopping APIs without fragile selectors.
                      </span>
                    </div>

                    <Button
                      onClick={handleLiveScrape}
                      disabled={liveScraping}
                      className="h-9 gap-2 bg-gradient-primary"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${liveScraping ? "animate-spin" : ""}`} />
                      {liveScraping ? "Fetching Market Feeds..." : "Scrape Live Competitors"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab 3: Predictive ML Demand Forecaster */}
              {activeAiTab === "diagnostics" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg border border-border bg-surface p-3 space-y-1">
                      <span className="text-[11px] text-muted-foreground uppercase font-semibold">Active Model Architecture</span>
                      <div className="text-base font-bold text-foreground font-mono flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-primary" />
                        XGBoost / LightGBM Forecaster
                      </div>
                      <p className="text-xs text-muted-foreground">Trained on order transactions, competitor ratios & demand surges.</p>
                    </div>

                    <div className="rounded-lg border border-border bg-surface p-3 space-y-1">
                      <span className="text-[11px] text-muted-foreground uppercase font-semibold">Microeconomic Elasticity</span>
                      <div className="text-base font-bold text-emerald-400 font-mono">
                        ε = -0.74 (Inelastic Power)
                      </div>
                      <p className="text-xs text-muted-foreground">Strong customer retention; allows +4.5% premium capture on stockouts.</p>
                    </div>

                    <div className="rounded-lg border border-border bg-surface p-3 space-y-2 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold">Model Health</span>
                        <div className="text-sm font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          Calibrated & Optimized
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetrainMl}
                        disabled={retrainingMl}
                        className="h-8 gap-1.5 border-border bg-card hover:bg-secondary text-xs"
                      >
                        <RefreshCw className={`h-3 w-3 ${retrainingMl ? "animate-spin" : ""}`} />
                        {retrainingMl ? "Retraining Model..." : "Retrain ML Forecaster"}
                      </Button>
                    </div>
                  </div>

                  {/* Feature Importance Diagnostics */}
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Predictive Feature Importance Weights (SHAP / Gain):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      {[
                        { name: "Price Ratio", pct: "38%", color: "bg-primary" },
                        { name: "Stockout Advantage", pct: "22%", color: "bg-amber-500" },
                        { name: "Brand Trust & Rating", pct: "16%", color: "bg-purple-500" },
                        { name: "Inventory Scarcity", pct: "14%", color: "bg-blue-500" },
                        { name: "Demand Surge Velocity", pct: "10%", color: "bg-emerald-500" }
                      ].map((f, i) => (
                        <div key={i} className="rounded-md border border-border/70 bg-surface p-2 space-y-1">
                          <div className="flex justify-between text-[11px] font-medium text-foreground">
                            <span>{f.name}</span>
                            <span className="font-mono">{f.pct}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                            <div className={`h-full ${f.color}`} style={{ width: f.pct }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Filter and Strategy Selection Bar */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Search */}
                <div className="relative min-w-[280px] flex-1 max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search SKU, name, or category..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 border-border bg-surface pl-9 text-sm"
                  />
                </div>

                {/* Status Filter Tabs */}
                <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface p-1 text-xs">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`rounded-md px-3 py-1 font-medium transition-all ${
                      statusFilter === "all" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All Items ({products.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter("diverged")}
                    className={`rounded-md px-3 py-1 font-medium transition-all ${
                      statusFilter === "diverged" ? "bg-card text-warning shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Pending Review ({pendingCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter("stockout")}
                    className={`rounded-md px-3 py-1 font-medium transition-all ${
                      statusFilter === "stockout" ? "bg-card text-amber-400 shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Stockout Advantage ({stockoutOpps})
                  </button>
                </div>
              </div>

              {/* Strategy Filter Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                  Active Policy:
                </span>
                <button
                  onClick={() => setStrategyFilter("all")}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                    strategyFilter === "all"
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  All Policies
                </button>
                {Object.entries(STRATEGY_DEFINITIONS).map(([key, def]) => {
                  const isSelected = strategyFilter === key;
                  const count = products.filter((p) => (p.strategy || "profit_maximizer") === key).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setStrategyFilter(key)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <span>{def.icon}</span>
                      <span>{def.label}</span>
                      <span className="ml-1 rounded-full bg-secondary px-1.5 text-[10px] text-muted-foreground font-mono">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product AI Pricing Cards Grid */}
            <div className="space-y-4">
              {loading ? (
                <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-primary" />
                  <p className="mt-3 text-sm font-medium">Computing live market recommendations across catalog...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
                  <p className="text-base font-semibold text-foreground">No SKUs match the selected filters.</p>
                  <p className="mt-1 text-xs text-muted-foreground">Try clearing your search query or selecting "All Policies".</p>
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const stratKey = p.strategy || "profit_maximizer";
                  const stratDef = STRATEGY_DEFINITIONS[stratKey] || STRATEGY_DEFINITIONS.profit_maximizer;
                  const delta = roundTwo(p.aiSuggestedPrice - p.currentPrice);
                  const deltaPct = roundTwo(((p.aiSuggestedPrice - p.currentPrice) / p.currentPrice) * 100);
                  const isPriceDifferent = Math.abs(delta) >= 0.5;
                  const hasStockout = (p.competitorStockoutsCount ?? 0) > 0;
                  const canRollback =
                    p.previousPrice !== undefined &&
                    p.previousPrice !== null &&
                    p.previousPrice !== p.currentPrice;

                  return (
                    <div
                      key={p.id}
                      className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/40 hover:shadow-elevated"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        {/* Left: Product Info & Strategy Selector */}
                        <div className="flex items-start gap-4 min-w-[280px]">
                          {p.imageUrl && (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="h-16 w-16 shrink-0 rounded-lg object-cover border border-border"
                            />
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-primary">{p.id}</span>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground font-medium">{p.category}</span>
                              {p.badge && (
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                  {p.badge}
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-base font-semibold text-foreground leading-snug">{p.name}</h3>

                            {/* Stock & Cost */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                              <span>
                                Stock: <strong className="text-foreground font-mono">{p.stock} units</strong>
                              </span>
                              <span>·</span>
                              <span>
                                Cost (COGS): <strong className="text-foreground font-mono">{fmt(p.costPrice ?? 0)}</strong>
                              </span>
                              <span>·</span>
                              <span>
                                Rating: <strong className="text-foreground">★ {p.rating ?? 4.7}</strong>
                              </span>
                            </div>

                            {/* Strategy Selector Dropdown */}
                            <div className="pt-2 flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Strategy:
                              </span>
                              <select
                                value={stratKey}
                                disabled={changingStrategyId === p.id}
                                onChange={(e) => handleStrategyChange(p.id, e.target.value)}
                                className={`text-xs rounded-lg border px-2.5 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-primary ${stratDef.color}`}
                              >
                                {Object.entries(STRATEGY_DEFINITIONS).map(([key, def]) => (
                                  <option key={key} value={key} className="bg-card text-foreground font-medium">
                                    {def.icon} {def.label}
                                  </option>
                                ))}
                              </select>
                              {changingStrategyId === p.id && (
                                <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Center: Live Multi-Competitor Intelligence Bar */}
                        <div className="flex-1 max-w-xl rounded-lg border border-border/80 bg-surface/60 p-3">
                          <div className="flex items-center justify-between pb-2 border-b border-border/40 text-[11px]">
                            <span className="font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-primary" />
                              Multi-Competitor Market Quotes
                            </span>
                            {hasStockout && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400 animate-pulse">
                                ⚡ Competitor Stockout Advantage
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-2.5">
                            {(p.competitors ?? []).map((c) => {
                              const isLowestInStock =
                                c.inStock &&
                                (p.competitors ?? []).every((other) => !other.inStock || other.price >= c.price);
                              return (
                                <div
                                  key={c.id}
                                  className={`rounded-md border p-2 text-xs transition-colors ${
                                    !c.inStock
                                      ? "border-destructive/30 bg-destructive/5 text-muted-foreground opacity-75"
                                      : isLowestInStock
                                      ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                                      : "border-border/60 bg-card text-muted-foreground"
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px] font-medium">
                                    <span className="truncate">{c.name}</span>
                                    {isLowestInStock && c.inStock && (
                                      <span className="text-[9px] text-emerald-400 font-bold">Lowest</span>
                                    )}
                                  </div>
                                  <div className="mt-1 flex items-baseline justify-between">
                                    <span className="font-mono font-bold text-foreground text-xs">
                                      {fmt(c.price)}
                                    </span>
                                    <span
                                      className={`text-[9px] font-semibold px-1 rounded ${
                                        c.inStock ? "text-emerald-400" : "text-destructive font-bold bg-destructive/10"
                                      }`}
                                    >
                                      {c.inStock ? `${c.shippingDays}d ship` : "Out of Stock"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Guardrail Reason */}
                          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate font-medium">
                              {p.guardrailStatus}: {p.guardrailReason}
                            </span>
                          </div>
                        </div>

                        {/* Right: Pricing Action & Reversibility */}
                        <div className="flex flex-col items-end gap-2.5 min-w-[200px] shrink-0">
                          {/* Price Comparison */}
                          <div className="text-right">
                            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                              Live Price vs AI Suggestion
                            </div>
                            <div className="flex items-baseline justify-end gap-2 mt-0.5">
                              <span className="text-sm font-semibold text-muted-foreground line-through font-mono">
                                {fmt(p.currentPrice)}
                              </span>
                              <span className="text-xl font-bold text-foreground font-mono">
                                {fmt(p.aiSuggestedPrice)}
                              </span>
                            </div>

                            {/* Delta Chip */}
                            <div className="flex items-center justify-end gap-1.5 mt-1">
                              {delta > 0 ? (
                                <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400 font-mono">
                                  <TrendingUp className="h-3 w-3" />
                                  +{fmt(delta)} (+{deltaPct}%)
                                </span>
                              ) : delta < 0 ? (
                                <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-400 font-mono">
                                  <TrendingDown className="h-3 w-3" />
                                  {fmt(delta)} ({deltaPct}%)
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground font-mono">At AI Equilibrium</span>
                              )}
                              <span className="text-xs font-mono text-muted-foreground">
                                (Margin: {p.margin}%)
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 w-full justify-end pt-1">
                            {/* Rollback Button */}
                            {canRollback && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRollback(p.id)}
                                disabled={rollingBackId === p.id}
                                className="h-8 gap-1.5 border-border text-xs text-muted-foreground hover:text-foreground"
                                title={`Restore previous price: ${fmt(p.previousPrice ?? 0)}`}
                              >
                                <Undo2 className={`h-3 w-3 ${rollingBackId === p.id ? "animate-spin" : ""}`} />
                                Rollback ({fmt(p.previousPrice ?? 0)})
                              </Button>
                            )}

                            {/* Apply Button */}
                            <Button
                              variant={isPriceDifferent ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleApply(p)}
                              disabled={applyingId === p.id || !isPriceDifferent}
                              className={`h-8 gap-1.5 text-xs font-semibold ${
                                isPriceDifferent
                                  ? "bg-gradient-primary shadow-elevated"
                                  : "border-border text-muted-foreground"
                              }`}
                            >
                              {applyingId === p.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : isPriceDifferent ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3 opacity-40" />
                              )}
                              {isPriceDifferent ? "Apply AI Price" : "Applied"}
                            </Button>

                            <Link to="/what-if">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" title="Simulate in What-If Sandbox">
                                <Sliders className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function roundTwo(n: number) {
  return Math.round(n * 100) / 100;
}

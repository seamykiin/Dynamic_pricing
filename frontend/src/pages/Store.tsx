import { useState, useEffect } from "react";
import { 
  ShoppingCart, Search, MapPin, Zap, TrendingUp, AlertCircle, 
  CheckCircle2, Star, Sparkles, RefreshCw, ArrowRight, ShieldCheck, 
  Layers, FileText, ChevronDown, ChevronUp, Check, Building2
} from "lucide-react";
import { Link } from "react-router-dom";
import { 
  fetchStoreProducts, placeStoreOrder, triggerSurgeSimulation, 
  requestRFQ, type StoreProduct, type VolumeTier, type RFQPayload 
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";

const fmt = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });

export default function Store() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cartCount, setCartCount] = useState(2);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [simulatingSurge, setSimulatingSurge] = useState(false);
  const [recentlyChangedId, setRecentlyChangedId] = useState<string | null>(null);

  // Per-SKU quantity selection state
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({});
  const [expandedTierId, setExpandedTierId] = useState<string | null>(null);

  // RFQ Modal state
  const [rfqProduct, setRfqProduct] = useState<StoreProduct | null>(null);
  const [rfqQuantity, setRfqQuantity] = useState<number>(250);
  const [rfqTargetPrice, setRfqTargetPrice] = useState<string>("");
  const [rfqCompanyName, setRfqCompanyName] = useState<string>("Reliance Energy EPC");
  const [rfqSubmitting, setRfqSubmitting] = useState(false);
  const [rfqResult, setRfqResult] = useState<RFQPayload | null>(null);

  const loadProducts = async () => {
    try {
      const data = await fetchStoreProducts();
      setProducts(data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    const interval = setInterval(loadProducts, 20000); // 20s refresh
    return () => clearInterval(interval);
  }, []);

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getProductQty = (id: string) => selectedQty[id] ?? 1;

  const setProductQty = (id: string, qty: number) => {
    setSelectedQty((prev) => ({ ...prev, [id]: qty }));
  };

  const getActiveTier = (p: StoreProduct, qty: number): VolumeTier | null => {
    if (!p.volumeTiers || p.volumeTiers.length === 0) return null;
    for (let i = p.volumeTiers.length - 1; i >= 0; i--) {
      if (qty >= p.volumeTiers[i].minQty) {
        return p.volumeTiers[i];
      }
    }
    return p.volumeTiers[0];
  };

  const handleBuyNow = async (p: StoreProduct) => {
    const qty = getProductQty(p.id);
    setBuyingId(p.id);
    try {
      const res = await placeStoreOrder(p.id, qty, "Verified Amazon B2B Buyer");
      setCartCount((c) => c + qty);
      setRecentlyChangedId(p.id);

      toast.success(`Purchased ${qty} units of ${p.name}!`, {
        description: `${res.tierLabel}: ${fmt(res.unitPrice)}/unit · Total: ${fmt(res.totalPrice)} (Saved ${fmt(res.totalSavings)}).`,
      });

      // Optimistically update product in local state
      setProducts((prev) =>
        prev.map((item) =>
          item.id === p.id
            ? { ...item, stock: res.newStock, price: res.newPrice }
            : item
        )
      );

      setTimeout(() => setRecentlyChangedId(null), 3000);
    } catch (err: any) {
      toast.error(err.message || "Failed to complete purchase");
    } finally {
      setBuyingId(null);
    }
  };

  const handleSimulateSurge = async () => {
    setSimulatingSurge(true);
    try {
      const res = await triggerSurgeSimulation(undefined, 1.9, 12);
      toast.info("⚡ Flash Crowd Surge Injected!", {
        description: `Simulated high buyer velocity. Demand multiplier 1.9x triggered dynamic price surge across ${res.updatedProducts.length} items.`,
      });
      await loadProducts();
    } catch (err) {
      toast.error("Failed to simulate demand surge");
    } finally {
      setSimulatingSurge(false);
    }
  };

  const handleOpenRFQ = (p: StoreProduct) => {
    setRfqProduct(p);
    setRfqQuantity(250);
    setRfqTargetPrice(round2(p.price * 0.85).toString());
    setRfqResult(null);
  };

  const handleRFQSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqProduct) return;
    setRfqSubmitting(true);
    try {
      const targetP = rfqTargetPrice ? parseFloat(rfqTargetPrice) : undefined;
      const res = await requestRFQ({
        productId: rfqProduct.id,
        quantity: rfqQuantity,
        targetPrice: targetP,
        companyName: rfqCompanyName,
        deliveryDays: 14
      });
      setRfqResult(res);
      toast.success(`Quote Approved: ${res.rfqId}`, {
        description: `Wholesale rate ${fmt(res.quotedUnitPrice)}/unit granted for ${res.requestedQuantity} units.`,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate quote");
    } finally {
      setRfqSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-800">
      {/* --- Amazon-Style Dark Header --- */}
      <header className="sticky top-0 z-40 bg-[#131921] text-white shadow-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-2.5">
          {/* Logo & Delivery */}
          <div className="flex items-center gap-6">
            <Link to="/store" className="flex items-center gap-1.5 transition-opacity hover:opacity-90">
              <span className="text-xl font-bold tracking-tight text-white">
                amazon<span className="text-[#febd69]">b2b</span>
              </span>
              <span className="rounded bg-[#febd69] px-1.5 py-0.5 text-[10px] font-black text-slate-900">
                VOLUME PRICING
              </span>
            </Link>

            <div className="hidden items-center gap-1.5 text-xs text-gray-300 md:flex">
              <MapPin className="h-4 w-4 text-[#febd69]" />
              <div className="leading-tight">
                <p className="text-[11px] text-gray-400">Deliver to Enterprise</p>
                <p className="font-bold text-white">Mumbai 400001</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex max-w-2xl flex-1 items-center">
            <div className="relative w-full">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search valves, bearings, pumps, cables with bulk tier discounts..."
                className="h-10 w-full rounded-l-md rounded-r-none border-0 bg-white pl-4 pr-10 text-sm text-slate-900 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#febd69]"
              />
              <button
                type="button"
                className="absolute right-0 top-0 flex h-10 w-12 items-center justify-center rounded-r-md bg-[#febd69] text-slate-900 transition-colors hover:bg-[#f3a847]"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Dashboard Link & Cart */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="rounded-md border border-gray-600 bg-[#232f3e] px-3 py-1.5 text-xs font-semibold text-gray-200 transition hover:bg-[#37475a] hover:text-white"
            >
              ← Ops Dashboard
            </Link>

            <div className="flex items-center gap-1 text-sm font-bold text-white">
              <div className="relative">
                <ShoppingCart className="h-7 w-7 text-white" />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#febd69] text-xs font-black text-slate-900">
                  {cartCount}
                </span>
              </div>
              <span className="hidden sm:inline">Cart</span>
            </div>
          </div>
        </div>

        {/* Sub-nav Categories */}
        <div className="border-t border-[#232f3e] bg-[#232f3e] px-4 py-1.5 text-xs text-gray-200">
          <div className="mx-auto flex max-w-[1440px] items-center gap-4 overflow-x-auto whitespace-nowrap scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded px-2.5 py-1 font-medium transition ${
                  selectedCategory === cat
                    ? "bg-[#febd69] text-slate-900 font-bold"
                    : "hover:bg-[#37475a] text-gray-200"
                }`}
              >
                {cat === "All" ? "All Departments" : cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* --- Live Demand & B2B Volume Pricing Control Banner --- */}
      <div className="border-b border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 py-3 px-4 shadow-inner">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700">
              <Layers className="h-5 w-5 text-amber-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">B2B Volume Tier Engine Active</h2>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800">
                  Bulk Margin Protection Guaranteed
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Automatic quantity tier discounts (up to 15% off) with margin-floor guardrails and instant wholesale RFQ quotes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              size="sm"
              variant="default"
              disabled={simulatingSurge}
              onClick={handleSimulateSurge}
              className="h-8 gap-1.5 bg-[#d97706] hover:bg-[#b45309] text-white font-semibold text-xs shadow-xs"
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              {simulatingSurge ? "Simulating Traffic Surge…" : "Simulate Flash Demand Spike (+12 Orders)"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={loadProducts}
              className="h-8 gap-1 border-slate-300 bg-white text-xs hover:bg-slate-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh Tiers
            </Button>
          </div>
        </div>
      </div>

      {/* --- Main Storefront Products Grid --- */}
      <main className="mx-auto max-w-[1440px] px-4 py-6">
        <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{filteredProducts.length}</strong> items in{" "}
            <strong>{selectedCategory}</strong>
          </span>
          <span className="flex items-center gap-1 text-slate-600">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Enterprise Contract Pricing & ISO Compliance
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-96 animate-pulse rounded-lg bg-white p-4 shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((p) => {
              const isUpdated = recentlyChangedId === p.id;
              const hasDiscount = p.discountPct > 0;
              const qty = getProductQty(p.id);
              const activeTier = getActiveTier(p, qty);
              const unitPrice = activeTier ? activeTier.unitPrice : p.price;
              const totalAmount = unitPrice * qty;
              const standardTotal = p.price * qty;
              const savings = Math.max(0, standardTotal - totalAmount);
              const isTierExpanded = expandedTierId === p.id;

              return (
                <div
                  key={p.id}
                  className={`group relative flex flex-col justify-between rounded-lg border bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md ${
                    isUpdated
                      ? "ring-2 ring-amber-400 bg-amber-50/20"
                      : "border-slate-200"
                  }`}
                >
                  <div>
                    {/* Badge */}
                    <div className="mb-2 flex items-center justify-between h-6">
                      {p.badge ? (
                        <span className="inline-block rounded bg-[#232f3e] px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
                          {p.badge}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">{p.id}</span>
                      )}
                      {p.stock <= 50 && (
                        <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          Low Stock: {p.stock} left
                        </span>
                      )}
                    </div>

                    {/* Image */}
                    <div className="relative mb-3 flex h-48 w-full items-center justify-center overflow-hidden rounded bg-slate-50 p-2">
                      <img
                        src={p.imageUrl || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80"}
                        alt={p.name}
                        className="h-full w-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Category & Title */}
                    <p className="text-[11px] uppercase font-semibold tracking-wider text-slate-400">
                      {p.category}
                    </p>
                    <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-[#b45309] leading-snug mt-0.5">
                      {p.name}
                    </h3>

                    {/* Rating */}
                    <div className="mt-1.5 flex items-center gap-1 text-xs">
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < Math.floor(p.rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-slate-700">{p.rating}</span>
                      <span className="text-slate-400">({p.reviewsCount})</span>
                    </div>

                    {/* Pricing Tag Pill */}
                    <div className="mt-2.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          p.priceTag.includes("Surge") || p.priceTag.includes("Demand")
                            ? "bg-amber-100 text-amber-800"
                            : p.priceTag.includes("Deal")
                            ? "bg-rose-100 text-rose-800"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        <Sparkles className="h-3 w-3" />
                        {p.priceTag}
                      </span>
                    </div>

                    {/* Active Dynamic & Tier Price Section */}
                    <div className="mt-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 tracking-tight">
                          {fmt(unitPrice)}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">/ unit</span>
                        {activeTier && activeTier.discountPct > 0 && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            -{activeTier.discountPct}% Volume Discount
                          </span>
                        )}
                      </div>

                      {p.referenceMrp > unitPrice && (
                        <p className="text-xs text-slate-400">
                          List M.R.P.: <span className="line-through">{fmt(p.referenceMrp)}</span>{" "}
                          <span className="text-slate-500 font-medium">
                            (Comp: {fmt(p.competitorPrice)})
                          </span>
                        </p>
                      )}
                    </div>

                    {/* B2B Quantity Selector */}
                    <div className="mt-3.5 rounded-md border border-slate-200 bg-slate-50 p-2.5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-700">Order Quantity:</span>
                        <select
                          value={qty}
                          onChange={(e) => setProductQty(p.id, Number(e.target.value))}
                          className="h-7 rounded border border-slate-300 bg-white px-2 text-xs font-bold text-slate-900 focus:outline-none"
                        >
                          <option value={1}>1 unit (Standard)</option>
                          <option value={5}>5 units (Sample)</option>
                          <option value={10}>10 units (Bulk 5%)</option>
                          <option value={25}>25 units (Bulk 5%)</option>
                          <option value={50}>50 units (Commercial 10%)</option>
                          <option value={100}>100 units (Commercial 10%)</option>
                          <option value={200}>200 units (Wholesale 15%)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/80">
                        <span className="text-slate-500">Order Subtotal:</span>
                        <span className="font-bold text-slate-900 font-mono text-sm">{fmt(totalAmount)}</span>
                      </div>
                      {savings > 0 && (
                        <p className="text-[11px] font-semibold text-emerald-700 mt-0.5 text-right">
                          ✓ You save {fmt(savings)} with Volume Pricing
                        </p>
                      )}
                    </div>

                    {/* Toggle Volume Tier Schedule */}
                    <div className="mt-2.5">
                      <button
                        type="button"
                        onClick={() => setExpandedTierId(isTierExpanded ? null : p.id)}
                        className="flex items-center justify-between w-full text-[11px] font-semibold text-[#b45309] hover:underline"
                      >
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3" /> View Bulk Quantity Tiers
                        </span>
                        {isTierExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>

                      {isTierExpanded && p.volumeTiers && (
                        <div className="mt-2 space-y-1 rounded bg-slate-50 p-2 text-[11px] border border-slate-200">
                          <div className="grid grid-cols-3 font-semibold text-slate-400 border-b border-slate-200 pb-1">
                            <span>Quantity</span>
                            <span className="text-center">Discount</span>
                            <span className="text-right">Unit Price</span>
                          </div>
                          {p.volumeTiers.map((t) => {
                            const isCurrent = activeTier?.minQty === t.minQty;
                            return (
                              <div
                                key={t.minQty}
                                className={`grid grid-cols-3 py-0.5 ${
                                  isCurrent ? "font-bold text-emerald-800 bg-emerald-100/50 rounded px-1" : "text-slate-600"
                                }`}
                              >
                                <span>{t.maxQty ? `${t.minQty}–${t.maxQty} u` : `${t.minQty}+ u`}</span>
                                <span className="text-center">{t.discountPct > 0 ? `-${t.discountPct}%` : "—"}</span>
                                <span className="text-right font-mono">{fmt(t.unitPrice)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Delivery & Prime info */}
                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <p className="flex items-center gap-1 font-medium text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> In Stock ({p.stock} units available)
                      </p>
                      <p className="text-slate-500">
                        Fast delivery <strong className="text-slate-800">Tomorrow by 11 AM</strong>
                      </p>
                    </div>
                  </div>

                  {/* Buy / Actions */}
                  <div className="mt-4 space-y-2 pt-3 border-t border-slate-100">
                    <Button
                      onClick={() => handleBuyNow(p)}
                      disabled={buyingId === p.id || p.stock <= 0}
                      className="w-full h-9 bg-[#ffd814] hover:bg-[#f7ca00] text-slate-900 font-bold text-xs shadow-xs"
                    >
                      {buyingId === p.id
                        ? "Processing Order…"
                        : `Buy ${qty} ${qty === 1 ? "Unit" : "Units"} (Live Checkout)`}
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCartCount((c) => c + qty);
                          toast.success(`Added ${qty} units of ${p.name} to business cart.`);
                        }}
                        className="flex-1 h-8 text-[11px] border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        Add to Cart
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenRFQ(p)}
                        className="flex-1 h-8 text-[11px] gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium"
                      >
                        <FileText className="h-3 w-3 text-slate-600" />
                        Custom RFQ
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* --- Enterprise Wholesale RFQ Quotation Modal --- */}
      <Dialog open={!!rfqProduct} onOpenChange={(open) => !open && setRfqProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <DialogTitle>Instant Enterprise RFQ Quotation</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Automated wholesale pricing algorithm for bulk procurement bids.
            </DialogDescription>
          </DialogHeader>

          {!rfqResult ? (
            <form onSubmit={handleRFQSubmit} className="space-y-4 py-2">
              <div className="rounded-lg bg-surface p-3 text-xs border border-border">
                <p className="font-semibold text-foreground">{rfqProduct?.name}</p>
                <p className="text-muted-foreground mt-0.5">
                  SKU: <span className="font-mono">{rfqProduct?.id}</span> · Standard Price: {fmt(rfqProduct?.price ?? 0)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Enterprise Company Name</label>
                  <Input
                    required
                    value={rfqCompanyName}
                    onChange={(e) => setRfqCompanyName(e.target.value)}
                    className="text-xs"
                    placeholder="Company Ltd"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Requested Quantity (Units)</label>
                  <Input
                    required
                    type="number"
                    min={50}
                    value={rfqQuantity}
                    onChange={(e) => setRfqQuantity(Number(e.target.value))}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Target Unit Price (Optional Bid ₹)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={rfqTargetPrice}
                  onChange={(e) => setRfqTargetPrice(e.target.value)}
                  placeholder={`Suggest a bid price (e.g. ₹${round2((rfqProduct?.price ?? 100) * 0.85)})`}
                  className="text-xs font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  AI will evaluate against cost and inventory holding economics to return an instant approved rate.
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" size="sm" type="button" onClick={() => setRfqProduct(null)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" disabled={rfqSubmitting}>
                  {rfqSubmitting ? "Evaluating Bid…" : "Generate Instant AI Quote"}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-4 text-emerald-950">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-600 text-white font-mono text-xs">
                    {rfqResult.status}
                  </Badge>
                  <span className="font-mono text-xs text-emerald-800 font-bold">
                    {rfqResult.rfqId}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] text-emerald-800">Approved Unit Rate</p>
                    <p className="text-xl font-bold font-mono">{fmt(rfqResult.quotedUnitPrice)}</p>
                    <p className="text-[10px] text-emerald-700">
                      Standard: <span className="line-through">{fmt(rfqResult.standardUnitPrice)}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-emerald-800">Total Contract Quote</p>
                    <p className="text-xl font-bold font-mono">{fmt(rfqResult.totalQuote)}</p>
                    <p className="text-[10px] font-semibold text-emerald-700">
                      Total Savings: {fmt(rfqResult.totalSavings)} (-{rfqResult.savingsPct}%)
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-emerald-800 border-t border-emerald-200/80 pt-2">
                  <strong>AI Engine Rationale:</strong> {rfqResult.aiRationale}
                </p>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <p>• Quote locked and valid for <strong>{rfqResult.validForDays} days</strong>.</p>
                <p>• Delivery timeline: <strong>{rfqResult.deliveryDays} business days</strong> directly to company warehouse.</p>
              </div>

              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setRfqResult(null)}>
                  New Bid
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  onClick={() => {
                    toast.success(`Contract ${rfqResult.rfqId} accepted for ${rfqResult.companyName}!`);
                    setRfqProduct(null);
                  }}
                >
                  Accept & Issue Purchase Order (PO)
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

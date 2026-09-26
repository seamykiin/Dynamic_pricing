import { useState } from "react";
import { 
  ArrowUp, ArrowDown, Minus, Sparkles, Filter, Download, 
  Check, Edit3, Search, CheckCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  applyAiPrice, applyAllAiPrices, updateManualPrice, 
  type Product 
} from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Props { 
  products: Product[]; 
  loading: boolean; 
  onProductsUpdate?: (products: Product[]) => void;
}

const fmt = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });

export function PricingTable({ products, loading, onProductsUpdate }: Props) {
  const [applying, setApplying] = useState<string | null>(null);
  const [applyingAll, setApplyingAll] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Manual price edit dialog
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [manualPriceInput, setManualPriceInput] = useState<string>("");

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  async function handleApply(p: Product) {
    setApplying(p.id);
    try {
      await applyAiPrice(p.id, p.aiSuggestedPrice);
      setAppliedIds((s) => new Set(s).add(p.id));
      
      // Optimistic update in parent state if handler provided
      if (onProductsUpdate) {
        onProductsUpdate(
          products.map((item) =>
            item.id === p.id
              ? {
                  ...item,
                  currentPrice: p.aiSuggestedPrice,
                  margin: item.costPrice 
                    ? roundNum(((p.aiSuggestedPrice - item.costPrice) / p.aiSuggestedPrice) * 100)
                    : item.margin,
                }
              : item
          )
        );
      }

      toast.success(`Applied AI price for ${p.id}`, {
        description: `${fmt(p.currentPrice)} → ${fmt(p.aiSuggestedPrice)}`,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to apply AI price");
    } finally {
      setApplying(null);
    }
  }

  async function handleApplyAll() {
    setApplyingAll(true);
    try {
      await applyAllAiPrices();
      const allIds = new Set(products.map((p) => p.id));
      setAppliedIds(allIds);

      if (onProductsUpdate) {
        onProductsUpdate(
          products.map((p) => ({
            ...p,
            currentPrice: p.aiSuggestedPrice,
          }))
        );
      }

      toast.success("Applied AI Prices across all SKUs!", {
        description: `All active items updated to profit-maximizing recommendations.`,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to bulk apply prices");
    } finally {
      setApplyingAll(false);
    }
  }

  async function handleManualSubmit() {
    if (!editingProduct) return;
    const newP = parseFloat(manualPriceInput);
    if (isNaN(newP) || newP <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    try {
      await updateManualPrice(editingProduct.id, newP);
      if (onProductsUpdate) {
        onProductsUpdate(
          products.map((item) =>
            item.id === editingProduct.id
              ? { ...item, currentPrice: newP }
              : item
          )
        );
      }
      toast.success(`Manual price updated for ${editingProduct.id} to ${fmt(newP)}`);
      setEditingProduct(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to set price");
    }
  }

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Product ID,Name,Category,Stock,Cost Price,Current Price,Competitor Price,AI Suggested Price,Margin\n" +
      products
        .map(
          (p) =>
            `${p.id},"${p.name}",${p.category},${p.stock},${p.costPrice ?? "N/A"},${p.currentPrice},${p.competitorPrice},${p.aiSuggestedPrice},${p.margin}%`
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pricing_catalog_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export successful", { description: "Downloaded pricing_catalog_export.csv" });
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      {/* Table Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Live Inventory & Pricing Engine
            </h2>
            <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
              PPO RL Active
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time algorithmic pricing recommendations with margin floor guardrails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search SKU or name…"
              className="h-8 w-44 pl-8 text-xs border-border bg-surface"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground focus:outline-none"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Bulk Apply All */}
          <Button
            size="sm"
            variant="default"
            disabled={applyingAll}
            onClick={handleApplyAll}
            className="h-8 gap-1.5 text-xs shadow-xs"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {applyingAll ? "Applying All…" : "Apply All Recommendations"}
          </Button>

          {/* Export */}
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/60 text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 text-left font-medium">Product SKU</th>
              <th className="px-4 py-3 text-right font-medium">Stock</th>
              <th className="px-4 py-3 text-right font-medium">Current Price</th>
              <th className="px-4 py-3 text-right font-medium">Competitor</th>
              <th className="bg-accent/40 px-4 py-3 text-right font-semibold text-primary">
                <div className="flex items-center justify-end gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Recommendation
                </div>
              </th>
              <th className="px-4 py-3 text-right font-medium">Margin</th>
              <th className="px-5 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-4">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-xs text-muted-foreground">
                  No products matched your search filter.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const delta = p.aiSuggestedPrice - p.currentPrice;
                const deltaPct = p.currentPrice > 0 ? (delta / p.currentPrice) * 100 : 0;
                const positive = delta >= 0;
                const applied = appliedIds.has(p.id) || p.currentPrice === p.aiSuggestedPrice;

                return (
                  <tr
                    key={p.id}
                    className="group border-b border-border transition-colors last:border-0 hover:bg-surface/50"
                  >
                    {/* Name & ID */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground">{p.name}</span>
                          {p.badge && (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0">
                              {p.badge}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="font-mono text-[11px] text-muted-foreground">{p.id}</span>
                          <Badge
                            variant="secondary"
                            className="h-4 rounded px-1.5 text-[10px] font-medium"
                          >
                            {p.category}
                          </Badge>
                        </div>
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-4 text-right tabular-nums text-foreground">
                      <span className={p.stock < 50 ? "font-bold text-destructive" : p.stock < 100 ? "text-warning" : ""}>
                        {p.stock.toLocaleString()}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">u</span>
                    </td>

                    {/* Current Price (with click to edit) */}
                    <td className="px-4 py-4 text-right tabular-nums text-foreground font-medium">
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{fmt(p.currentPrice)}</span>
                        <button
                          title="Override price manually"
                          onClick={() => {
                            setEditingProduct(p);
                            setManualPriceInput(p.currentPrice.toString());
                          }}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Competitor Price */}
                    <td className="px-4 py-4 text-right tabular-nums text-muted-foreground">
                      {fmt(p.competitorPrice)}
                    </td>

                    {/* AI Suggested Price */}
                    <td className="bg-accent/30 px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-semibold tabular-nums text-foreground">
                          {fmt(p.aiSuggestedPrice)}
                        </span>
                        <span
                          className={
                            "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums " +
                            (positive
                              ? "bg-success-soft text-success"
                              : "bg-destructive/10 text-destructive")
                          }
                        >
                          {positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          {Math.abs(deltaPct).toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* Margin */}
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5 tabular-nums">
                        {p.trend === "up" && <ArrowUp className="h-3.5 w-3.5 text-success" />}
                        {p.trend === "down" && <ArrowDown className="h-3.5 w-3.5 text-destructive" />}
                        {p.trend === "flat" && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                        <span className="text-foreground font-semibold">{p.margin.toFixed(1)}%</span>
                      </div>
                    </td>

                    {/* Action Button */}
                    <td className="px-5 py-4 text-right">
                      <Button
                        size="sm"
                        variant={applied ? "secondary" : "default"}
                        disabled={applying === p.id || applied}
                        onClick={() => handleApply(p)}
                        className="h-8 text-xs font-semibold"
                      >
                        {applied
                          ? "Applied ✓"
                          : applying === p.id
                          ? "Applying…"
                          : "Apply AI Price"}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Price Override Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Price Override</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              Override AI pricing for <strong className="text-foreground">{editingProduct?.name}</strong> ({editingProduct?.id}).
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">New Price (₹)</label>
              <Input
                type="number"
                step="0.1"
                value={manualPriceInput}
                onChange={(e) => setManualPriceInput(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            {editingProduct?.costPrice && (
              <p className="text-[11px] text-muted-foreground">
                Base Cost: {fmt(editingProduct.costPrice)} · Competitor: {fmt(editingProduct.competitorPrice)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingProduct(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleManualSubmit}>
              Save Price
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function roundNum(n: number): number {
  return Math.round(n * 10) / 10;
}

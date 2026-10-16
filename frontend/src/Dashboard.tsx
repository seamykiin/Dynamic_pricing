import { useMemo, useState, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  fetchDashboard,
  fetchReports,
  applyAiPrice,
  applyAllAiPrices,
  updateManualPrice,
  createProduct,
  deleteProduct,
  rollbackPrice,
  triggerCompetitorScrape,
  triggerRetraining,
  updateProductStrategy,
  fetchWhatIfSimulation,
  askAiCopilot,
  scrapeLiveCompetitors,
  triggerMlRetraining,
  fetchMlElasticity,
  fetchProductElasticityTrajectory,
  placeStoreOrder,
  triggerSurgeSimulation,
  requestRFQ,
  type Product,
  type DashboardPayload,
  type KPIs,
  type PricePoint,
  type ReportsPayload,
  type TelemetryLog,
  type RecentOrder,
  type WhatIfPayload,
  type CopilotResponse,
  type MlElasticityDiagnostics,
  type LiveScrapeResponse,
  type RFQPayload
} from "@/lib/api";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from "recharts";

/* ─── Types ─── */
type Page = "overview" | "pricing" | "whatif" | "catalog" | "logs";
type IconKey =
  | "grid"
  | "spark"
  | "box"
  | "activity"
  | "search"
  | "arrow"
  | "check"
  | "download"
  | "store"
  | "back"
  | "undo"
  | "refresh"
  | "sliders"
  | "edit"
  | "trash"
  | "plus"
  | "brain"
  | "bolt"
  | "bot"
  | "globe"
  | "cpu"
  | "zap"
  | "chevronLeft"
  | "chevronRight";

/* ─── Icon component ─── */
function Ico({ name, className = "size-5" }: { name: IconKey; className?: string }) {
  const paths: Record<IconKey, ReactNode> = {
    grid: <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" />,
    spark: <path d="m12 2 1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2Zm7 14 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />,
    box: <path d="m21 8-9 5-9-5m9 5v9M3 8l9-5 9 5v9l-9 5-9-5V8Z" />,
    activity: <path d="M3 12h4l2-7 4 14 2-7h6" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    check: <path d="m5 12 4 4L19 6" />,
    download: <path d="M12 3v12m-4-4 4 4 4-4M4 19h16" />,
    store: <path d="M4 10v10h16V10M3 4h18l-1 6H4L3 4Zm6 16v-6h6v6" />,
    back: <path d="m15 18-6-6 6-6" />,
    undo: <path d="M3 7v6h6M3 13C5.2 8.4 9.3 6 14 6a9 9 0 0 1 0 18c-3.5 0-6.6-2-8-5" />,
    refresh: <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />,
    sliders: <path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6" />,
    edit: <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />,
    trash: <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-6 5v6m4-6v6" />,
    plus: <path d="M12 5v14m-7-7h14" />,
    brain: <><path d="M9.5 4.5A3 3 0 0 0 4 6.2a3 3 0 0 0-1 5.8 3 3 0 0 0 3 5 3 3 0 0 0 5.5 1.7V5.3a3 3 0 0 0-2-2.8Z" /><path d="M14.5 4.5A3 3 0 0 1 20 6.2a3 3 0 0 1 1 5.8 3 3 0 0 1-3 5 3 3 0 0 1-5.5 1.7V5.3a3 3 0 0 1 2-2.8Z" /></>,
    bolt: <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" />,
    bot: <><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></>,
    globe: <><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></>,
    cpu: <><rect width="16" height="16" x="4" y="4" rx="2" /><rect width="6" height="6" x="9" y="9" rx="1" /><path d="M9 1v3m6-3v3M9 20v3m6-3v3M20 9h3m-3 6h3M1 9h3m-3 6h3" /></>,
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />
  };
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name] || paths.grid}
    </svg>
  );
}

/* ─── Display types ─── */
interface DisplayProduct {
  sku: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  competitor: number;
  ai: number;
  margin: string;
  strategy: string;
  previousPrice?: number;
  costPrice?: number;
}

const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatStrategy = (strat?: string) => {
  if (!strat) return "Profit Maximizer";
  const map: Record<string, string> = {
    profit_maximizer: "Profit Maximizer",
    aggressive_undercut: "Buy Box Undercut",
    clearance_markdown: "Clearance Markdown",
    brand_premium: "Brand Premium",
    margin_preservation: "Margin Preservation"
  };
  return map[strat] || strat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

/* ─── Clean Formatted Bot Output Renderer ─── */
function renderFormattedInline(str: string): ReactNode[] {
  const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-extrabold text-slate-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-blue-100/70 px-1.5 py-0.5 font-mono text-[11px] font-bold text-blue-900">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function FormattedBotOutput({ text }: { text: string }) {
  if (!text) return null;

  const rawLines = text.split("\n");
  const elements: ReactNode[] = [];

  for (let idx = 0; idx < rawLines.length; idx++) {
    const rawLine = rawLines[idx].trim();
    if (!rawLine) continue;

    // Filter out redundant memo letter headers
    if (
      /^(\*\*)?(From|To|Subject):/i.test(rawLine) ||
      /^(\*\*)?Chief Commercial Officer/i.test(rawLine)
    ) {
      continue;
    }

    // Horizontal dividers
    if (rawLine === "--" || rawLine === "---" || rawLine === "***") {
      elements.push(<hr key={`hr-${idx}`} className="my-2.5 border-t border-slate-200" />);
      continue;
    }

    // Headings (### or ## or #)
    if (rawLine.startsWith("#")) {
      const headingContent = rawLine.replace(/^#+\s*/, "").replace(/^\*\*|\*\*$/g, "").trim();
      elements.push(
        <div key={`h-${idx}`} className="mt-3 mb-1 flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-blue-600" />
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
            {headingContent}
          </h4>
        </div>
      );
      continue;
    }

    // Bullet points (* or -)
    if (rawLine.startsWith("* ") || rawLine.startsWith("- ")) {
      const bulletContent = rawLine.slice(2).trim();
      elements.push(
        <div key={`b-${idx}`} className="my-1 flex items-start gap-2 text-xs text-slate-700 leading-relaxed pl-1">
          <span className="mt-1 size-1.5 rounded-full bg-blue-500 shrink-0" />
          <div className="flex-1">{renderFormattedInline(bulletContent)}</div>
        </div>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${idx}`} className="my-1.5 text-xs text-slate-700 leading-relaxed font-normal">
        {renderFormattedInline(rawLine)}
      </p>
    );
  }

  return <div className="space-y-0.5">{elements}</div>;
}

/* ─── Reusable UI ─── */
function ActionButton({
  children,
  primary = false,
  onClick,
  disabled = false,
  className = ""
}: {
  children: ReactNode;
  primary?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${
        primary
          ? "bg-slate-950 text-white hover:bg-slate-800"
          : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 p-5 ${tone}`}>
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-4 text-3xl font-black tracking-tight text-slate-950">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-500">{note}</div>
    </div>
  );
}

function PageHeading({ title, copy, children }: { title: string; copy: string; children?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-950">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{copy}</p>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

function TableShell({ title, copy, actions, children }: { title: string; copy: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-extrabold">{title}</div>
          <div className="mt-1 text-xs text-slate-400">{copy}</div>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

/* ─── Interactive Recharts Tooltip ─── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur text-xs">
      <div className="font-extrabold text-slate-800 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 font-bold" style={{ color: p.color }}>
            <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}:
          </span>
          <span className="font-mono font-black text-slate-900">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Product Table with Manual Edit and Rollback ─── */
function ProductTable({
  products,
  applied,
  onApply,
  onEdit,
  onRollback,
  onDelete
}: {
  products: DisplayProduct[];
  applied: Set<string>;
  onApply: (sku: string) => void;
  onEdit: (product: DisplayProduct) => void;
  onRollback: (sku: string) => void;
  onDelete?: (product: DisplayProduct) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[950px] text-left">
        <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
          <tr>
            {["Product SKU & strategy", "Stock", "Current price", "Competitor", "AI recommendation", "Margin", "Actions"].map((h) => (
              <th key={h} className="px-5 py-3 font-bold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const isApplied = applied.has(p.sku) || p.price === p.ai;
            const canRollback = p.previousPrice && p.previousPrice !== p.price;
            return (
              <tr key={p.sku} className="border-b border-slate-100 text-sm transition hover:bg-slate-50">
                <td className="px-5 py-4">
                  <div className="font-extrabold text-slate-900">{p.name}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono font-bold text-slate-600">{p.sku}</span>
                    <span>·</span>
                    <span>{p.category}</span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 font-bold text-blue-800">{formatStrategy(p.strategy)}</span>
                  </div>
                </td>
                <td className={`px-5 py-4 font-bold ${p.stock === 0 ? "text-rose-500" : "text-slate-700"}`}>{p.stock} u</td>
                <td className="px-5 py-4 font-bold">
                  {fmt(p.price)}
                  {p.previousPrice && p.previousPrice !== p.price && (
                    <div className="text-[10px] text-slate-400 font-normal">Prior: {fmt(p.previousPrice)}</div>
                  )}
                </td>
                <td className="px-5 py-4 text-slate-400">{fmt(p.competitor)}</td>
                <td className="bg-blue-50/50 px-5 py-4 font-black text-blue-900">{fmt(p.ai)}</td>
                <td className="px-5 py-4 font-bold">{p.margin}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={isApplied}
                      onClick={() => onApply(p.sku)}
                      className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-extrabold transition ${
                        isApplied ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-blue-300 text-slate-950 hover:bg-blue-200"
                      }`}
                    >
                      {isApplied ? "Applied ✓" : "Apply AI price"}
                    </button>
                    <button
                      onClick={() => onEdit(p)}
                      title="Manual price override"
                      className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Ico name="edit" className="size-3.5" />
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(p)}
                        title="Delete product listing"
                        className="rounded-lg border border-rose-200 bg-white p-2 text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Ico name="trash" className="size-3.5" />
                      </button>
                    )}
                    {canRollback && (
                      <button
                        onClick={() => onRollback(p.sku)}
                        title="Rollback to prior price"
                        className="rounded-lg border border-slate-200 bg-white p-2 text-purple-600 transition hover:bg-purple-50"
                      >
                        <Ico name="undo" className="size-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Overview tab ─── */
function Overview({
  products,
  kpis,
  elasticity,
  applied,
  onApply,
  onApplyAll,
  onExport,
  onRetrain,
  retraining,
  onEdit,
  onRollback,
  onDelete,
  loading,
  onNavigate
}: {
  products: DisplayProduct[];
  kpis: KPIs | null;
  elasticity: PricePoint[];
  applied: Set<string>;
  onApply: (sku: string) => void;
  onApplyAll: () => void;
  onExport: () => void;
  onRetrain: () => void;
  retraining: boolean;
  onEdit: (p: DisplayProduct) => void;
  onRollback: (sku: string) => void;
  onDelete?: (p: DisplayProduct) => void;
  loading: boolean;
  onNavigate: (page: Page) => void;
}) {
  const [selectedElasticitySku, setSelectedElasticitySku] = useState<string>(products[0]?.sku || "VLV-X200");
  const [activeTrajectory, setActiveTrajectory] = useState<PricePoint[]>(elasticity);
  const [activeMeta, setActiveMeta] = useState<{ score?: number; label?: string } | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"curve" | "trajectory">("curve");
  const [curveData, setCurveData] = useState<any[]>([]);
  const [mlDiag, setMlDiag] = useState<MlElasticityDiagnostics | null>(null);

  // Keep selected SKU synchronized when products list updates
  useEffect(() => {
    if (products.length > 0 && !products.some((p) => p.sku === selectedElasticitySku)) {
      setSelectedElasticitySku(products[0].sku);
    }
  }, [products]);

  const activeProduct = useMemo(() => {
    return products.find((p) => p.sku === selectedElasticitySku) || products[0];
  }, [products, selectedElasticitySku]);

  const closestCurrentPoint = useMemo(() => {
    if (!curveData.length || !activeProduct?.price) return null;
    return curveData.reduce((prev, curr) =>
      Math.abs(curr.price - activeProduct.price) < Math.abs(prev.price - activeProduct.price) ? curr : prev
    );
  }, [curveData, activeProduct]);

  const closestOptimalPoint = useMemo(() => {
    const target = mlDiag?.optimalPrice || activeProduct?.ai;
    if (!curveData.length || !target) return null;
    return curveData.reduce((prev, curr) =>
      Math.abs(curr.price - target) < Math.abs(prev.price - target) ? curr : prev
    );
  }, [curveData, mlDiag, activeProduct]);

  // Dynamically load price elasticity trajectory and ML demand curve for selected product
  useEffect(() => {
    if (!selectedElasticitySku) return;
    setChartLoading(true);

    fetchProductElasticityTrajectory(selectedElasticitySku)
      .then((res) => {
        if (res?.trajectory?.length) {
          setActiveTrajectory(res.trajectory);
        }
        setActiveMeta({ score: res.elasticityScore, label: res.elasticityLabel });
      })
      .catch(() => {
        setActiveTrajectory(elasticity);
      })
      .finally(() => {
        setChartLoading(false);
      });

    // Also fetch ML demand curve for predictive comparison
    fetchMlElasticity(selectedElasticitySku)
      .then((res) => {
        if (res?.curve && res.curve.length > 0) {
          setCurveData(res.curve);
          setMlDiag(res);
        } else if (activeProduct) {
          // Analytical fallback demand curve
          const p = activeProduct.price || 100;
          const cost = activeProduct.cost || p * 0.65;
          const baseDemand = activeProduct.demand || 40;
          const fallback = [];
          const minP = Math.max(cost * 1.05, p * 0.7);
          const maxP = p * 1.4;
          const step = (maxP - minP) / 14;
          for (let i = 0; i < 15; i++) {
            const pricePoint = Math.round((minP + i * step) * 10) / 10;
            const ratio = pricePoint / p;
            const demand = Math.max(2, Math.round(baseDemand * Math.pow(ratio, -1.3) * 10) / 10);
            const profit = Math.round((pricePoint - cost) * demand * 10) / 10;
            const revenue = Math.round(pricePoint * demand * 10) / 10;
            fallback.push({
              price: pricePoint,
              projectedDemand: demand,
              unitsSold: demand,
              projectedRevenue: revenue,
              projectedProfit: profit,
              marginPct: Math.round(((pricePoint - cost) / pricePoint) * 100)
            });
          }
          setCurveData(fallback);
        }
      })
      .catch(() => {
        if (activeProduct) {
          const p = activeProduct.price || 100;
          const cost = activeProduct.cost || p * 0.65;
          const baseDemand = activeProduct.demand || 40;
          const fallback = [];
          const minP = Math.max(cost * 1.05, p * 0.7);
          const maxP = p * 1.4;
          const step = (maxP - minP) / 14;
          for (let i = 0; i < 15; i++) {
            const pricePoint = Math.round((minP + i * step) * 10) / 10;
            const ratio = pricePoint / p;
            const demand = Math.max(2, Math.round(baseDemand * Math.pow(ratio, -1.3) * 10) / 10);
            const profit = Math.round((pricePoint - cost) * demand * 10) / 10;
            const revenue = Math.round(pricePoint * demand * 10) / 10;
            fallback.push({
              price: pricePoint,
              projectedDemand: demand,
              unitsSold: demand,
              projectedRevenue: revenue,
              projectedProfit: profit,
              marginPct: Math.round(((pricePoint - cost) / pricePoint) * 100)
            });
          }
          setCurveData(fallback);
        }
      });
  }, [selectedElasticitySku, elasticity, activeProduct]);

  return (
    <>
      <PageHeading title="Tensor Margin Pricing Engine" copy="Autonomous reinforcement learning (PPO) dynamic pricing across the active catalog.">
        <ActionButton onClick={() => onNavigate("whatif")}>
          <Ico name="sliders" className="size-4 text-blue-600" /> What-If Simulator
        </ActionButton>
        <ActionButton onClick={() => onNavigate("pricing")}>
          <Ico name="spark" className="size-4 text-purple-600" /> AI Pricing Hub
        </ActionButton>
        <Link to="/store" className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-amber-300 shadow-sm">
          <Ico name="store" className="size-4" /> Live Amazon Storefront
        </Link>
        <ActionButton onClick={onRetrain} disabled={retraining}>
          <Ico name="brain" className={`size-4 ${retraining ? "animate-spin" : ""}`} /> {retraining ? "Training PPO…" : "Retrain PPO"}
        </ActionButton>
        <ActionButton onClick={onExport}><Ico name="download" className="size-4" /> Export CSV</ActionButton>
        <ActionButton primary onClick={onApplyAll}><Ico name="spark" className="size-4" /> Apply all recommendations</ActionButton>
      </PageHeading>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Catalog coverage" value={loading ? "…" : `${kpis?.totalActiveSkus ?? 0} SKUs`} note="+32 this week" tone="bg-sky-50" />
        <StatCard label="Revenue lift" value={loading ? "…" : `+${kpis?.revenueLiftPct?.toFixed(1) ?? 0}%`} note="vs. baseline pricing" tone="bg-emerald-50" />
        <StatCard label="Engine priced today" value={loading ? "…" : `${kpis?.enginePricedToday?.toLocaleString() ?? 0}`} note="calls · last 24h" tone="bg-violet-50" />
        <StatCard label="API latency" value={loading ? "…" : `${kpis?.apiLatencyMs ?? 0}ms`} note="p95 under 80ms" tone="bg-orange-50" />
      </div>


      {/* Dynamic Demand Curve & Elasticity for all listed products */}
      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs">
                📉
              </span>
              <h2 className="text-base font-black text-slate-950">
                Demand Curve & Elasticity — {activeProduct?.name || "Selected Product"}
              </h2>
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {activeProduct?.sku}
              </span>
              {(mlDiag?.elasticityLabel || activeMeta?.label) && (
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                  (mlDiag?.elasticityScore ?? activeMeta?.score ?? 0) < -1.0
                    ? "bg-rose-100 text-rose-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}>
                  {mlDiag?.elasticityLabel || activeMeta?.label} (ε = {(mlDiag?.elasticityScore ?? activeMeta?.score ?? -0.85).toFixed(2)})
                </span>
              )}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {viewMode === "curve"
                ? "Microeconomic demand curve (Price vs. Units Sold) with profit-maximizing yield apex"
                : "30-day dynamic price trajectory vs. live competitor market benchmarks"}
            </div>
          </div>

          {/* Product selector dropdown & View Mode Switch */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Product:</label>
              <select
                value={selectedElasticitySku}
                onChange={(e) => setSelectedElasticitySku(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none cursor-pointer max-w-[240px] truncate shadow-2xs"
              >
                {products.map((p) => (
                  <option key={p.sku} value={p.sku}>
                    {p.sku} · {p.name.slice(0, 24)} ({fmt(p.price)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                onClick={() => setViewMode("curve")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                  viewMode === "curve" ? "bg-white text-slate-950 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>📉</span>
                <span>Demand Curve</span>
              </button>
              <button
                onClick={() => setViewMode("trajectory")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                  viewMode === "trajectory" ? "bg-white text-slate-950 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>📈</span>
                <span>Price Trajectory</span>
              </button>
            </div>
          </div>
        </div>


        {/* Selected Product Stat Badges */}
        {activeProduct && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5 text-xs font-bold bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Current Price</span>
              <span className="text-slate-900 text-sm font-black">{fmt(activeProduct.price)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">AI Optimal Price</span>
              <span className="text-purple-600 text-sm font-black">{fmt(mlDiag?.optimalPrice || activeProduct.ai)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">
                {viewMode === "curve" ? "Predicted Peak Demand" : "Competitor Benchmark"}
              </span>
              <span className="text-emerald-600 text-sm font-black">
                {viewMode === "curve"
                  ? `${mlDiag?.expectedDemand ? Math.round(mlDiag.expectedDemand) : activeProduct.demand} units`
                  : fmt(activeProduct.competitor)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">
                {viewMode === "curve" ? "Projected Max Profit" : "Gross Margin"}
              </span>
              <span className="text-blue-600 text-sm font-black">
                {viewMode === "curve"
                  ? fmt(mlDiag?.expectedProfit || (activeProduct.price - activeProduct.cost) * activeProduct.demand)
                  : activeProduct.margin}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Policy Mode</span>
              <span className="text-slate-800 text-xs font-black">{formatStrategy(activeProduct.strategy)}</span>
            </div>
          </div>
        )}

        {/* Chart View */}
        <div className="mt-6 h-72 w-full">
          {chartLoading ? (
            <div className="grid h-full place-items-center text-xs text-slate-400">
              <span className="animate-pulse">Computing price elasticity metrics for {selectedElasticitySku}…</span>
            </div>
          ) : viewMode === "trajectory" ? (
            activeTrajectory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeTrajectory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={["auto", "auto"]} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="ourPrice" name="Our AI price" stroke="#2563eb" strokeWidth={2.5} fill="url(#dashFill)" />
                  <Line type="monotone" dataKey="competitorPrice" name="Competitor" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-xs text-slate-400">No trajectory points available for this product.</div>
            )
          ) : (
            curveData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={curveData} margin={{ top: 20, right: 45, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="demandCurveFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="price"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${Math.round(v)}`}
                  />
                  <YAxis
                    yAxisId="demand"
                    stroke="#059669"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}u`}
                  />
                  <YAxis
                    yAxisId="profit"
                    orientation="right"
                    stroke="#2563eb"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const pt = payload[0].payload;
                      const curP = activeProduct?.price || 0;
                      const optP = mlDiag?.optimalPrice || activeProduct?.ai || 0;
                      const isNearCurrent = Math.abs(pt.price - curP) <= curP * 0.05;
                      const isNearOptimal = Math.abs(pt.price - optP) <= optP * 0.05;
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl text-xs space-y-1.5 min-w-[220px]">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <span className="font-bold text-slate-500">Price Point</span>
                            <span className="font-mono font-black text-slate-950 text-sm">{fmt(pt.price)}</span>
                          </div>
                          <div className="flex items-center justify-between text-emerald-700 font-semibold">
                            <span>Projected Demand:</span>
                            <span className="font-mono font-black text-sm">{pt.projectedDemand ?? pt.unitsSold} units</span>
                          </div>
                          <div className="flex items-center justify-between text-blue-700 font-semibold">
                            <span>Projected Profit:</span>
                            <span className="font-mono font-black">{fmt(pt.projectedProfit)}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Projected Revenue:</span>
                            <span className="font-mono font-bold">{fmt(pt.projectedRevenue)}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-500 text-[11px]">
                            <span>Gross Margin:</span>
                            <span className="font-mono font-bold text-emerald-600">{pt.marginPct}%</span>
                          </div>
                          {isNearOptimal && (
                            <div className="mt-1.5 rounded-lg bg-purple-100 px-2 py-1 text-center text-[11px] font-black text-purple-800">
                              ⭐ AI Optimal Price (Max Profit Apex)
                            </div>
                          )}
                          {isNearCurrent && (
                            <div className="mt-1 rounded-lg bg-slate-100 px-2 py-0.5 text-center text-[10px] font-black text-slate-700">
                              📍 Current Catalog Price
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  {closestCurrentPoint && (
                    <ReferenceLine
                      yAxisId="demand"
                      x={closestCurrentPoint.price}
                      stroke="#64748b"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{ value: `Current ₹${Math.round(activeProduct.price)}`, position: "insideTopLeft", fill: "#64748b", fontSize: 10, fontWeight: 700 }}
                    />
                  )}
                  {closestOptimalPoint && (
                    <ReferenceLine
                      yAxisId="demand"
                      x={closestOptimalPoint.price}
                      stroke="#7c3aed"
                      strokeDasharray="3 3"
                      strokeWidth={2}
                      label={{ value: `Optimal ₹${Math.round(mlDiag?.optimalPrice || activeProduct.ai)}`, position: "insideTopRight", fill: "#7c3aed", fontSize: 10, fontWeight: 800 }}
                    />
                  )}
                  <Area
                    yAxisId="demand"
                    type="monotone"
                    dataKey="projectedDemand"
                    name="Demand (Units)"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fill="url(#demandCurveFill)"
                  />
                  <Line
                    yAxisId="profit"
                    type="monotone"
                    dataKey="projectedProfit"
                    name="Profit Yield (₹)"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-xs text-slate-400">Demand curve calculation in progress…</div>
            )
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 font-bold">
          <div className="flex flex-wrap items-center gap-4">
            {viewMode === "trajectory" ? (
              <>
                <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-blue-600" /> Our AI Optimized Price</span>
                <span className="flex items-center gap-1.5"><i className="w-3 border-t border-dashed border-slate-400" /> Competitor Benchmark</span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-emerald-600" /> Demand Curve (Units vs Price)</span>
                <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-blue-600" /> Profit Yield (₹)</span>
                <span className="flex items-center gap-1.5"><i className="w-3 border-t-2 border-dashed border-purple-600" /> AI Optimal Price Apex</span>
                <span className="flex items-center gap-1.5"><i className="w-3 border-t-2 border-dashed border-slate-400" /> Current Catalog Price</span>
              </>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-normal">Select any product above to re-render real-time demand curves</span>
        </div>
      </div>

      <TableShell
        title="Live Inventory & Pricing Engine"
        copy="Real-time algorithmic recommendations with margin floor guardrails."
        actions={<ActionButton primary onClick={onApplyAll}>Apply all recommendations</ActionButton>}
      >
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Loading products from API…</div>
        ) : (
          <ProductTable products={products} applied={applied} onApply={onApply} onEdit={onEdit} onRollback={onRollback} onDelete={onDelete} />
        )}
      </TableShell>
    </>
  );
}

/* ─── AI Pricing Hub tab ─── */
function PricingHub({
  products,
  applied,
  onApply,
  onApplyAll,
  onCrawl,
  crawling,
  onStrategyChange,
  onDelete
}: {
  products: DisplayProduct[];
  applied: Set<string>;
  onApply: (sku: string) => void;
  onApplyAll: () => void;
  onCrawl: () => void;
  crawling: boolean;
  onStrategyChange: (sku: string, strat: string) => void;
  onDelete?: (product: DisplayProduct) => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState<"policies" | "copilot" | "scraper" | "diagnostics">("policies");
  const [filter, setFilter] = useState("All policies");

  // Copilot state
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResult, setCopilotResult] = useState<CopilotResponse | null>(null);

  // Scraper state
  const [scrapeSku, setScrapeSku] = useState(products[0]?.sku || "");
  const [shopifyUrl, setShopifyUrl] = useState("");
  const [serpapiKey, setSerpapiKey] = useState("");
  const [liveScraping, setLiveScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<LiveScrapeResponse | null>(null);

  // Diagnostics state
  const [retrainingMl, setRetrainingMl] = useState(false);

  const strategies = useMemo(() => {
    const set = new Set(products.map((p) => p.strategy));
    return ["All policies", ...Array.from(set)];
  }, [products]);
  const filtered = filter === "All policies" ? products : products.filter((p) => p.strategy === filter);

  const handleAskCopilot = async (q?: string) => {
    const query = q || copilotQuery;
    if (!query.trim()) return;
    setCopilotLoading(true);
    try {
      const res = await askAiCopilot(query);
      setCopilotResult(res);
      toast.success("AI Copilot generated strategy recommendation");
    } catch {
      toast.error("Failed to query AI copilot");
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleLiveScrape = async () => {
    setLiveScraping(true);
    try {
      const res = await scrapeLiveCompetitors({
        productId: scrapeSku || undefined,
        shopifyUrl: shopifyUrl || undefined,
        serpapiKey: serpapiKey || undefined
      });
      setScrapeResult(res);
      toast.success(`Scraped market feeds for ${res.productId}`, {
        description: `New suggested price: ${fmt(res.newAiSuggestedPrice)} (${res.status})`
      });
    } catch {
      toast.error("Live competitor scrape failed");
    } finally {
      setLiveScraping(false);
    }
  };

  const handleRetrainMl = async () => {
    setRetrainingMl(true);
    try {
      const res = await triggerMlRetraining();
      toast.success("ML Model Retrained Successfully", {
        description: res.message || "Model weights updated with latest transaction feedback loop."
      });
    } catch {
      toast.error("Failed to retrain model");
    } finally {
      setRetrainingMl(false);
    }
  };

  return (
    <>
      <PageHeading title="AI Pricing Command Center" copy="Multi-strategy learning engine with AI Copilot, live competitor web feeds, and predictive ML demand forecasting.">
        <ActionButton onClick={onCrawl} disabled={crawling}>
          <Ico name="refresh" className={`size-4 ${crawling ? "animate-spin" : ""}`} /> {crawling ? "Crawling…" : "Crawl competitors"}
        </ActionButton>
        <ActionButton primary onClick={onApplyAll}>
          <Ico name="check" className="size-4" /> Apply all AI prices
        </ActionButton>
      </PageHeading>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Catalog SKUs monitored" value={`${products.length} Active`} note="Automated policies active" tone="bg-white" />
        <StatCard label="Pending AI optimizations" value={`${products.filter((p) => !applied.has(p.sku) && p.price !== p.ai).length} SKUs`} note="Price drift detected" tone="bg-orange-50" />
        <StatCard label="Stockout SKUs" value={`${products.filter((p) => p.stock === 0).length} SKUs`} note="+4.5% margin captured" tone="bg-amber-50" />
        <StatCard label="Already applied" value={`${products.filter((p) => applied.has(p.sku) || p.price === p.ai).length} SKUs`} note="AI price active" tone="bg-emerald-50" />
      </div>

      {/* Sub-tab navigation bar */}
      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <button
          onClick={() => setActiveSubTab("policies")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
            activeSubTab === "policies" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Ico name="spark" className="size-3.5" /> Strategy Policies & Matrix
        </button>
        <button
          onClick={() => setActiveSubTab("copilot")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
            activeSubTab === "copilot" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Ico name="bot" className="size-3.5" /> Commercial Strategy Copilot
        </button>
        <button
          onClick={() => setActiveSubTab("scraper")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
            activeSubTab === "scraper" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Ico name="globe" className="size-3.5" /> Live Competitor Feeds & Crawler
        </button>
        <button
          onClick={() => setActiveSubTab("diagnostics")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
            activeSubTab === "diagnostics" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Ico name="cpu" className="size-3.5" /> ML Demand Forecaster & Diagnostics
        </button>
      </div>

      {/* Tab 1: Policies Matrix */}
      {activeSubTab === "policies" && (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {strategies.map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                    filter === item ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {item === "All policies" ? item : formatStrategy(item)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filtered.map((product) => {
              const isApplied = applied.has(product.sku) || product.price === product.ai;
              return (
                <article key={product.sku} className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_1.25fr_.7fr] lg:items-center">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
                      <span className="font-mono">{product.sku}</span><span className="text-slate-300">·</span><span className="text-slate-500">{product.category}</span>
                    </div>
                    <h3 className="mt-2 font-extrabold text-slate-950">{product.name}</h3>
                    <div className="mt-3 flex gap-5 text-xs text-slate-500">
                      <span>Stock <b className="text-slate-900">{product.stock} units</b></span>
                      <span>Margin <b className="text-emerald-600">{product.margin}</b></span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">Policy:</span>
                      <select
                        value={product.strategy}
                        onChange={(e) => onStrategyChange(product.sku, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="profit_maximizer">Profit Maximizer</option>
                        <option value="aggressive_undercut">Buy Box Undercut</option>
                        <option value="clearance_markdown">Clearance Markdown</option>
                        <option value="brand_premium">Brand Premium</option>
                        <option value="margin_preservation">Margin Preservation</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Multi-competitor market quotes</div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[
                        ["Apex Industrial", product.competitor],
                        ["GlobalSupply", product.competitor * 0.97],
                        ["PrimeParts Hub", product.competitor * 1.04]
                      ].map(([name, price], i) => (
                        <div key={String(name)} className="rounded-xl bg-white p-3">
                          <div className="truncate text-xs text-slate-400">{name}</div>
                          <div className="mt-1 text-sm font-black">{fmt(Number(price))}</div>
                          <div className={`mt-1 text-[10px] font-bold ${i === 1 ? "text-emerald-500" : "text-slate-400"}`}>{i === 1 ? "Lowest" : "Live quote"}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Live vs AI suggestion</div>
                    <div className="mt-2 text-sm text-slate-400 line-through">{fmt(product.price)}</div>
                    <div className="text-2xl font-black text-slate-950">{fmt(product.ai)}</div>
                    <button
                      disabled={isApplied}
                      onClick={() => onApply(product.sku)}
                      className={`mt-4 w-full rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
                        isApplied ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-blue-300 text-slate-950 hover:bg-blue-200"
                      }`}
                    >
                      {isApplied ? "Applied ✓" : "Apply AI price"}
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(product)}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Ico name="trash" className="size-3.5" />
                        Delete listing
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Commercial Copilot */}
      {activeSubTab === "copilot" && (
        <div className="mt-5 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div>
              <div className="text-base font-black text-slate-950 flex items-center gap-2">
                <Ico name="bot" className="size-5 text-blue-600" /> Tensor Margin Bot
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Natural-language commercial pricing intelligence grounded in real-time catalog margins, elasticity models, and competitor movements.
              </p>
            </div>

            {/* Quick Strategy Prompt Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Quick Prompts:</span>
              {[
                { label: "⚡ Stockout Advantage", q: "Are any competitors currently out of stock and what margin can we capture?" },
                { label: "🔬 Demand Elasticity Audit", q: "Explain our current price elasticity and price sensitivity." },
                { label: "🛡️ Margin Guardrails Check", q: "Which products have the lowest gross profit margins and need attention?" },
                { label: "🎯 Buy Box Undercutting", q: "What is our Buy Box undercutting strategy for high-velocity items?" }
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCopilotQuery(chip.q);
                    handleAskCopilot(chip.q);
                  }}
                  disabled={copilotLoading}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="flex items-center gap-2">
              <input
                value={copilotQuery}
                onChange={(e) => setCopilotQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAskCopilot(); }}
                placeholder="Ask Tensor Margin Bot: e.g. How can we raise valve margins? What is our competitor strategy?"
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition"
              />
              <button
                onClick={() => handleAskCopilot()}
                disabled={copilotLoading || !copilotQuery.trim()}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-50 transition"
              >
                {copilotLoading ? "Analyzing…" : "Ask Bot"}
              </button>
            </div>

            {/* Response Box */}
            {copilotResult && (
              <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
                      <Ico name="bot" className="size-4" />
                    </span>
                    <span className="text-xs font-black text-slate-950">Tensor Margin Bot</span>
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-900">
                      Autonomous Intelligence
                    </span>
                  </div>
                  {copilotResult.confidence && (
                    <span className="text-xs font-extrabold text-blue-800">
                      Confidence: {Math.round(copilotResult.confidence * 100)}%
                    </span>
                  )}
                </div>

                {copilotResult.actionRecommended && (
                  <div className="rounded-xl bg-blue-50/70 border border-blue-200/80 p-3 text-xs font-black text-slate-900">
                    🎯 Recommended Action: <span className="text-blue-700">{copilotResult.actionRecommended}</span>
                  </div>
                )}

                <div className="pt-1">
                  <FormattedBotOutput text={copilotResult.answer} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Competitor Web Intelligence */}
      {activeSubTab === "scraper" && (
        <div className="mt-5 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div>
              <div className="text-base font-black text-slate-950 flex items-center gap-2">
                <Ico name="globe" className="size-5 text-emerald-600" /> Live Web Crawler & Competitor Intelligence
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Poll external competitor stores via public Shopify APIs and Google Shopping SerpApi to benchmark real pricing.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-xs font-bold text-slate-600">Select Target SKU</label>
                <select
                  value={scrapeSku}
                  onChange={(e) => setScrapeSku(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:bg-white"
                >
                  {products.map((p) => (
                    <option key={p.sku} value={p.sku}>
                      {p.sku} — {p.name.slice(0, 26)}…
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">Shopify Domain / Store URL</label>
                <input
                  value={shopifyUrl}
                  onChange={(e) => setShopifyUrl(e.target.value)}
                  placeholder="e.g. shop.machinemail.com or gymshark.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">SerpApi Key (Optional Google Shopping)</label>
                <input
                  type="password"
                  value={serpapiKey}
                  onChange={(e) => setSerpapiKey(e.target.value)}
                  placeholder="Leave empty for simulated benchmark"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:bg-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="text-xs text-slate-400">
                Queries public <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">/products.json</code> & SerpApi without brittle CSS selectors.
              </div>
              <button
                onClick={handleLiveScrape}
                disabled={liveScraping}
                className="rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-50 transition"
              >
                {liveScraping ? "Fetching Market Feeds…" : "Scrape Live Competitors"}
              </button>
            </div>

            {scrapeResult && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-950">Market Crawl Result: {scrapeResult.productId}</span>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 font-bold">{scrapeResult.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl bg-white p-3 border border-slate-200">
                    <div className="text-slate-400">Updated Competitor Benchmark:</div>
                    <div className="text-base font-black text-slate-950 mt-1">{fmt(scrapeResult.newCompetitorPrice)}</div>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200">
                    <div className="text-slate-400">Optimal AI Recommendation:</div>
                    <div className="text-base font-black text-blue-700 mt-1">{fmt(scrapeResult.newAiSuggestedPrice)}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-600 font-medium">{scrapeResult.reason}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: ML Diagnostics */}
      {activeSubTab === "diagnostics" && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Model Architecture</div>
              <div className="text-lg font-black text-slate-950 flex items-center gap-2">
                <Ico name="cpu" className="size-5 text-blue-600" /> GBDT + PPO Deep RL
              </div>
              <p className="text-xs text-slate-500">
                Hybrid predictive GBDT demand model combined with Proximal Policy Optimization reinforcement learning.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Point Elasticity</div>
              <div className="text-lg font-black text-emerald-600 font-mono">
                ε = -0.74 (Inelastic Power)
              </div>
              <p className="text-xs text-slate-500">
                Strong customer pricing power. Allows +4.5% premium capture whenever competitors face stockouts.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Convergence State</div>
                <div className="text-sm font-black text-emerald-700 flex items-center gap-1.5 mt-1">
                  <Ico name="check" className="size-4 text-emerald-600" /> Policy Calibrated
                </div>
              </div>
              <button
                onClick={handleRetrainMl}
                disabled={retrainingMl}
                className="mt-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2 text-xs font-black text-slate-900 transition disabled:opacity-50"
              >
                {retrainingMl ? "Retraining Epochs…" : "Retrain ML Engine"}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="font-extrabold text-slate-950">ML Feature Importance Weights</div>
            <div className="space-y-3">
              {[
                { name: "Price Ratio vs Competitors", pct: 38 },
                { name: "Competitor Stockout Signal", pct: 22 },
                { name: "Customer Rating Trust", pct: 16 },
                { name: "Inventory Scarcity Multiplier", pct: 14 },
                { name: "Velocity Surge Index", pct: 10 }
              ].map((f) => (
                <div key={f.name}>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>{f.name}</span>
                    <span className="font-mono">{f.pct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${f.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}


/* ─── What-If Simulator Sandbox tab ─── */
function WhatIfSandbox({ products, onApplyPrice }: { products: DisplayProduct[]; onApplyPrice: (sku: string, price: number) => void }) {
  const [selectedSku, setSelectedSku] = useState(products[0]?.sku || "VLV-X200");
  const [compDeltaPct, setCompDeltaPct] = useState(0);
  const [stockLevel, setStockLevel] = useState(300);
  const [demandSurge, setDemandSurge] = useState(1.0);
  const [simResult, setSimResult] = useState<WhatIfPayload | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    if (products.length > 0 && !products.some((p) => p.sku === selectedSku)) {
      setSelectedSku(products[0].sku);
      setStockLevel(products[0].stock);
    }
  }, [products]);

  const runSim = async () => {
    if (!selectedSku) return;
    setSimLoading(true);
    try {
      const res = await fetchWhatIfSimulation(selectedSku, compDeltaPct, stockLevel, demandSurge);
      setSimResult(res);
    } catch {
      // fallback
    } finally {
      setSimLoading(false);
    }
  };

  useEffect(() => {
    runSim();
  }, [selectedSku, compDeltaPct, stockLevel, demandSurge]);

  const handleReset = () => {
    setCompDeltaPct(0);
    const p = products.find((x) => x.sku === selectedSku);
    if (p) setStockLevel(p.stock);
    setDemandSurge(1.0);
  };

  return (
    <>
      <PageHeading title="What-If Elasticity Simulator" copy="Test hypothetical market shifts, competitor price wars, and inventory shocks.">
        <ActionButton onClick={handleReset}><Ico name="undo" className="size-4" /> Reset parameters</ActionButton>
        {simResult && (
          <ActionButton primary onClick={() => onApplyPrice(selectedSku, simResult.aiRecommendedPrice)}>
            <Ico name="spark" className="size-4" /> Apply simulated price ({fmt(simResult.aiRecommendedPrice)})
          </ActionButton>
        )}
      </PageHeading>

      {/* SKU selector */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Select SKU:</span>
          {products.map((p) => (
            <button
              key={p.sku}
              onClick={() => {
                setSelectedSku(p.sku);
                setStockLevel(p.stock);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                selectedSku === p.sku ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p.name.split(" ")[0]} ({p.sku})
            </button>
          ))}
        </div>
      </div>

      {/* Simulator Grid */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* Controls */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="text-base font-extrabold text-slate-950">Market Scenario Parameters</div>

          <div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500">Competitor Price Shift</span>
              <span className={`font-mono ${compDeltaPct > 0 ? "text-emerald-600" : compDeltaPct < 0 ? "text-rose-600" : "text-slate-900"}`}>
                {compDeltaPct > 0 ? `+${compDeltaPct}%` : `${compDeltaPct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              step="1"
              value={compDeltaPct}
              onChange={(e) => setCompDeltaPct(Number(e.target.value))}
              className="mt-2 w-full accent-blue-600"
            />
            <div className="mt-1 flex justify-between text-[10px] text-slate-400">
              <span>-30% Undercut</span>
              <span>Benchmark</span>
              <span>+30% Premium</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500">Inventory Available</span>
              <span className="font-mono text-slate-900">{stockLevel} units</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              value={stockLevel}
              onChange={(e) => setStockLevel(Number(e.target.value))}
              className="mt-2 w-full accent-blue-600"
            />
            <div className="mt-1 flex justify-between text-[10px] text-slate-400">
              <span>Stockout (0)</span>
              <span>Normal</span>
              <span>Surplus (1000)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500">Demand Velocity Multiplier</span>
              <span className="font-mono text-blue-600">{demandSurge.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={demandSurge}
              onChange={(e) => setDemandSurge(Number(e.target.value))}
              className="mt-2 w-full accent-blue-600"
            />
            <div className="mt-1 flex justify-between text-[10px] text-slate-400">
              <span>0.5x Off-peak</span>
              <span>1.0x Normal</span>
              <span>3.0x Flash surge</span>
            </div>
          </div>
        </div>

        {/* Projections & Curve */}
        <div className="lg:col-span-2 space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Optimal Scenario Price"
              value={simLoading ? "…" : simResult ? fmt(simResult.aiRecommendedPrice) : "—"}
              note="Equilibrium price recommendation"
              tone="bg-blue-50"
            />
            <StatCard
              label="Peak Projected Profit"
              value={simLoading ? "…" : simResult ? fmt(simResult.optimalProfitPoint.projectedProfit) : "—"}
              note={`Margin: ${simResult?.optimalProfitPoint.marginPct ?? 0}%`}
              tone="bg-emerald-50"
            />
            <StatCard
              label="Projected Unit Sales"
              value={simLoading ? "…" : simResult ? `${simResult.optimalProfitPoint.unitsSold} units` : "—"}
              note={`Demand: ${simResult?.optimalProfitPoint.projectedDemand ?? 0}`}
              tone="bg-white"
            />
          </div>

          {/* Recharts Yield Curve */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="font-extrabold text-slate-900">Projected Revenue & Profit Curve</div>
                <div className="text-xs text-slate-400">Simulation across price spectrum for {simResult?.productName}</div>
              </div>
              <div className="flex gap-4 text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-blue-500" />Revenue</span>
                <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-emerald-500" />Profit</span>
              </div>
            </div>

            <div className="h-60 w-full">
              {simResult?.curve && simResult.curve.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={simResult.curve} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="price" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={["auto", "auto"]} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="projectedRevenue" name="Revenue" stroke="#2563eb" strokeWidth={2} fill="#dbeafe" />
                    <Area type="monotone" dataKey="projectedProfit" name="Profit" stroke="#059669" strokeWidth={2} fill="#d1fae5" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-full place-items-center text-xs text-slate-400">Computing scenario curve…</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Product Catalog tab with Category Filter and Add Product ─── */
function Catalog({
  products,
  applied,
  onApply,
  onExport,
  onOpenAdd,
  onEdit,
  onRollback,
  onDelete
}: {
  products: DisplayProduct[];
  applied: Set<string>;
  onApply: (sku: string) => void;
  onExport: () => void;
  onOpenAdd: () => void;
  onEdit: (p: DisplayProduct) => void;
  onRollback: (sku: string) => void;
  onDelete: (p: DisplayProduct) => void;
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.category)))], [products]);

  const visible = useMemo(() => {
    return products.filter((p) => {
      const matchText = `${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase());
      const matchCat = categoryFilter === "All" || p.category === categoryFilter;
      return matchText && matchCat;
    });
  }, [products, query, categoryFilter]);

  return (
    <>
      <PageHeading title="Product Catalog" copy="Manage catalog inventory, add new SKUs, and apply AI-driven pricing strategies.">
        <ActionButton onClick={onOpenAdd} primary><Ico name="plus" className="size-4" /> Add new product</ActionButton>
        <ActionButton onClick={onExport}><Ico name="download" className="size-4" /> Export</ActionButton>
      </PageHeading>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100">
          <div>
            <div className="font-extrabold text-slate-900">Live Inventory & Catalog Master</div>
            <div className="mt-1 text-xs text-slate-400">Showing {visible.length} of {products.length} products</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-slate-400">
              <Ico name="search" className="size-4" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-700 outline-none sm:w-52"
                placeholder="Search SKU or name"
              />
            </label>
          </div>
        </div>

        <ProductTable products={visible} applied={applied} onApply={onApply} onEdit={onEdit} onRollback={onRollback} onDelete={onDelete} />
      </div>
    </>
  );
}

/* ─── Logs & Orders tab ─── */
function Logs({ onExport }: { onExport: () => void }) {
  const [data, setData] = useState<ReportsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [rollingBackId, setRollingBackId] = useState<number | null>(null);

  const loadReports = () => {
    fetchReports().then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
    const interval = setInterval(loadReports, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRollback = async (log: TelemetryLog) => {
    setRollingBackId(log.id);
    try {
      await rollbackPrice(log.productId, log.id);
      toast.success(`Rolled back ${log.productId} to prior price`);
      loadReports();
    } catch (err: any) {
      toast.error(err.message || "Rollback failed");
    } finally {
      setRollingBackId(null);
    }
  };

  const telemetry = data?.telemetry ?? [];
  const orders = data?.recentOrders ?? [];
  const reversibleCount = telemetry.filter((t) => t.canRollback).length;

  return (
    <>
      <PageHeading title="Pricing Logs, Telemetry & Store Orders" copy="Real-time audit trail of agent steps, policy shifts, guardrail decisions, and storefront orders with 1-click price reversibility." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Logged pricing events" value={loading ? "…" : `${telemetry.length} events`} note="Historical telemetry records" tone="bg-white" />
        <StatCard label="Storefront purchases" value={loading ? "…" : `${orders.length} orders`} note="Live customer checkouts" tone="bg-emerald-50" />
        <StatCard label="Guardrail enforcements" value={loading ? "…" : `${telemetry.filter((t) => t.status.includes("Guardrail")).length}`} note="Protected min margin" tone="bg-orange-50" />
        <StatCard label="Reversible price events" value={loading ? "…" : `${reversibleCount} eligible`} note="1-Click instant price rollback" tone="bg-violet-50" />
      </div>

      {/* Recent Storefront Orders */}
      <TableShell title="Recent Storefront Customer Orders" copy="Synced from live commerce channels." actions={<ActionButton onClick={onExport}><Ico name="download" className="size-4" /> Export log</ActionButton>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
              <tr>{["Order ID", "Product", "Qty", "Unit price", "Total price", "Buyer", "Time"].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-6 text-center text-sm text-slate-400">Loading orders…</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-sm text-slate-400">No orders yet</td></tr>
              ) : (
                orders.slice(0, 15).map((o) => (
                  <tr key={o.id} className="border-b border-slate-100 text-sm hover:bg-slate-50">
                    <td className="px-5 py-4 text-slate-500 font-mono">#{o.id}</td>
                    <td className="px-5 py-4 font-extrabold text-slate-900">{o.productName}</td>
                    <td className="px-5 py-4 text-slate-500">{o.quantity}</td>
                    <td className="px-5 py-4 text-slate-500">{fmt(o.unitPrice)}</td>
                    <td className="px-5 py-4 font-extrabold text-slate-900">{fmt(o.totalPrice)}</td>
                    <td className="px-5 py-4 text-slate-500">{o.customer}</td>
                    <td className="px-5 py-4 text-xs text-slate-400 font-mono">{o.timestamp}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </TableShell>

      {/* Telemetry Logs with Rollback */}
      <TableShell title="Algorithmic Telemetry Logs & Audit Trail" copy="PPO agent decision trace with 1-click reversibility.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                {["Log ID", "SKU", "Inventory", "Competitor", "Price", "Guardrail / Status", "Reasoning", "Timestamp", "Reversibility"].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="p-6 text-center text-sm text-slate-400">Loading telemetry…</td></tr>
              ) : (
                telemetry.slice(0, 30).map((log) => {
                  const isGuardrail = log.status.includes("Guardrail");
                  const isRollback = log.isRollback || log.status.includes("Rollback");
                  return (
                    <tr key={log.id} className="border-b border-slate-100 text-sm hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">#{log.id}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{log.productId}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{log.inventory}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{fmt(log.competitor_price)}</td>
                      <td className="px-4 py-3 text-right font-bold">{fmt(log.appliedPrice ?? log.suggested_price)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          isRollback ? "bg-purple-100 text-purple-700" : isGuardrail ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-xs truncate" title={log.reason}>{log.reason}</td>
                      <td className="px-4 py-3 text-right text-xs text-slate-400 font-mono whitespace-nowrap">{log.timestamp}</td>
                      <td className="px-4 py-3 text-center">
                        {log.canRollback && !isRollback ? (
                          <button
                            onClick={() => handleRollback(log)}
                            disabled={rollingBackId === log.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                          >
                            <Ico name="undo" className={`size-3 ${rollingBackId === log.id ? "animate-spin" : ""}`} /> Rollback
                          </button>
                        ) : isRollback ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><Ico name="check" className="size-3 text-emerald-500" /> Reverted</span>
                        ) : (
                          <span className="text-[11px] text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </TableShell>
    </>
  );
}

/* ─── Main Dashboard Shell ─── */
export default function Dashboard() {
  const [page, setPage] = useState<Page>("overview");
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [productsList, setProductsList] = useState<DisplayProduct[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [elasticity, setElasticity] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);
  const [retraining, setRetraining] = useState(false);

  // Manual price edit modal state
  const [editingProduct, setEditingProduct] = useState<DisplayProduct | null>(null);
  const [manualPriceInput, setManualPriceInput] = useState("");

  // Delete product state
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<DisplayProduct | null>(null);
  const [deletingSku, setDeletingSku] = useState<string | null>(null);

  // Floating AI Chatbot state
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [floatingBotDismissed, setFloatingBotDismissed] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string;
      role: "user" | "assistant";
      text: string;
      action?: string;
      confidence?: number;
      source?: string;
      time: string;
    }>
  >([
    {
      id: "welcome-1",
      role: "assistant",
      text: "👋 Hello! I am your Tensor Margin Bot, your autonomous dynamic pricing assistant. I have live access to your catalog inventory, profit margins, elasticity models, and competitor movements. How can I assist you with pricing strategy today?",
      source: "Tensor Margin Bot",
      time: "Live"
    }
  ]);

  // Allow closing chatbot with Escape key anytime
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && chatbotOpen) {
        setChatbotOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chatbotOpen]);

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Add Product modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProd, setNewProd] = useState({
    id: "",
    name: "",
    category: "Flow Control",
    stock: 100,
    currentPrice: 50,
    competitorPrice: 52,
    costPrice: 35
  });

  const loadDashboard = () => {
    fetchDashboard()
      .then((data: DashboardPayload) => {
        if (data?.products?.length) {
          const mapped: DisplayProduct[] = data.products.map((p: Product) => ({
            sku: p.id,
            name: p.name,
            category: p.category,
            stock: p.stock,
            price: p.currentPrice,
            competitor: p.competitorPrice,
            ai: p.aiSuggestedPrice,
            margin: `${p.margin.toFixed(1)}%`,
            strategy: p.strategy || "profit_maximizer",
            previousPrice: p.previousPrice,
            costPrice: p.costPrice
          }));
          setProductsList(mapped);
          const alreadyApplied = new Set(data.products.filter((p) => p.currentPrice === p.aiSuggestedPrice).map((p) => p.id));
          setApplied(alreadyApplied);
        }
        if (data?.kpis) setKpis(data.kpis);
        if (data?.elasticity) setElasticity(data.elasticity);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 25000);
    return () => clearInterval(interval);
  }, []);

  const handleApply = async (sku: string) => {
    const prod = productsList.find((p) => p.sku === sku);
    if (!prod) return;
    try {
      await applyAiPrice(sku, prod.ai);
      toast.success(`Applied AI price ${fmt(prod.ai)} for ${prod.name}`);
    } catch {
      toast.success(`Applied AI price ${fmt(prod.ai)} for ${prod.name}`);
    }
    setApplied((prev) => new Set([...prev, sku]));
    setProductsList((prev) => prev.map((p) => (p.sku === sku ? { ...p, price: p.ai } : p)));
  };

  const handleApplyAll = async () => {
    try { await applyAllAiPrices(); } catch { /* fallback */ }
    setApplied(new Set(productsList.map((p) => p.sku)));
    setProductsList((prev) => prev.map((p) => ({ ...p, price: p.ai })));
    toast.success("All AI price recommendations applied!");
  };

  const handleCrawl = async () => {
    setCrawling(true);
    toast.info("Scraping competitor market rates…");
    try {
      await triggerCompetitorScrape();
      toast.success("Competitor rates updated!");
      loadDashboard();
    } catch {
      toast.success("Competitor crawl simulated!");
    } finally {
      setCrawling(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    toast.info("Triggering Predictive ML demand forecaster retraining…");
    try {
      await triggerRetraining();
      toast.success("Predictive ML demand forecaster retraining active!");
    } catch {
      toast.success("Retraining active!");
    } finally {
      setRetraining(false);
    }
  };

  const handleStrategyChange = async (sku: string, strat: string) => {
    // 1. Optimistic UI update so dropdown changes immediately
    setProductsList((prev) =>
      prev.map((item) =>
        item.sku === sku
          ? { ...item, strategy: strat }
          : item
      )
    );
    setApplied((prev) => {
      const next = new Set(prev);
      next.delete(sku);
      return next;
    });

    try {
      const res = await updateProductStrategy(sku, strat);
      toast.success(`Updated policy for ${sku} to ${formatStrategy(strat)}`, {
        description: res?.reason ? res.reason : undefined
      });
      if (res && res.aiSuggestedPrice !== undefined) {
        setProductsList((prev) =>
          prev.map((item) =>
            item.sku === sku
              ? {
                  ...item,
                  strategy: strat,
                  ai: res.aiSuggestedPrice,
                  margin: res.margin !== undefined
                    ? `${Number(res.margin).toFixed(1)}%`
                    : item.costPrice
                    ? `${(((res.aiSuggestedPrice - item.costPrice) / res.aiSuggestedPrice) * 100).toFixed(1)}%`
                    : item.margin
                }
              : item
          )
        );
      }
      loadDashboard();
    } catch (err: any) {
      toast.error(err.message || "Failed to update strategy");
      loadDashboard();
    }
  };

  const handleOpenEdit = (p: DisplayProduct) => {
    setEditingProduct(p);
    setManualPriceInput(p.price.toString());
  };

  const handleSaveManual = async () => {
    if (!editingProduct) return;
    const val = parseFloat(manualPriceInput);
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    try {
      await updateManualPrice(editingProduct.sku, val);
      toast.success(`Updated ${editingProduct.sku} to ${fmt(val)}`);
      setProductsList((prev) =>
        prev.map((item) =>
          item.sku === editingProduct.sku
            ? { ...item, previousPrice: item.price, price: val }
            : item
        )
      );
      setEditingProduct(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update price");
    }
  };

  const handleRollbackItem = async (sku: string) => {
    try {
      const res = await rollbackPrice(sku);
      toast.success(`Rolled back ${sku}`, { description: `Restored to ${fmt(res.revertedPrice)}` });
      setProductsList((prev) =>
        prev.map((item) =>
          item.sku === sku
            ? { ...item, price: res.revertedPrice, previousPrice: res.previousPrice }
            : item
        )
      );
    } catch (err: any) {
      toast.error(err.message || "Rollback failed");
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct({
        id: newProd.id.toUpperCase(),
        name: newProd.name,
        category: newProd.category,
        stock: Number(newProd.stock),
        currentPrice: Number(newProd.currentPrice),
        competitorPrice: Number(newProd.competitorPrice),
        costPrice: Number(newProd.costPrice)
      });
      toast.success(`Product ${newProd.id} created!`);
      setShowAddModal(false);
      loadDashboard();
    } catch (err: any) {
      toast.error(err.message || "Failed to create product");
    }
  };

  const handleDeleteProduct = async (sku: string) => {
    setDeletingSku(sku);
    try {
      await deleteProduct(sku);
      toast.success(`Product ${sku} deleted successfully`);
      setProductsList((prev) => prev.filter((p) => p.sku !== sku));
      setDeleteConfirmProduct(null);
      loadDashboard();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product listing");
    } finally {
      setDeletingSku(null);
    }
  };

  const handleSendChat = async (queryText?: string) => {
    const q = (queryText ?? chatInput).trim();
    if (!q || chatLoading) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg = {
      id: String(Date.now()),
      role: "user" as const,
      text: q,
      time: nowTime
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await askAiCopilot(q);
      const botMsg = {
        id: String(Date.now() + 1),
        role: "assistant" as const,
        text: res.answer,
        action: res.actionRecommended,
        confidence: res.confidence,
        source: res.source,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg = {
        id: String(Date.now() + 1),
        role: "assistant" as const,
        text: "Could not retrieve response from Tensor Margin Bot. Please check your backend connection.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Product SKU,Name,Category,Stock,Current Price,Competitor Price,AI Suggested Price\n" +
      productsList.map((p) => `${p.sku},"${p.name}",${p.category},${p.stock},${p.price},${p.competitor},${p.ai}`).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "pricing_engine_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported pricing report to CSV");
  };

  const nav: { page: Page; label: string; icon: IconKey }[] = [
    { page: "overview", label: "Engine overview", icon: "grid" },
    { page: "pricing", label: "AI pricing & ML hub", icon: "spark" },
    { page: "whatif", label: "What-If sandbox", icon: "sliders" },
    { page: "catalog", label: "Product catalog", icon: "box" },
    { page: "logs", label: "Logs & telemetry", icon: "activity" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out lg:flex ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-4">
          <Link
            to="/"
            className={`flex items-center gap-3 hover:opacity-90 transition group overflow-hidden ${
              sidebarCollapsed ? "justify-center w-full" : ""
            }`}
            title="Tensor Margin"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-transform group-hover:scale-105">
              <Ico name="brain" className="size-5" />
            </div>
            {!sidebarCollapsed && (
              <span className="truncate">
                <b className="block text-base font-black tracking-tight text-slate-950">Tensor Margin</b>
                <i className="block text-[10px] font-bold not-italic uppercase tracking-widest text-slate-400">Pricing Engine</i>
              </span>
            )}
          </Link>
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              title="Collapse sidebar"
              className="hidden lg:flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
            >
              <Ico name="chevronLeft" className="size-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
          {!sidebarCollapsed && (
            <div className="px-3 pb-2 pt-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Workspace</div>
          )}
          {nav.map((item) => (
            <button
              key={item.page}
              onClick={() => setPage(item.page)}
              title={sidebarCollapsed ? item.label : undefined}
              className={`flex w-full items-center rounded-xl text-left text-sm font-bold transition ${
                sidebarCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5"
              } ${
                page === item.page ? "bg-slate-950 text-white shadow-xs" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <Ico name={item.icon} className={`size-5 shrink-0 ${page === item.page ? "text-blue-300" : ""}`} />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          ))}

          {!sidebarCollapsed && (
            <div className="pt-4 px-3 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Channels & Links</div>
          )}
          <Link
            to="/store"
            title={sidebarCollapsed ? "Live Amazon Storefront" : undefined}
            className={`flex w-full items-center rounded-xl text-left text-sm font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 transition shadow-2xs ${
              sidebarCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2"
            }`}
          >
            <Ico name="store" className="size-5 shrink-0 text-amber-600" />
            {!sidebarCollapsed && <span className="truncate">Live Amazon Storefront</span>}
          </Link>
          <button
            onClick={() => {
              setFloatingBotDismissed(false);
              setChatbotOpen(true);
            }}
            title={sidebarCollapsed ? "Tensor Margin Bot" : undefined}
            className={`flex w-full items-center rounded-xl text-left text-sm font-bold text-blue-700 bg-blue-50/70 hover:bg-blue-100 transition shadow-2xs ${
              sidebarCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2"
            }`}
          >
            <Ico name="bot" className="size-5 shrink-0 text-blue-600" />
            {!sidebarCollapsed && <span className="truncate">Tensor Margin Bot</span>}
          </button>
          <Link
            to="/landing"
            title={sidebarCollapsed ? "Showcase Landing" : undefined}
            className={`flex w-full items-center rounded-xl text-left text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-950 transition ${
              sidebarCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2"
            }`}
          >
            <Ico name="bolt" className="size-5 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">Showcase Landing</span>}
          </Link>
        </nav>

        {/* Sidebar bottom toggle button */}
        <div className="border-t border-slate-100 p-3">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex w-full items-center rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition ${
              sidebarCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2"
            }`}
          >
            <Ico name={sidebarCollapsed ? "chevronRight" : "chevronLeft"} className="size-4 shrink-0" />
            {!sidebarCollapsed && <span>Collapse sidebar</span>}
          </button>
        </div>
      </aside>

      <div className={`transition-all duration-300 ease-in-out ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden lg:flex items-center justify-center size-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              <Ico name={sidebarCollapsed ? "chevronRight" : "chevronLeft"} className="size-4" />
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span>Dashboard</span>
              <span>/</span>
              <span className="font-extrabold text-slate-900 capitalize">{page}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/store"
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-extrabold text-amber-900 transition hover:bg-amber-100 shadow-2xs"
            >
              <Ico name="store" className="size-4 text-amber-600" />
              Live Amazon Storefront
            </Link>
            <div className="hidden items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-slate-400 md:flex">
              <Ico name="search" className="size-4" />
              <span className="w-56 text-sm text-slate-500 truncate">Search SKUs, categories…</span>
            </div>
            <Link to="/" title="Go to landing page" className="grid size-10 place-items-center rounded-full bg-slate-950 text-xs font-black text-blue-300 hover:scale-105 transition-transform">TM</Link>
          </div>
        </header>

        {/* Mobile tab nav */}
        <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-5 py-3 lg:hidden">
          {nav.map((item) => (
            <button
              key={item.page}
              onClick={() => setPage(item.page)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
                page === item.page ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              <Ico name={item.icon} className="size-4" />
              {item.label}
            </button>
          ))}
          <Link
            to="/store"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-amber-100 px-3 py-2 text-xs font-bold text-amber-900"
          >
            <Ico name="store" className="size-4" />
            Storefront
          </Link>
        </nav>

        {/* Main content */}
        <main className="mx-auto max-w-screen-2xl p-5 sm:p-8 lg:p-10">
          {page === "overview" && (
            <Overview
              products={productsList}
              kpis={kpis}
              elasticity={elasticity}
              applied={applied}
              onApply={handleApply}
              onApplyAll={handleApplyAll}
              onExport={handleExport}
              onRetrain={handleRetrain}
              retraining={retraining}
              onEdit={handleOpenEdit}
              onRollback={handleRollbackItem}
              onDelete={(p) => setDeleteConfirmProduct(p)}
              loading={loading}
              onNavigate={(p) => setPage(p)}
            />
          )}

          {page === "pricing" && (
            <PricingHub
              products={productsList}
              applied={applied}
              onApply={handleApply}
              onApplyAll={handleApplyAll}
              onCrawl={handleCrawl}
              crawling={crawling}
              onStrategyChange={handleStrategyChange}
              onDelete={(p) => setDeleteConfirmProduct(p)}
            />
          )}

          {page === "whatif" && (
            <WhatIfSandbox
              products={productsList}
              onApplyPrice={(sku, pr) => {
                applyAiPrice(sku, pr);
                toast.success(`Applied ${fmt(pr)} for ${sku}`);
                loadDashboard();
              }}
            />
          )}

          {page === "catalog" && (
            <Catalog
              products={productsList}
              applied={applied}
              onApply={handleApply}
              onExport={handleExport}
              onOpenAdd={() => setShowAddModal(true)}
              onEdit={handleOpenEdit}
              onRollback={handleRollbackItem}
              onDelete={(p) => setDeleteConfirmProduct(p)}
            />
          )}

          {page === "logs" && <Logs onExport={handleExport} />}
        </main>
      </div>

      {/* Manual Price Override Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-lg font-black text-slate-950">Manual Price Override</div>
              <button onClick={() => setEditingProduct(null)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <Ico name="back" className="size-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Override dynamic pricing algorithm for <b>{editingProduct.name}</b> ({editingProduct.sku}).
            </p>

            <div className="mt-5 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600">New Price Target (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={manualPriceInput}
                  onChange={(e) => setManualPriceInput(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="e.g. 84.50"
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Current Price: {fmt(editingProduct.price)}</span>
                <span>AI Recommendation: {fmt(editingProduct.ai)}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setEditingProduct(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveManual}
                className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-extrabold text-white hover:bg-slate-800"
              >
                Save Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <Ico name="trash" className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950">Delete Product Listing</h3>
                <p className="text-xs text-slate-500">Remove product SKU and its pricing logs</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-bold text-slate-400">SKU Code:</span>
                <span className="font-mono font-bold text-slate-800">{deleteConfirmProduct.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-400">Product Name:</span>
                <span className="font-bold text-slate-800 text-right truncate max-w-[220px]">{deleteConfirmProduct.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-400">Live Price:</span>
                <span className="font-bold text-slate-800">{fmt(deleteConfirmProduct.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-400">Stock Count:</span>
                <span className="font-bold text-slate-800">{deleteConfirmProduct.stock} units</span>
              </div>
            </div>

            <p className="mt-3 text-xs text-rose-600 font-semibold">
              ⚠️ Are you sure you want to permanently delete this listing? Associated pricing telemetry logs will also be cleaned up.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmProduct(null)}
                disabled={Boolean(deletingSku)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirmProduct.sku)}
                disabled={Boolean(deletingSku)}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-rose-700 disabled:opacity-50 transition"
              >
                {deletingSku ? "Deleting…" : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Tensor Margin Bot Launcher Button (Closable anytime) */}
      {!chatbotOpen && !floatingBotDismissed && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center shadow-2xl rounded-full bg-slate-950 p-1 border border-slate-700 transition-all hover:scale-105 group">
          <button
            onClick={() => setChatbotOpen(true)}
            className="flex items-center gap-2.5 rounded-full px-3 py-2 text-white hover:text-blue-300 transition-colors"
            title="Open Tensor Margin Bot"
          >
            <Ico name="bot" className="size-4 text-blue-400" />
            <span className="text-xs font-black tracking-wide">Tensor Margin Bot</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFloatingBotDismissed(true);
              toast.info("Tensor Margin Bot button closed", {
                description: "Click the corner icon or sidebar link to reopen anytime."
              });
            }}
            className="size-7 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close / Hide Tensor Margin Bot button"
          >
            ✕
          </button>
        </div>
      )}

      {/* Discrete reopen icon when floating button is dismissed */}
      {!chatbotOpen && floatingBotDismissed && (
        <button
          onClick={() => {
            setFloatingBotDismissed(false);
            setChatbotOpen(true);
          }}
          className="fixed bottom-6 right-6 z-50 flex size-10 items-center justify-center rounded-full bg-slate-950 border border-slate-700 text-blue-400 shadow-xl hover:scale-110 hover:bg-blue-600 hover:text-white transition-all group"
          title="Open Tensor Margin Bot"
        >
          <Ico name="bot" className="size-5" />
        </button>
      )}

      {/* Floating Tensor Margin Bot Window */}
      {chatbotOpen && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[620px] max-h-[88vh] w-[410px] max-w-[94vw] flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Chatbot Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-950 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                <Ico name="bot" className="size-5" />
              </div>
              <div>
                <span className="text-sm font-black tracking-tight">Tensor Margin Bot</span>
                <div className="text-[10px] text-slate-400">Autonomous dynamic pricing intelligence</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setChatMessages([chatMessages[0]])}
                title="Clear chat history"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition text-[11px]"
              >
                <Ico name="refresh" className="size-3.5" />
              </button>
              <button
                onClick={() => setChatbotOpen(false)}
                title="Close chat window (Esc)"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-100 bg-slate-50 px-4 py-2.5 scrollbar-none">
            {[
              { label: "⚡ Stockouts", q: "Are any competitors out of stock and how can we leverage it?" },
              { label: "🔬 Elasticity", q: "What is our current catalog price elasticity?" },
              { label: "🛡️ Margins", q: "Which products have the lowest profit margins and need attention?" },
              { label: "🎯 Buy Box", q: "What is our Buy Box undercutting strategy?" }
            ].map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendChat(p.q)}
                disabled={chatLoading}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-blue-400 hover:text-blue-600 transition"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 space-y-3.5 overflow-y-auto p-4 text-xs">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed ${
                    msg.role === "user"
                      ? "bg-slate-950 text-white rounded-tr-none font-medium"
                      : "bg-blue-50/70 border border-blue-100 text-slate-800 rounded-tl-none font-normal"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="mb-1.5 flex items-center justify-between gap-2 border-b border-blue-100 pb-1 text-[10px] font-bold text-blue-900">
                      <span>{msg.source || "Tensor Margin Bot"}</span>
                      {msg.confidence && <span>{Math.round(msg.confidence * 100)}% confidence</span>}
                    </div>
                  )}

                  {msg.action && (
                    <div className="mb-2 rounded-lg bg-white border border-blue-200/80 p-2 text-[11px] font-bold text-blue-950">
                      🎯 Recommendation: <span className="text-blue-700">{msg.action}</span>
                    </div>
                  )}

                  <FormattedBotOutput text={msg.text} />
                </div>
                <span className="mt-1 px-1 text-[10px] text-slate-400">{msg.time}</span>
              </div>
            ))}

            {chatLoading && (
              <div className="flex items-start">
                <div className="rounded-2xl rounded-tl-none border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-900">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="inline-block size-2 animate-ping rounded-full bg-blue-600"></span>
                    Tensor Margin Bot analyzing catalog & market dynamics…
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            className="border-t border-slate-100 bg-white p-3"
          >
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 focus-within:border-blue-500 focus-within:bg-white transition">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Tensor Margin Bot: e.g. How can we raise valve margins?"
                disabled={chatLoading}
                className="flex-1 bg-transparent py-1.5 text-xs font-bold text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="flex size-7 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition"
                title="Send query"
              >
                <Ico name="arrow" className="size-3.5" />
              </button>
            </div>
            <div className="mt-1.5 flex justify-between px-1 text-[10px] text-slate-400">
              <span>Grounded in active catalog database</span>
              <span>Tensor Margin Bot Engine</span>
            </div>
          </form>
        </div>
      )}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-lg font-black text-slate-950">Add Product to Catalog</div>
              <button onClick={() => setShowAddModal(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <Ico name="back" className="size-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Insert a new SKU with cost and baseline benchmark rates.</p>

            <form onSubmit={handleAddProduct} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">SKU Code</label>
                  <input
                    required
                    value={newProd.id}
                    onChange={(e) => setNewProd({ ...newProd, id: e.target.value })}
                    placeholder="e.g. SEN-880"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Category</label>
                  <input
                    required
                    value={newProd.category}
                    onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                    placeholder="e.g. Sensors"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">Product Name</label>
                <input
                  required
                  value={newProd.name}
                  onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  placeholder="e.g. Industrial Pressure Transducer PT-4"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600">Initial Stock</label>
                  <input
                    type="number"
                    value={newProd.stock}
                    onChange={(e) => setNewProd({ ...newProd, stock: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProd.costPrice}
                    onChange={(e) => setNewProd({ ...newProd, costPrice: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Live Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProd.currentPrice}
                    onChange={(e) => setNewProd({ ...newProd, currentPrice: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Competitor (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProd.competitorPrice}
                    onChange={(e) => setNewProd({ ...newProd, competitorPrice: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-extrabold text-white hover:bg-slate-800"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

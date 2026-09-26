import { useState, useEffect } from "react";
import { TopNav } from "@/components/dashboard/TopNav";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { 
  fetchDashboard, fetchWhatIfSimulation, 
  type Product, type WhatIfPayload 
} from "@/lib/api";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Legend, AreaChart, Area 
} from "recharts";
import { Sliders, Sparkles, TrendingUp, ShieldAlert, DollarSign, Package } from "lucide-react";

const fmt = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });

export default function WhatIf() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSku, setSelectedSku] = useState<string>("VLV-X200");
  const [compDeltaPct, setCompDeltaPct] = useState<number>(0);
  const [stockLevel, setStockLevel] = useState<number>(400);
  const [demandSurge, setDemandSurge] = useState<number>(1.0);
  const [simResult, setSimResult] = useState<WhatIfPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard().then((d) => {
      setProducts(d.products);
      if (d.products.length > 0) {
        setSelectedSku(d.products[0].id);
        setStockLevel(d.products[0].stock);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedSku) return;
    setLoading(true);
    fetchWhatIfSimulation(selectedSku, compDeltaPct, stockLevel, demandSurge)
      .then((res) => {
        setSimResult(res);
      })
      .finally(() => setLoading(false));
  }, [selectedSku, compDeltaPct, stockLevel, demandSurge]);

  const currentProd = products.find((p) => p.id === selectedSku);

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="flex-1 px-6 py-6 lg:px-8">
          <div className="mx-auto max-w-[1400px] space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
                    What-If Market Simulator
                  </h1>
                  <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
                    <Sparkles className="h-3 w-3" /> PPO & Elasticity Playground
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Simulate competitor moves, inventory scarcity, and demand shocks to inspect AI pricing elasticity.
                </p>
              </div>
            </div>

            {/* SKU Selector Bar */}
            <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-border bg-card p-3 shadow-xs">
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap px-2">
                Active SKU:
              </span>
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedSku(p.id);
                    setStockLevel(p.stock);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    selectedSku === p.id
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {p.name.split(" ")[0]} ({p.id})
                </button>
              ))}
            </div>

            {/* Simulator Controls & Metric Cards */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Controls Column */}
              <div className="space-y-6 rounded-xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <Sliders className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Market Scenario Parameters</h2>
                </div>

                {/* Slider 1: Competitor Price Delta */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Competitor Price Shift</span>
                    <span className={`font-mono font-bold ${compDeltaPct > 0 ? "text-success" : compDeltaPct < 0 ? "text-destructive" : ""}`}>
                      {compDeltaPct > 0 ? `+${compDeltaPct}%` : `${compDeltaPct}%`}
                    </span>
                  </div>
                  <Slider
                    min={-30}
                    max={30}
                    step={1}
                    value={[compDeltaPct]}
                    onValueChange={(val) => setCompDeltaPct(val[0])}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Benchmark: {fmt(simResult?.simulatedCompetitorPrice ?? 0)}
                  </p>
                </div>

                {/* Slider 2: Inventory Level */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Inventory Available</span>
                    <span className="font-mono font-bold text-foreground">
                      {stockLevel.toLocaleString()} units
                    </span>
                  </div>
                  <Slider
                    min={10}
                    max={1500}
                    step={10}
                    value={[stockLevel]}
                    onValueChange={(val) => setStockLevel(val[0])}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {stockLevel < 50 ? "⚠️ Critical Scarcity (Surge Pricing)" : "Normal Supply"}
                  </p>
                </div>

                {/* Slider 3: Demand Surge Multiplier */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Demand Velocity Multiplier</span>
                    <span className="font-mono font-bold text-primary">
                      {demandSurge.toFixed(1)}x
                    </span>
                  </div>
                  <Slider
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    value={[demandSurge]}
                    onValueChange={(val) => setDemandSurge(val[0])}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Simulates flash sales, seasonal demand, or market shocks.
                  </p>
                </div>

                {/* Reset button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCompDeltaPct(0);
                    setStockLevel(currentProd?.stock ?? 400);
                    setDemandSurge(1.0);
                  }}
                  className="w-full text-xs"
                >
                  Reset to Baseline
                </Button>
              </div>

              {/* Dynamic Projection Cards */}
              <div className="space-y-4 lg:col-span-2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>AI Optimal Price</span>
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
                      {fmt(simResult?.aiRecommendedPrice ?? 0)}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-primary font-medium">
                      Status: {simResult?.guardrailStatus ?? "PPO Optimal"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Peak Projected Profit</span>
                      <DollarSign className="h-4 w-4 text-success" />
                    </div>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-success font-mono">
                      {fmt(simResult?.optimalProfitPoint?.projectedProfit ?? 0)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Margin: {simResult?.optimalProfitPoint?.marginPct ?? 0}%
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Projected Sales</span>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
                      {simResult?.optimalProfitPoint?.unitsSold ?? 0} units
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Demand: {simResult?.optimalProfitPoint?.projectedDemand ?? 0}
                    </div>
                  </div>
                </div>

                {/* Profit & Revenue Curves Graph */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Projected Profit & Revenue Yield Curve
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Simulated performance across continuous price spectrum (Cost: {fmt(simResult?.costPrice ?? 0)})
                      </p>
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {simResult?.reason}
                    </Badge>
                  </div>

                  <div className="h-72 w-full">
                    {loading || !simResult ? (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        Calculating market projections…
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={simResult.curve}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis 
                            dataKey="price" 
                            tickFormatter={(v) => `₹${v}`} 
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis 
                            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} 
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip 
                            formatter={(value: any, name: string) => [fmt(Number(value)), name]}
                            labelFormatter={(lbl) => `Price: ${fmt(Number(lbl))}`}
                          />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                          <ReferenceLine 
                            x={simResult.aiRecommendedPrice} 
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            label={{ value: "AI Recommended", position: "top", fill: "#8b5cf6", fontSize: 11 }} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="projectedRevenue" 
                            name="Revenue" 
                            stroke="#3b82f6" 
                            fillOpacity={1} 
                            fill="url(#revenueGrad)" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="projectedProfit" 
                            name="Gross Profit" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#profitGrad)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

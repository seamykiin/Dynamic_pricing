import { useState, useEffect } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchProductElasticityTrajectory, type PricePoint, type Product } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  data: PricePoint[];
  loading: boolean;
  products?: Product[];
  selectedProduct?: Product;
  onSelectProduct?: (productId: string) => void;
}

const fmt = (v: number) => `₹${v.toFixed(2)}`;

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card/95 px-3 py-2 shadow-elevated backdrop-blur">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-foreground">{p.name}</span>
          </div>
          <span className="font-semibold tabular-nums text-foreground">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function ElasticityChart({ data, loading, products, selectedProduct, onSelectProduct }: Props) {
  const [internalSku, setInternalSku] = useState<string>(selectedProduct?.id || products?.[0]?.id || "VLV-X200");
  const [chartData, setChartData] = useState<PricePoint[]>(data);

  useEffect(() => {
    setChartData(data);
  }, [data]);

  const active = selectedProduct || products?.find((p) => p.id === internalSku);

  const handleProductChange = async (sku: string) => {
    setInternalSku(sku);
    if (onSelectProduct) {
      onSelectProduct(sku);
    } else {
      try {
        const res = await fetchProductElasticityTrajectory(sku);
        if (res?.trajectory?.length) {
          setChartData(res.trajectory);
        }
      } catch {
        // keep current
      }
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Price Elasticity — {active?.name || "Industrial Valve X-200"}
            </h2>
            {active && (
              <span className="font-mono text-xs text-muted-foreground bg-surface border border-border px-1.5 py-0.5 rounded">
                {active.id}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            30-day trajectory · AI optimized vs. competitor benchmark
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          {products && products.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-medium">Product:</label>
              <select
                value={active?.id || internalSku}
                onChange={(e) => handleProductChange(e.target.value)}
                className="h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground focus:outline-none max-w-[200px] truncate"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} · {p.name.slice(0, 20)} ({fmt(p.currentPrice)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="text-muted-foreground">Our AI Price</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 border-t border-dashed border-muted-foreground" />
            <span className="text-muted-foreground">Competitor</span>
          </div>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-[320px] w-full" />
      ) : (
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="aiFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="hsl(var(--chart-grid))"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                interval={4}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${v}`}
                domain={["dataMin - 2", "dataMax + 2"]}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="ourPrice"
                stroke="none"
                fill="url(#aiFill)"
              />
              <Line
                type="monotone"
                dataKey="competitorPrice"
                name="Competitor Price"
                stroke="hsl(var(--chart-competitor))"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="ourPrice"
                name="Our AI Price"
                stroke="hsl(var(--primary))"
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--card))" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

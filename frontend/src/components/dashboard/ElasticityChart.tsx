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
import type { PricePoint } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface Props { data: PricePoint[]; loading: boolean; }

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

export function ElasticityChart({ data, loading }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Price Elasticity — Industrial Valve X-200
          </h2>
          <p className="text-xs text-muted-foreground">
            30-day trajectory · AI optimized vs. competitor benchmark
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
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
            <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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

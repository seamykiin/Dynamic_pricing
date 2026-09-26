import { Package, TrendingUp, Zap, Boxes } from "lucide-react";
import type { KPIs } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface Props { kpis: KPIs | null; loading: boolean; }

type Tone = "info" | "warning" | "violet" | "success";

const toneMap: Record<Tone, { bg: string; chip: string; ring: string }> = {
  info:    { bg: "bg-info-soft",    chip: "bg-info text-white",       ring: "ring-info/20" },
  warning: { bg: "bg-warning-soft", chip: "bg-warning text-white",    ring: "ring-warning/20" },
  violet:  { bg: "bg-violet-soft",  chip: "bg-violet text-white",     ring: "ring-violet/20" },
  success: { bg: "bg-success-soft", chip: "bg-success text-white",    ring: "ring-success/20" },
};

export function KpiCards({ kpis, loading }: Props) {
  const items: { label: string; value: string; sub: string; icon: any; tone: Tone; avg?: string }[] = [
    { label: "Total Active SKUs",    value: kpis?.totalActiveSkus.toLocaleString() ?? "—",  sub: "+32 this week",            icon: Boxes,      tone: "info",    avg: "AVG: 8,859" },
    { label: "Revenue Lift",         value: kpis ? `+${kpis.revenueLiftPct.toFixed(1)}%` : "—", sub: "vs. baseline pricing",  icon: TrendingUp, tone: "success", avg: "AVG: +9.4%" },
    { label: "Engine Priced Today",  value: kpis?.enginePricedToday.toLocaleString() ?? "—", sub: "calls · last 24h",         icon: Package,    tone: "violet",  avg: "AVG: 5.2k"  },
    { label: "API Latency",          value: kpis ? `${kpis.apiLatencyMs}ms` : "—",            sub: "p95 under 80ms",          icon: Zap,        tone: "warning", avg: "AVG: 52ms"  },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((it) => {
        const t = toneMap[it.tone];
        return (
          <div
            key={it.label}
            className={`relative overflow-hidden rounded-xl ${t.bg} p-5 ring-1 ${t.ring} transition-transform hover:-translate-y-0.5`}
          >
            <div className="mb-3 flex items-start justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {it.avg}
              </span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${t.chip} shadow-md`}>
                <it.icon className="h-4 w-4" strokeWidth={2.5} />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <p className={`text-3xl font-bold tracking-tight tabular-nums ${it.tone === "success" ? "text-success" : "text-foreground"}`}>
                {it.value}
              </p>
            )}
            <p className="mt-1 text-sm font-medium text-foreground/80">{it.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{it.sub}</p>
          </div>
        );
      })}
    </div>
  );
}

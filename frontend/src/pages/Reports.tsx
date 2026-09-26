import { useEffect, useState } from "react";
import { TopNav } from "@/components/dashboard/TopNav";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { fetchReports, type ReportsPayload } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ShieldAlert, History, Activity } from "lucide-react";

const fmt = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });

const Reports = () => {
  const [data, setData] = useState<ReportsPayload>({ telemetry: [], recentOrders: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = () => {
      fetchReports().then((d) => {
        if (mounted) {
          setData(d);
          setLoading(false);
        }
      });
    };

    load();
    const intervalId = setInterval(load, 20000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const guardrailCount = data.telemetry.filter((t) => t.status.includes("Guardrail")).length;

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="flex-1 px-6 py-6 lg:px-8">
          <div className="mx-auto max-w-[1400px] space-y-6">
            <div>
              <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
                Pricing Logs, Telemetry & Store Orders
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Real-time audit trail of reinforcement learning agent steps, guardrail decisions, and storefront orders.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Logged Pricing Events</span>
                  <History className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
                  {data.telemetry.length} events
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Historical telemetry records</div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Storefront Purchases</span>
                  <ShoppingCart className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 font-mono">
                  {data.recentOrders.length} orders
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Live customer checkouts</div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Guardrail Enforcements</span>
                  <ShieldAlert className="h-4 w-4 text-warning" />
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-warning font-mono">
                  {guardrailCount} active
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Protected min margin & dampening</div>
              </div>
            </div>

            {/* Recent Storefront Orders */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-emerald-600" />
                <h2 className="text-base font-semibold text-foreground">Recent Storefront Customer Orders</h2>
              </div>
              <div className="rounded-xl border border-border bg-card shadow-card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface/60 text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-5 py-3 text-left font-medium">Order ID</th>
                      <th className="px-4 py-3 text-left font-medium">Product</th>
                      <th className="px-4 py-3 text-right font-medium">Qty</th>
                      <th className="px-4 py-3 text-right font-medium">Unit Price</th>
                      <th className="px-4 py-3 text-right font-medium">Total Price</th>
                      <th className="px-4 py-3 text-left font-medium">Buyer</th>
                      <th className="px-5 py-3 text-right font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-muted-foreground">Loading orders...</td>
                      </tr>
                    ) : data.recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-xs text-muted-foreground">
                          No orders placed yet. Head over to the Amazon Storefront and click "Buy Now" or "Simulate Demand Spike"!
                        </td>
                      </tr>
                    ) : (
                      data.recentOrders.map((o) => (
                        <tr key={o.id} className="border-b border-border hover:bg-surface/50">
                          <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">#{o.id}</td>
                          <td className="px-4 py-3.5 font-medium text-foreground">
                            {o.productName} <span className="font-mono text-xs text-muted-foreground">({o.productId})</span>
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums">{o.quantity}</td>
                          <td className="px-4 py-3.5 text-right tabular-nums">{fmt(o.unitPrice)}</td>
                          <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-foreground">
                            {fmt(o.totalPrice)}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-muted-foreground">{o.customer}</td>
                          <td className="px-5 py-3.5 text-right text-xs text-muted-foreground font-mono">
                            {o.timestamp}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pricing Engine Telemetry Logs */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Algorithmic Telemetry Logs</h2>
              </div>
              <div className="rounded-xl border border-border bg-card shadow-card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface/60 text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-5 py-3 text-left font-medium">Log ID</th>
                      <th className="px-4 py-3 text-left font-medium">SKU</th>
                      <th className="px-4 py-3 text-right font-medium">Inventory</th>
                      <th className="px-4 py-3 text-right font-medium">Competitor</th>
                      <th className="px-4 py-3 text-right font-medium">AI Price</th>
                      <th className="px-4 py-3 text-left font-medium">Guardrail / Status</th>
                      <th className="px-4 py-3 text-left font-medium">Reasoning</th>
                      <th className="px-5 py-3 text-right font-medium">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-muted-foreground">Loading telemetry...</td>
                      </tr>
                    ) : (
                      data.telemetry.map((log) => {
                        const isGuardrail = log.status.includes("Guardrail");
                        return (
                          <tr key={log.id} className="border-b border-border hover:bg-surface/50">
                            <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">#{log.id}</td>
                            <td className="px-4 py-3.5 font-mono text-xs font-semibold">{log.productId}</td>
                            <td className="px-4 py-3.5 text-right tabular-nums">{log.inventory.toLocaleString()}</td>
                            <td className="px-4 py-3.5 text-right tabular-nums text-muted-foreground">
                              {fmt(log.competitor_price)}
                            </td>
                            <td className="px-4 py-3.5 text-right font-semibold text-foreground tabular-nums">
                              {fmt(log.suggested_price)}
                            </td>
                            <td className="px-4 py-3.5 text-xs">
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 font-semibold text-[11px] ${
                                  isGuardrail
                                    ? "bg-warning/15 text-warning-foreground"
                                    : "bg-success-soft text-success"
                                }`}
                              >
                                {log.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-xs truncate">
                              {log.reason}
                            </td>
                            <td className="px-5 py-3.5 text-right text-xs text-muted-foreground font-mono">
                              {log.timestamp}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;

import { useEffect, useState } from "react";
import { TopNav } from "@/components/dashboard/TopNav";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { fetchReports, rollbackPrice, type ReportsPayload, type TelemetryLog } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ShieldAlert, History, Activity, Undo2, Check } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });

const Reports = () => {
  const [data, setData] = useState<ReportsPayload>({ telemetry: [], recentOrders: [] });
  const [loading, setLoading] = useState(true);
  const [rollingBackId, setRollingBackId] = useState<number | null>(null);

  const loadData = () => {
    fetchReports().then((d) => {
      setData(d);
      setLoading(false);
    });
  };

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

  const handleRollback = async (log: TelemetryLog) => {
    setRollingBackId(log.id);
    try {
      const res = await rollbackPrice(log.productId, log.id);
      toast.success("Price Change Rolled Back!", {
        description: res.message || `Reverted ${log.productId} back to prior price.`
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to rollback price");
    } finally {
      setRollingBackId(null);
    }
  };

  const guardrailCount = data.telemetry.filter((t) => t.status.includes("Guardrail")).length;
  const reversibleCount = data.telemetry.filter((t) => t.canRollback).length;

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
                Real-time audit trail of reinforcement learning agent steps, policy shifts, guardrail decisions, and storefront orders with 1-click price reversibility.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
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

              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Reversible Pricing Events</span>
                  <Undo2 className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-primary font-mono">
                  {reversibleCount} eligible
                </div>
                <div className="mt-1 text-xs text-muted-foreground">1-Click instant price rollback</div>
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

            {/* Pricing Engine Telemetry Logs with Rollback Controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Algorithmic Telemetry Logs & Audit Trail</h2>
              </div>
              <div className="rounded-xl border border-border bg-card shadow-card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface/60 text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-5 py-3 text-left font-medium">Log ID</th>
                      <th className="px-4 py-3 text-left font-medium">SKU</th>
                      <th className="px-4 py-3 text-right font-medium">Inventory</th>
                      <th className="px-4 py-3 text-right font-medium">Competitor</th>
                      <th className="px-4 py-3 text-right font-medium">Price</th>
                      <th className="px-4 py-3 text-left font-medium">Guardrail / Status</th>
                      <th className="px-4 py-3 text-left font-medium">Reasoning</th>
                      <th className="px-4 py-3 text-right font-medium">Timestamp</th>
                      <th className="px-5 py-3 text-center font-medium">Reversibility</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="p-4 text-center text-muted-foreground">Loading telemetry...</td>
                      </tr>
                    ) : (
                      data.telemetry.map((log) => {
                        const isGuardrail = log.status.includes("Guardrail");
                        const isRollback = log.isRollback || log.status.includes("Rollback");

                        return (
                          <tr key={log.id} className="border-b border-border hover:bg-surface/50">
                            <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">#{log.id}</td>
                            <td className="px-4 py-3.5 font-mono text-xs font-semibold">{log.productId}</td>
                            <td className="px-4 py-3.5 text-right tabular-nums">{log.inventory.toLocaleString()}</td>
                            <td className="px-4 py-3.5 text-right tabular-nums text-muted-foreground">
                              {fmt(log.competitor_price)}
                            </td>
                            <td className="px-4 py-3.5 text-right font-semibold text-foreground tabular-nums">
                              {fmt(log.appliedPrice ?? log.suggested_price)}
                            </td>
                            <td className="px-4 py-3.5 text-xs">
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 font-semibold text-[11px] ${
                                  isRollback
                                    ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                                    : isGuardrail
                                    ? "bg-warning/15 text-warning-foreground"
                                    : "bg-success-soft text-success"
                                }`}
                              >
                                {log.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-xs truncate" title={log.reason}>
                              {log.reason}
                            </td>
                            <td className="px-4 py-3.5 text-right text-xs text-muted-foreground font-mono whitespace-nowrap">
                              {log.timestamp}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {log.canRollback && !isRollback ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRollback(log)}
                                  disabled={rollingBackId === log.id}
                                  className="h-7 px-2.5 text-xs gap-1 border-border text-muted-foreground hover:text-foreground"
                                  title={`Revert back to prior ${fmt(log.previousPrice ?? 0)}`}
                                >
                                  <Undo2 className={`h-3 w-3 ${rollingBackId === log.id ? "animate-spin" : ""}`} />
                                  Rollback
                                </Button>
                              ) : isRollback ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                                  <Check className="h-3 w-3 text-emerald-500" />
                                  Reverted
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground/60">—</span>
                              )}
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

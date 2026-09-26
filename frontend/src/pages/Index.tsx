import { useEffect, useState } from "react";
import { TopNav } from "@/components/dashboard/TopNav";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { PricingTable } from "@/components/dashboard/PricingTable";
import { ElasticityChart } from "@/components/dashboard/ElasticityChart";
import { fetchDashboard, type DashboardPayload, type Product } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Download, ShoppingBag, Sliders, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const handleExport = () => {
    if (!data?.products) return;
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Product ID,Name,Category,Stock,Current Price,Competitor Price,AI Suggested Price\n" +
      data.products
        .map(
          (p: any) =>
            `${p.id},"${p.name}",${p.category},${p.stock},${p.currentPrice},${p.competitorPrice},${p.aiSuggestedPrice}`
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "full_pricing_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProductsUpdate = (updatedProducts: Product[]) => {
    if (data) {
      setData({
        ...data,
        products: updatedProducts,
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    const load = () => {
      fetchDashboard().then((d) => {
        if (mounted) {
          setData(d);
          setLoading(false);
        }
      });
    };

    load();
    const intervalId = setInterval(load, 25000); // 25s polling

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="flex-1 px-6 py-6 lg:px-8">
          <div className="mx-auto max-w-[1400px] space-y-6">
            {/* Header with Quick Actions */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
                  Enterprise Pricing Engine
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reinforcement Learning (PPO) Dynamic Pricing across active catalog.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link to="/store">
                  <Button variant="default" size="sm" className="h-9 gap-1.5 bg-[#febd69] hover:bg-[#f3a847] text-slate-900 font-bold shadow-xs">
                    <ShoppingBag className="h-4 w-4" />
                    Open Amazon Storefront
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </Button>
                </Link>
                <Link to="/what-if">
                  <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <Sliders className="h-4 w-4 text-primary" />
                    What-If Simulator
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <KpiCards kpis={data?.kpis ?? null} loading={loading} />

            {/* Elasticity Chart */}
            <ElasticityChart data={data?.elasticity ?? []} loading={loading} />

            {/* Pricing Table */}
            <PricingTable 
              products={data?.products ?? []} 
              loading={loading} 
              onProductsUpdate={handleProductsUpdate}
            />

            <footer className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
              <span>© 2026 PricingBrain, Inc. Autonomous Dynamic Pricing System.</span>
              <div className="flex gap-4">
                <Link to="/store" className="hover:text-foreground">Amazon Storefront</Link>
                <Link to="/what-if" className="hover:text-foreground">What-If Simulator</Link>
                <Link to="/reports" className="hover:text-foreground">Telemetry & Logs</Link>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;

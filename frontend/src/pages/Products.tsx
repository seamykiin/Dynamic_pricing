import { useEffect, useState } from "react";
import { TopNav } from "@/components/dashboard/TopNav";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { PricingTable } from "@/components/dashboard/PricingTable";
import { fetchDashboard, createProduct, type DashboardPayload } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Products = () => {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "", category: "", stock: 0, currentPrice: 0, competitorPrice: 0, margin: 0 });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct(formData);
      toast.success("Product created!");
      setOpen(false);
      // Re-fetch to update table
      setLoading(true);
      const updatedData = await fetchDashboard();
      setData(updatedData);
      setLoading(false);
    } catch (err) {
      toast.error("Failed to create product");
    }
  };

  const handleExport = () => {
    if (!data?.products) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Product ID,Name,Category,Stock,Current Price,Competitor Price,AI Suggested Price\n"
      + data.products.map((p: any) => `${p.id},"${p.name}",${p.category},${p.stock},${p.currentPrice},${p.competitorPrice},${p.aiSuggestedPrice}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "products_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    const intervalId = setInterval(load, 30000);

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
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
                  Product Catalog
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your inventory and apply AI-driven pricing strategies.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-9 gap-1.5">
                      <Plus className="h-4 w-4" />
                      New Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Product ID</Label>
                          <Input required value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} placeholder="SKU-123" />
                        </div>
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Widget" />
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Input required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Hardware" />
                        </div>
                        <div className="space-y-2">
                          <Label>Stock</Label>
                          <Input required type="number" value={formData.stock || ""} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Current Price (₹)</Label>
                          <Input required type="number" step="0.01" value={formData.currentPrice || ""} onChange={e => setFormData({...formData, currentPrice: Number(e.target.value)})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Competitor Price (₹)</Label>
                          <Input required type="number" step="0.01" value={formData.competitorPrice || ""} onChange={e => setFormData({...formData, competitorPrice: Number(e.target.value)})} />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label>Margin (%)</Label>
                          <Input required type="number" step="0.1" value={formData.margin || ""} onChange={e => setFormData({...formData, margin: Number(e.target.value)})} />
                        </div>
                      </div>
                      <Button type="submit" className="w-full">Create Product</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <PricingTable 
              products={data?.products ?? []} 
              loading={loading} 
              onProductsUpdate={(updated) => setData(d => d ? { ...d, products: updated } : null)} 
            />

            <footer className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
              <span>© 2026 PricingBrain, Inc. All rights reserved.</span>
              <div className="flex gap-4">
                <a href="#" className="hover:text-foreground">Privacy Policy</a>
                <a href="#" className="hover:text-foreground">Terms of Service</a>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Products;

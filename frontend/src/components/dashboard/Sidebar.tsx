import { 
  LayoutDashboard, Package2, BarChart3, ShoppingBag, 
  Sliders, ShieldAlert, Settings, Brain 
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";

const items = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: ShoppingBag, label: "Amazon Storefront", path: "/store", badge: "Live" },
  { icon: Sliders, label: "What-If Simulator", path: "/what-if", badge: "AI" },
  { icon: Package2, label: "Products Catalog", path: "/products" },
  { icon: BarChart3, label: "Telemetry & Logs", path: "/reports" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sticky top-0 hidden h-screen w-[72px] flex-col items-center justify-between border-r border-border bg-card py-5 lg:flex">
      <div className="flex flex-col items-center gap-1.5">
        <Link to="/" className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-elevated">
          <Brain className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
        </Link>
        {items.map((it) => {
          const isActive = location.pathname === it.path;
          return (
            <Link
              key={it.label}
              to={it.path}
              title={it.label}
              className={
                "group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all " +
                (isActive
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground")
              }
            >
              <it.icon className="h-[18px] w-[18px]" />
              {isActive && (
                <span className="absolute -left-[1px] top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              {it.badge && (
                <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-[8px] font-bold text-primary-foreground">
                  {it.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <div className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground [writing-mode:vertical-rl]">
        PB · v2.0
      </div>
    </aside>
  );
}

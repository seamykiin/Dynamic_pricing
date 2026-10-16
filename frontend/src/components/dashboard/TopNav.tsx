import { Brain, Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2.5 transition-all group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-elevated group-hover:scale-105 transition-transform">
              <Brain className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-black tracking-tight text-foreground">Tensor <span className="text-primary">Margin</span></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dynamic Pricing</span>
            </div>
          </a>
        </div>

        <div className="hidden flex-1 max-w-md px-8 md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search SKUs, categories, customers…"
              className="h-9 border-border bg-surface pl-9 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            Project Overview
          </a>

          <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>

          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
              TM
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

import { Brain, Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-elevated">
            <Brain className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-foreground">PricingBrain</span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">B2B Engine</span>
          </div>
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

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border border-success/20 bg-success-soft px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success glow-success animate-pulse-dot" />
            </span>
            <span className="text-xs font-semibold text-success">AI Engine: Online</span>
          </div>

          <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>

          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
              JM
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

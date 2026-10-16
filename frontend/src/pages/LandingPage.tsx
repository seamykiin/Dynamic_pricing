import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

type IconName =
  | "arrow"
  | "bolt"
  | "brain"
  | "chart"
  | "check"
  | "chevron"
  | "code"
  | "database"
  | "layers"
  | "menu"
  | "play"
  | "shield"
  | "spark"
  | "target"
  | "users"
  | "x";

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    bolt: <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" />,
    brain: (
      <>
        <path d="M9.5 4.5A3 3 0 0 0 4 6.2a3 3 0 0 0-1 5.8 3 3 0 0 0 3 5 3 3 0 0 0 5.5 1.7V5.3a3 3 0 0 0-2-2.8Z" />
        <path d="M14.5 4.5A3 3 0 0 1 20 6.2a3 3 0 0 1 1 5.8 3 3 0 0 1-3 5 3 3 0 0 1-5.5 1.7V5.3a3 3 0 0 1 2-2.8ZM7 9.5c1.5 0 2.5 1 2.5 2.5M17 9.5c-1.5 0-2.5 1-2.5 2.5" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V9m6 10V5m6 14v-7m4 7H2" />
        <path d="m4 8 6-4 6 7 4-3" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    code: <path d="m8 9-4 3 4 3m8-6 4 3-4 3m-2-9-4 12" />,
    database: (
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
      </>
    ),
    layers: (
      <>
        <path d="m12 2 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    play: <path d="m9 7 8 5-8 5V7Z" />,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Zm-3-10 2 2 4-4" />,
    spark: <path d="m12 2 1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2Zm7 14 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />,
    target: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    x: <path d="m6 6 12 12M18 6 6 18" />,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function Logo() {
  return (

      <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
        Tensor <span className="text-blue-600">Margin</span>
      </span>
  );
}

function ButtonLink({
  children,
  variant = "dark",
  to = "/dashboard",
  className = "",
}: {
  children: ReactNode;
  variant?: "dark" | "lime" | "light";
  to?: string;
  className?: string;
}) {
  const variants = {
    dark: "bg-slate-950 text-white hover:bg-slate-800",
    lime: "bg-blue-300 text-slate-950 hover:bg-blue-200",
    light: "bg-white text-slate-950 ring-1 ring-slate-200 hover:bg-slate-50",
  };

  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition duration-200 hover:-translate-y-0.5 ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

const metrics = [
  { value: "+18.4%", label: "Margin uplift", tone: "text-emerald-600" },
  { value: "₹1.24 Cr", label: "Revenue captured", tone: "text-slate-950" },
  { value: "94.2%", label: "Win probability", tone: "text-slate-950" },
];

const features = [
  {
    icon: "spark" as IconName,
    number: "01",
    title: "AI price recommendations",
    copy: "Turn live demand, inventory, and competitor signals into explainable prices your team can trust.",
  },
  {
    icon: "target" as IconName,
    number: "02",
    title: "Segment-level precision",
    copy: "Set smarter guardrails by product, customer tier, region, contract type, or any dimension that matters.",
  },
  {
    icon: "chart" as IconName,
    number: "03",
    title: "Measure every outcome",
    copy: "Track margin, conversion, and revenue impact with clean attribution from recommendation to closed deal.",
  },
];

const modules = [
  {
    icon: "database" as IconName,
    title: "Unified data layer",
    copy: "Normalizes product, transaction, customer, competitor, and inventory data into one analysis-ready model.",
    tag: "Data engineering",
  },
  {
    icon: "brain" as IconName,
    title: "Prediction engine",
    copy: "Estimates demand response and win probability to identify the strongest price for every commercial context.",
    tag: "Machine learning",
  },
  {
    icon: "shield" as IconName,
    title: "Business guardrails",
    copy: "Applies margin floors, approval rules, contract constraints, and confidence thresholds before recommendations ship.",
    tag: "Decision controls",
  },
  {
    icon: "users" as IconName,
    title: "Role-based workspace",
    copy: "Gives pricing teams, sales leaders, and executives the right views, actions, and performance signals.",
    tag: "Product design",
  },
  {
    icon: "chart" as IconName,
    title: "Experiment tracking",
    copy: "Compares recommended and accepted prices so every outcome improves the next optimization cycle.",
    tag: "Analytics",
  },
  {
    icon: "code" as IconName,
    title: "Integration API",
    copy: "Connects recommendations to CRM, ERP, and CPQ workflows without replacing the systems teams already use.",
    tag: "System integration",
  },
];

function PricingDashboard() {
  const [mode, setMode] = useState<"recommended" | "current">("recommended");
  const recommended = mode === "recommended";

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="absolute -inset-4 rotate-2 rounded-4xl bg-blue-300/40 blur-2xl" />
      <div className="relative overflow-hidden rounded-4xl border border-white/70 bg-white p-3 shadow-2xl shadow-slate-950/15">
        <div className="rounded-3xl bg-slate-950 p-5 text-white sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Pricing cockpit</div>
              <div className="mt-1 text-lg font-bold">Enterprise portfolio</div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1.5 text-xs text-slate-300">
              <span className="size-2 rounded-full bg-blue-300 ring-4 ring-blue-300/15" />
              Live signals
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl bg-white p-3 text-slate-950 sm:p-4">
                <div className={`text-lg font-extrabold sm:text-2xl ${metric.tone}`}>{metric.value}</div>
                <div className="mt-1 text-xs font-medium text-slate-500">{metric.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-2xl bg-white p-4 text-slate-950 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold">Price performance</div>
                <div className="mt-1 text-xs text-slate-500">Revenue indexed to baseline</div>
              </div>
              <div className="flex rounded-full bg-slate-100 p-1 text-xs font-bold">
                <button
                  className={`rounded-full px-3 py-1.5 transition ${recommended ? "bg-slate-950 text-white" : "text-slate-500"}`}
                  onClick={() => setMode("recommended")}
                >
                  Optimized
                </button>
                <button
                  className={`rounded-full px-3 py-1.5 transition ${!recommended ? "bg-slate-950 text-white" : "text-slate-500"}`}
                  onClick={() => setMode("current")}
                >
                  Current
                </button>
              </div>
            </div>

            <div className="relative mt-6 h-36">
              <div className="absolute inset-0 flex flex-col justify-between">
                {[0, 1, 2, 3].map((line) => (
                  <span key={line} className="block border-t border-dashed border-slate-200" />
                ))}
              </div>
              <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 480 140" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-blue-300)" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="var(--color-blue-300)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  className="transition-all duration-500"
                  d={
                    recommended
                      ? "M0 117 C55 105 65 110 115 84 S185 94 235 58 S320 65 365 39 S430 48 480 12 V140 H0 Z"
                      : "M0 118 C55 110 68 116 115 98 S180 106 235 82 S320 90 365 73 S435 78 480 55 V140 H0 Z"
                  }
                  fill="url(#chartFill)"
                />
                <path
                  className="transition-all duration-500"
                  d={
                    recommended
                      ? "M0 117 C55 105 65 110 115 84 S185 94 235 58 S320 65 365 39 S430 48 480 12"
                      : "M0 118 C55 110 68 116 115 98 S180 106 235 82 S320 90 365 73 S435 78 480 55"
                  }
                  fill="none"
                  stroke="var(--color-blue-600)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute right-2 top-0 rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-white shadow-lg">
                {recommended ? "+18.4%" : "+6.1%"}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-2xl bg-blue-300 p-4 text-slate-950">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-blue-300">
                <Icon name="spark" className="size-4" />
              </span>
              <div>
                <div className="text-sm font-extrabold">12 opportunities found</div>
                <div className="text-xs text-slate-700">Potential impact: ₹28,49,000</div>
              </div>
            </div>
            <Link to="/dashboard" className="grid size-8 place-items-center rounded-full bg-white/70 hover:bg-white">
              <Icon name="chevron" className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-hidden bg-stone-50 text-slate-950">
      <header className="relative z-50 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex" aria-label="Main navigation">
          <a className="transition hover:text-slate-950" href="#platform">Overview</a>
          <a className="transition hover:text-slate-950" href="#modules">Modules</a>
          <a className="transition hover:text-slate-950" href="#solutions">Workflow</a>
          <a className="transition hover:text-slate-950" href="#results">Evaluation</a>
          <Link className="transition hover:text-slate-950 font-bold text-amber-600" to="/store">Storefront</Link>
          <Link className="transition hover:text-slate-950 font-bold text-primary" to="/ai-pricing">AI Pricing</Link>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/store" className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-slate-950">
            Storefront
          </Link>
          <ButtonLink to="/dashboard">Open dashboard <Icon name="arrow" className="size-4" /></ButtonLink>
        </div>
        <button
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="grid size-11 place-items-center rounded-full bg-white ring-1 ring-slate-200 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Icon name={menuOpen ? "x" : "menu"} />
        </button>
        {menuOpen && (
          <div className="absolute left-5 right-5 top-20 rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-slate-200 md:hidden">
            <nav className="flex flex-col gap-1 text-base font-bold">
              {[
                ["Overview", "#platform"],
                ["Modules", "#modules"],
                ["Workflow", "#solutions"],
                ["Evaluation", "#results"],
              ].map(([label, target]) => (
                <a key={label} href={target} className="rounded-xl px-3 py-3 hover:bg-slate-50">
                  {label}
                </a>
              ))}
              <Link to="/store" className="rounded-xl px-3 py-3 hover:bg-slate-50 text-amber-600">Amazon Storefront</Link>
              <Link to="/ai-pricing" className="rounded-xl px-3 py-3 hover:bg-slate-50 text-primary">AI Pricing Hub</Link>
              <Link to="/what-if" className="rounded-xl px-3 py-3 hover:bg-slate-50">What-If Simulator</Link>
              <Link to="/reports" className="rounded-xl px-3 py-3 hover:bg-slate-50">Telemetry & Logs</Link>
            </nav>
            <ButtonLink to="/dashboard" className="mt-4 w-full">Open dashboard <Icon name="arrow" className="size-4" /></ButtonLink>
          </div>
        )}
      </header>

      <main>
        <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:px-10 lg:pb-28">
          <div className="absolute -left-56 top-8 size-96 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="absolute -right-56 top-40 size-96 rounded-full bg-cyan-100/50 blur-3xl" />
          <div className="relative grid items-center gap-16 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-blue-200 bg-white/90 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-blue-900 shadow-sm backdrop-blur">
                <span className="size-2 rounded-full bg-blue-600 animate-pulse" />
                <span>Tensor Margin Dynamic Pricing · 2026</span>
              </div>
              <h1 className="max-w-3xl text-5xl font-black leading-none tracking-tighter text-slate-950 sm:text-6xl lg:text-7xl">
                Find the right price.{" "}
                <span className="relative inline-block">
                  Every time.
                  <span className="absolute -bottom-2 left-0 h-2 w-full -rotate-1 rounded-full bg-blue-300" />
                </span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
                An end-to-end decision intelligence platform that uses machine learning, market signals, and explainable recommendations to optimize complex B2B pricing.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonLink variant="dark" to="/dashboard" className="px-7 py-4">
                  Explore the dashboard <Icon name="arrow" className="size-4" />
                </ButtonLink>
                <ButtonLink variant="light" to="/store" className="px-7 py-4">
                  <span className="grid size-6 place-items-center rounded-full bg-blue-300">
                    <Icon name="play" className="size-3.5" />
                  </span>
                  Live Storefront
                </ButtonLink>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-500">
                <span className="flex items-center gap-2"><Icon name="check" className="size-4 text-blue-600" /> Full-stack prototype</span>
                <span className="flex items-center gap-2"><Icon name="check" className="size-4 text-blue-600" /> Explainable AI workflow</span>
                <span className="flex items-center gap-2"><Icon name="check" className="size-4 text-blue-600" /> Amazon Storefront integration</span>
              </div>
            </div>
            <PricingDashboard />
          </div>
        </section>

        <section className="border-y border-slate-200/80 bg-white py-8" aria-label="Project highlights">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-7 px-5 sm:px-8 lg:grid-cols-4 lg:px-10">
            {[
              ["06", "Core product modules"],
              ["05", "Connected data sources"],
              ["03", "User roles supported"],
              ["24/7", "Continuous monitoring"],
            ].map(([value, label], index) => (
              <div key={label} className={`px-4 text-center ${index > 0 ? "border-l border-slate-200" : ""}`}>
                <div className="text-2xl font-black tracking-tight text-slate-950">{value}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="platform" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-widest text-blue-700">The platform</div>
              <h2 className="mt-5 max-w-lg text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Your pricing strategy, finally in motion.
              </h2>
              <p className="mt-5 max-w-md text-lg leading-8 text-slate-600">
                Replace spreadsheets and guesswork with one connected system built for complex B2B pricing.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature, index) => (
                <article
                  key={feature.title}
                  className={`group rounded-3xl border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    index === 0
                      ? "border-slate-950 bg-slate-950 text-white sm:col-span-2"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`grid size-12 place-items-center rounded-2xl ${index === 0 ? "bg-blue-300 text-slate-950" : "bg-blue-100 text-blue-800"}`}>
                      <Icon name={feature.icon} />
                    </span>
                    <span className={`text-xs font-bold ${index === 0 ? "text-slate-500" : "text-slate-300"}`}>{feature.number}</span>
                  </div>
                  <h3 className="mt-8 text-xl font-extrabold">{feature.title}</h3>
                  <p className={`mt-3 max-w-xl leading-7 ${index === 0 ? "text-slate-400" : "text-slate-600"}`}>{feature.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="modules" className="border-y border-slate-200 bg-white py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-widest text-blue-700">End-to-end system scope</div>
                <h2 className="mt-5 max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                  More than a model. A complete working product.
                </h2>
              </div>
              <p className="max-w-md text-lg leading-8 text-slate-600">
                Tensor Margin covers the entire journey from raw commercial data to governed recommendations and measurable business outcomes.
              </p>
            </div>

            <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {modules.map((module, index) => (
                <article key={module.title} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-stone-50 p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-slate-950/5">
                  <div className="flex items-center justify-between">
                    <span className="grid size-12 place-items-center rounded-2xl bg-slate-950 text-blue-300 transition group-hover:bg-blue-300 group-hover:text-slate-950">
                      <Icon name={module.icon} />
                    </span>
                    <span className="text-xs font-black text-slate-300">0{index + 1}</span>
                  </div>
                  <div className="mt-8 text-xs font-extrabold uppercase tracking-wider text-blue-700">{module.tag}</div>
                  <h3 className="mt-3 text-xl font-extrabold">{module.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{module.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="solutions" className="bg-slate-950 py-24 text-white lg:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-24">
              <div className="relative rounded-4xl bg-slate-900 p-6 sm:p-8">
                <div className="absolute -left-4 -top-4 grid size-12 place-items-center rounded-2xl bg-blue-300 text-slate-950">
                  <Icon name="layers" />
                </div>
                <div className="mb-7 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold">Recommendation feed</div>
                    <div className="mt-1 text-xs text-slate-500">Prioritized by business impact</div>
                  </div>
                  <span className="rounded-full bg-blue-300/10 px-3 py-1.5 text-xs font-bold text-blue-300">8 new</span>
                </div>
                <div className="space-y-3">
                  {[
                    ["Industrial valves", "Raise 3.8%", "+₹82.4K"],
                    ["Safety equipment", "Raise 2.1%", "+₹41.7K"],
                    ["Hydraulic pumps", "Hold price", "₹0"],
                  ].map(([product, action, impact], index) => (
                    <div key={product} className="flex items-center gap-4 rounded-2xl bg-slate-800/80 p-4">
                      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${index === 2 ? "bg-slate-700 text-slate-400" : "bg-blue-300/10 text-blue-300"}`}>
                        <Icon name={index === 2 ? "shield" : "chart"} className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold">{product}</div>
                        <div className="mt-1 text-xs text-slate-400">{action}</div>
                      </div>
                      <div className={`text-sm font-extrabold ${index === 2 ? "text-slate-500" : "text-blue-300"}`}>{impact}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-extrabold uppercase tracking-widest text-blue-300">Built for action</div>
                <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">From data to decision in one flow.</h2>
                <p className="mt-6 text-lg leading-8 text-slate-400">
                  Tensor Margin connects to your existing stack, learns how your market behaves, and puts the next-best action directly in your team's workflow.
                </p>
                <div className="mt-9 space-y-5">
                  {[
                    ["Connect your data", "ERP, CRM, CPQ, transaction, and market signals."],
                    ["Set your guardrails", "Keep every recommendation aligned with your strategy."],
                    ["Scale what works", "Push approved pricing to every channel and sales team."],
                  ].map(([title, copy], index) => (
                    <div key={title} className="flex gap-4">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full border border-blue-300/30 bg-blue-300/10 text-xs font-black text-blue-300">
                        {index + 1}
                      </span>
                      <div>
                        <div className="font-extrabold">{title}</div>
                        <div className="mt-1 text-sm leading-6 text-slate-400">{copy}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="results" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="overflow-hidden rounded-4xl bg-blue-300">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
              <div className="p-7 sm:p-12 lg:p-16">
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-widest text-blue-900">Prototype evaluation</div>
                  <h2 className="mt-6 max-w-3xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
                    Built to prove measurable value, not just technical possibility.
                  </h2>
                  <p className="mt-6 max-w-xl text-lg leading-8 text-blue-950/70">
                    The evaluation framework measures recommendation quality, business impact, response time, and user trust across realistic pricing scenarios.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    {["Scenario testing", "Model explainability", "Impact attribution"].map((item) => (
                      <span key={item} className="rounded-full border border-blue-900/20 bg-white/40 px-4 py-2 text-xs font-extrabold text-blue-950">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-6 text-white sm:p-10 lg:grid-cols-1 lg:p-12">
                <div className="rounded-2xl bg-slate-900 p-5">
                  <div className="text-3xl font-black text-blue-300">14.2%</div>
                  <div className="mt-1 text-xs font-bold text-slate-400">Simulated margin uplift</div>
                </div>
                <div className="rounded-2xl bg-slate-900 p-5">
                  <div className="text-3xl font-black text-blue-300">94.2%</div>
                  <div className="mt-1 text-xs font-bold text-slate-400">Prediction confidence</div>
                </div>
                <div className="col-span-2 rounded-2xl bg-slate-900 p-5 lg:col-span-1">
                  <div className="text-3xl font-black text-blue-300">&lt; 2 sec</div>
                  <div className="mt-1 text-xs font-bold text-slate-400">Recommendation response</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="px-5 pb-10 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-4xl bg-slate-950 px-6 py-16 text-center text-white sm:px-12 sm:py-20">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-300 text-slate-950">
              <Icon name="bolt" className="size-7" />
            </div>
            <h2 className="mx-auto mt-7 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">Better pricing starts with better signals.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-400">Explore the complete prototype, system workflow, and decision engine behind Tensor Margin.</p>
            <ButtonLink variant="lime" to="/dashboard" className="mt-8 px-7 py-4">
              View project demo <Icon name="arrow" className="size-4" />
            </ButtonLink>
          </div>
        </section>
      </main>

      <footer id="resources" className="mx-auto max-w-7xl px-5 py-12 text-sm text-slate-500 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-8 border-b border-slate-200 pb-9 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm leading-6">A full-stack dynamic pricing optimization platform developed as a final-year major project.</p>
          </div>
          <div className="flex flex-wrap gap-6 font-semibold">
            <a href="#platform" className="hover:text-slate-950">Overview</a>
            <a href="#modules" className="hover:text-slate-950">Modules</a>
            <a href="#solutions" className="hover:text-slate-950">Workflow</a>
            <a href="#results" className="hover:text-slate-950">Evaluation</a>
            <Link to="/store" className="hover:text-slate-950 text-amber-600">Storefront</Link>
            <Link to="/dashboard" className="hover:text-slate-950">Dashboard</Link>
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>Academic capstone project · 2026</div>
          <div>Research · Design · Engineering · Evaluation</div>
        </div>
      </footer>
    </div>
  );
}

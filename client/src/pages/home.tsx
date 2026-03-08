import {
  ArrowRight,
  Bike,
  CalendarClock,
  CheckCircle2,
  Gauge,
  Plus,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { fetchVehicles } from "@/lib/api";

function km(n: number) {
  return n.toLocaleString("en-IN") + " km";
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card/60 px-4 py-3 shadow-sm backdrop-blur">
      <div className="grid size-10 place-items-center rounded-xl border border-border/80 bg-background/40">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-semibold text-foreground">
          {value}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
  });

  const totalDistance = vehicles.reduce((sum, v) => sum + v.odoKm, 0);
  const nearestService =
    vehicles.length > 0
      ? Math.min(...vehicles.map((v) => Math.max(0, v.nextServiceKm - v.odoKm)))
      : 0;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 rg-grid opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_15%_0%,hsl(var(--primary)/0.20),transparent_60%),radial-gradient(900px_circle_at_85%_20%,hsl(var(--accent)/0.18),transparent_55%),radial-gradient(800px_circle_at_50%_90%,hsl(var(--foreground)/0.06),transparent_60%)]" />

        <header className="relative">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl border border-border/80 bg-card/60 shadow-sm backdrop-blur">
                <Bike className="size-5 text-primary" strokeWidth={2.2} />
              </div>
              <div className="leading-tight">
                <div className="rg-title text-base font-semibold">
                  Thavalam
                </div>
                <div className="text-xs text-muted-foreground">
                  Your vehicles. Your mods. Your service story.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/garage">
                <Button className="bg-primary text-primary-foreground">
                  <span className="hidden md:inline">Open garage</span>
                  <span className="md:hidden">Garage</span>
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="relative mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <div className="rg-noise rounded-[28px] border border-border/70 bg-card/40 p-5 shadow-md backdrop-blur md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/30 px-3 py-1 text-xs font-semibold text-foreground">
                  <Sparkles className="size-3.5 text-primary" />
                  Built for vehicle people
                </div>
                <h1 className="mt-3 rg-title text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl">
                  A super-clear garage for service history, upgrades, and
                  intervals.
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Keep every vehicle's story in one place — services, parts,
                  accessories, and the next interval. Designed to be crisp on
                  mobile, fast to scan, and easy to trust.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Link href="/garage">
                  <Button className="bg-primary text-primary-foreground">
                    <Plus className="mr-2 size-4" />
                    Add a vehicle
                  </Button>
                </Link>
                <Link href="/garage">
                  <Button variant="secondary" className="bg-secondary/60">
                    <Wrench className="mr-2 size-4" />
                    Log maintenance
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatPill
                icon={
                  <CheckCircle2
                    className="size-4 text-primary"
                    strokeWidth={2.2}
                  />
                }
                label="Vehicles"
                value={
                  vehicles.length > 0 ? `${vehicles.length} tracked` : "None yet"
                }
              />
              <StatPill
                icon={
                  <CalendarClock
                    className="size-4 text-primary"
                    strokeWidth={2.2}
                  />
                }
                label="Next interval"
                value={
                  vehicles.length > 0 ? `${km(nearestService)} away` : "—"
                }
              />
              <StatPill
                icon={
                  <Gauge className="size-4 text-primary" strokeWidth={2.2} />
                }
                label="Total distance"
                value={vehicles.length > 0 ? km(totalDistance) : "—"}
              />
              <StatPill
                icon={
                  <Bike className="size-4 text-primary" strokeWidth={2.2} />
                }
                label="Locations"
                value={
                  vehicles.length > 0
                    ? `${new Set(vehicles.map((v) => v.location)).size} cities`
                    : "—"
                }
              />
            </div>

            <div className="mt-8 flex flex-col items-center gap-4 text-center">
              <Link href="/garage">
                <Button
                  size="lg"
                  className="rounded-2xl bg-primary px-8 text-primary-foreground"
                >
                  Open your garage
                  <ArrowRight className="ml-2 size-5" />
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

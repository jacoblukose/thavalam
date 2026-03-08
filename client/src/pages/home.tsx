import {
  AlertTriangle,
  ArrowRight,
  Bike,
  CalendarClock,
  CheckCircle2,
  Gauge,
  Plus,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { fetchCurrentUser, fetchVehicles, fetchAllDocuments } from "@/lib/api";
import type { VehicleDocument } from "@shared/schema";

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
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
    enabled: !!user,
    retry: false,
  });

  const { data: allDocuments = [] } = useQuery({
    queryKey: ["allDocuments"],
    queryFn: fetchAllDocuments,
    enabled: !!user,
    retry: false,
  });

  const totalDistance = vehicles.reduce((sum, v) => sum + v.odoKm, 0);
  const nearestService =
    vehicles.length > 0
      ? Math.min(...vehicles.map((v) => Math.max(0, v.nextServiceKm - v.odoKm)))
      : 0;

  // Documents expiring within 14 days or already expired
  const urgentDocs = allDocuments.filter((doc) => {
    const diffMs = new Date(doc.expiryDate).getTime() - Date.now();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays <= 14;
  }).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  function docLabel(type: string) {
    return type === "insurance" ? "Insurance" : type === "puc" ? "PUC" : type;
  }

  function docUrgencyText(doc: VehicleDocument) {
    const diffMs = new Date(doc.expiryDate).getTime() - Date.now();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: `Expired ${Math.abs(diffDays)}d ago`, expired: true };
    if (diffDays === 0) return { text: "Expires today", expired: true };
    return { text: `${diffDays}d left`, expired: false };
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 rg-grid opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_15%_0%,hsl(var(--primary)/0.20),transparent_60%),radial-gradient(900px_circle_at_85%_20%,hsl(var(--accent)/0.18),transparent_55%),radial-gradient(800px_circle_at_50%_90%,hsl(var(--foreground)/0.06),transparent_60%)]" />

        <header className="relative">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="grid size-11 place-items-center rounded-2xl border border-border/80 bg-card/60 shadow-sm backdrop-blur">
                  <Logo className="size-6 text-primary" />
                </div>
                <div className="leading-tight">
                  <div className="rg-title text-base font-semibold">
                    Thaavalam <span className="ml-1 text-lg font-normal text-muted-foreground" style={{ fontFamily: "'Noto Sans Malayalam', sans-serif" }}>/ താവളം</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Your vehicles. Your mods. Your service story.
                  </div>
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/garage">
                <Button className="bg-primary text-primary-foreground">
                  <span className="hidden md:inline">Open garage</span>
                  <span className="md:hidden">Garage</span>
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="relative flex flex-1 items-center">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="rg-noise rounded-[28px] border border-border/70 bg-card/40 p-6 shadow-md backdrop-blur md:p-10">
              <div className="flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/30 px-3 py-1 text-xs font-semibold text-foreground">
                  <Sparkles className="size-3.5 text-primary" />
                  Built for vehicle people
                </div>
                <h1 className="mt-5 rg-title max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
                  A super-clear garage for service history, upgrades, and
                  intervals.
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                  Keep every vehicle's story in one place — services, parts,
                  accessories, and the next interval. Designed to be crisp on
                  mobile, fast to scan, and easy to trust.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/garage">
                    <Button
                      size="lg"
                      className="rounded-2xl bg-primary px-8 text-primary-foreground"
                    >
                      <Plus className="mr-2 size-5" />
                      Add a vehicle
                    </Button>
                  </Link>
                  <Link href="/garage">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="rounded-2xl bg-secondary/60 px-8"
                    >
                      <Wrench className="mr-2 size-5" />
                      Log maintenance
                    </Button>
                  </Link>
                </div>
              </div>

              {urgentDocs.length > 0 && (
                <div className="mt-8 w-full max-w-2xl mx-auto">
                  <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="size-3.5" />
                      Attention needed
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {urgentDocs.map((doc) => {
                        const v = vehicles.find((v) => v.id === doc.vehicleId);
                        const { text, expired } = docUrgencyText(doc);
                        return (
                          <Link key={doc.id} href="/garage">
                            <div className={
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors hover:bg-amber-500/10 " +
                              (expired
                                ? "border-destructive/40 text-destructive"
                                : "border-amber-500/40 text-amber-600 dark:text-amber-400")
                            }>
                              <ShieldCheck className="size-3" />
                              {v?.nickname ?? "Vehicle"} · {docLabel(doc.type)} · {text}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatPill
                  icon={
                    <CheckCircle2
                      className="size-4 text-primary"
                      strokeWidth={2.2}
                    />
                  }
                  label="Vehicles"
                  value={
                    vehicles.length > 0
                      ? `${vehicles.length} tracked`
                      : "None yet"
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
                    <Gauge
                      className="size-4 text-primary"
                      strokeWidth={2.2}
                    />
                  }
                  label="Total distance"
                  value={vehicles.length > 0 ? km(totalDistance) : "—"}
                />
                <StatPill
                  icon={
                    <Bike
                      className="size-4 text-primary"
                      strokeWidth={2.2}
                    />
                  }
                  label="Locations"
                  value={
                    vehicles.length > 0
                      ? `${new Set(vehicles.map((v) => v.location)).size} cities`
                      : "—"
                  }
                />
              </div>

              <div className="mt-10 flex flex-col items-center gap-4 text-center">
                <Link href="/garage">
                  <Button
                    size="lg"
                    className="rounded-2xl bg-primary px-10 text-primary-foreground"
                  >
                    Open your garage
                    <ArrowRight className="ml-2 size-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

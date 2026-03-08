import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  CalendarClock,
  Car,
  CheckCircle2,
  ChevronLeft,
  MapPin,
  Plus,
  Settings2,
  Sparkles,
  Wrench,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchVehicles, fetchServiceRecords, fetchBuildNotes } from "@/lib/api";
import type { Vehicle, ServiceRecord, BuildNote } from "@shared/schema";

const formatMoney = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR" });

function km(n: number) {
  return n.toLocaleString("en-IN") + " km";
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function serviceProgress(v: Vehicle) {
  const span = Math.max(1, v.nextServiceKm - v.lastServiceKm);
  const done = v.odoKm - v.lastServiceKm;
  const pct = clamp01(done / span) * 100;
  const remaining = Math.max(0, v.nextServiceKm - v.odoKm);
  return { pct, remaining };
}

const mockVehicles: Vehicle[] = [
  {
    id: "gt650",
    nickname: "Weekend Twin",
    model: "Royal Enfield Continental GT 650",
    year: "2022",
    odoKm: 12450,
    lastServiceKm: 10000,
    nextServiceKm: 15000,
    health: 84,
    location: "Bengaluru",
    tags: ["Motorcycle", "Cafe racer", "Touring"],
  },
  {
    id: "duke",
    nickname: "City Knife",
    model: "KTM Duke 390",
    year: "2021",
    odoKm: 18720,
    lastServiceKm: 17500,
    nextServiceKm: 22500,
    health: 76,
    location: "Bengaluru",
    tags: ["Motorcycle", "Street", "Performance"],
  },
  {
    id: "himalayan",
    nickname: "Trail Mule",
    model: "Royal Enfield Himalayan 450",
    year: "2024",
    odoKm: 3620,
    lastServiceKm: 2500,
    nextServiceKm: 5000,
    health: 91,
    location: "Mysuru",
    tags: ["Motorcycle", "ADV", "Off-road"],
  },
  {
    id: "fortuner",
    nickname: "Family Tank",
    model: "Toyota Fortuner 2.8 4x4 AT",
    year: "2020",
    odoKm: 54880,
    lastServiceKm: 50000,
    nextServiceKm: 60000,
    health: 79,
    location: "Chennai",
    tags: ["Car", "SUV", "Touring"],
  },
  {
    id: "swift",
    nickname: "City Sprint",
    model: "Maruti Suzuki Swift ZXi",
    year: "2019",
    odoKm: 67240,
    lastServiceKm: 65000,
    nextServiceKm: 75000,
    health: 73,
    location: "Pune",
    tags: ["Car", "Hatchback", "Daily"],
  },
  {
    id: "creta",
    nickname: "Comfort Cruiser",
    model: "Hyundai Creta 1.5 Petrol IVT",
    year: "2022",
    odoKm: 23810,
    lastServiceKm: 20000,
    nextServiceKm: 30000,
    health: 88,
    location: "Hyderabad",
    tags: ["Car", "SUV", "Family"],
  },
];

const mockHistory: Record<string, ServiceItem[]> = {
  gt650: [
    {
      id: "svc-gt-1",
      title: "Periodic service (10,000 km)",
      date: "07 Sep 2025",
      odometerKm: 10012,
      amount: 3860,
      workshop: "RE Company Store — Indiranagar",
      items: [
        { label: "Engine oil", value: "Motul 7100 10W-50" },
        { label: "Oil filter", value: "Replaced" },
        { label: "Chain", value: "Cleaned + lubed" },
        { label: "Accessories", value: "Bar-end mirrors" },
      ],
    },
    {
      id: "svc-gt-0",
      title: "Paid job: brake pads",
      date: "19 Jun 2025",
      odometerKm: 8720,
      amount: 2450,
      workshop: "Torque Works — HSR",
      items: [
        { label: "Front pads", value: "Sintered" },
        { label: "Brake fluid", value: "DOT 4 bleed" },
        { label: "Check", value: "Rotor inspection" },
      ],
    },
  ],
  duke: [
    {
      id: "svc-dk-1",
      title: "Periodic service",
      date: "03 Oct 2025",
      odometerKm: 17540,
      amount: 4120,
      workshop: "KTM Service — Whitefield",
      items: [
        { label: "Oil", value: "Replaced" },
        { label: "Air filter", value: "Cleaned" },
        { label: "ECU", value: "Diagnostics" },
      ],
    },
  ],
  himalayan: [
    {
      id: "svc-hm-0",
      title: "First service",
      date: "11 Dec 2025",
      odometerKm: 2520,
      amount: 0,
      workshop: "RE Service — Mysuru",
      items: [
        { label: "Oil", value: "Replaced" },
        { label: "Bolt check", value: "Torqued" },
        { label: "Chain", value: "Adjusted" },
      ],
    },
  ],
  fortuner: [
    {
      id: "svc-ft-1",
      title: "Periodic service (50,000 km)",
      date: "22 Aug 2025",
      odometerKm: 50120,
      amount: 9850,
      workshop: "Toyota Service — OMR",
      items: [
        { label: "Engine oil", value: "Replaced" },
        { label: "Oil filter", value: "Replaced" },
        { label: "Brake pads", value: "Inspected" },
        { label: "Wheel alignment", value: "Done" },
      ],
    },
  ],
  swift: [
    {
      id: "svc-sw-1",
      title: "Periodic service (65,000 km)",
      date: "05 Nov 2025",
      odometerKm: 65110,
      amount: 6120,
      workshop: "Maruti Service — Baner",
      items: [
        { label: "Engine oil", value: "Replaced" },
        { label: "Air filter", value: "Replaced" },
        { label: "Battery", value: "Healthy" },
      ],
    },
  ],
  creta: [
    {
      id: "svc-cr-1",
      title: "Periodic service (20,000 km)",
      date: "14 Sep 2025",
      odometerKm: 20040,
      amount: 7350,
      workshop: "Hyundai Service — Gachibowli",
      items: [
        { label: "Engine oil", value: "Replaced" },
        { label: "Cabin filter", value: "Replaced" },
        { label: "AC check", value: "OK" },
      ],
    },
  ],
};

function VehicleTypeIcon({ tags }: { tags: string[] }) {
  const isCar = tags.some((t) => t.toLowerCase() === "car");
  return isCar ? (
    <Car className="size-4 text-primary" strokeWidth={2.2} />
  ) : (
    <Bike className="size-4 text-primary" strokeWidth={2.2} />
  );
}

function VehicleCard({
  v,
  active,
  onSelect,
}: {
  v: Vehicle;
  active: boolean;
  onSelect: () => void;
}) {
  const { pct, remaining } = serviceProgress(v);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "group relative w-full rounded-3xl border p-4 text-left shadow-sm transition-all active:scale-[0.99] md:p-5 " +
        (active
          ? "border-primary/40 bg-gradient-to-b from-card to-card/60"
          : "border-border/80 bg-card/50 hover:border-border hover:bg-card/70")
      }
      data-testid={`card-vehicle-${v.id}`}
    >
      <div className="absolute inset-0 -z-10 rounded-3xl opacity-0 transition-opacity group-hover:opacity-100">
        <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(1000px_circle_at_20%_0%,hsl(var(--primary)/0.10),transparent_60%),radial-gradient(900px_circle_at_80%_30%,hsl(var(--accent)/0.10),transparent_55%)]" />
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="rg-title text-base font-semibold text-foreground md:text-lg"
              data-testid={`text-vehicle-nickname-${v.id}`}
            >
              {v.nickname}
            </div>
            <Badge
              variant={active ? "default" : "secondary"}
              className={
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-foreground"
              }
              data-testid={`badge-vehicle-year-${v.id}`}
            >
              {v.year}
            </Badge>
          </div>
          <div
            className="mt-1 truncate text-sm text-muted-foreground"
            data-testid={`text-vehicle-model-${v.id}`}
          >
            {v.model}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge
            variant="outline"
            className="border-border/70 bg-background/30 text-foreground"
            data-testid={`badge-vehicle-location-${v.id}`}
          >
            <MapPin className="mr-1 size-3.5" />
            {v.location}
          </Badge>
          <div
            className="text-xs font-medium text-muted-foreground"
            data-testid={`text-vehicle-odo-${v.id}`}
          >
            {km(v.odoKm)}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="text-xs font-medium text-muted-foreground">
            Next service in{" "}
            <span
              className="font-semibold text-foreground"
              data-testid={`text-vehicle-remaining-${v.id}`}
            >
              {km(remaining)}
            </span>
          </div>
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold text-foreground"
            data-testid={`text-vehicle-health-${v.id}`}
          >
            <span className="grid size-8 place-items-center rounded-xl border border-border/80 bg-background/30">
              <VehicleTypeIcon tags={v.tags} />
            </span>
            {v.health}%
          </div>
        </div>

        <div className="mt-2">
          <Progress
            value={pct}
            className="h-2.5 bg-secondary/60"
            data-testid={`progress-vehicle-service-${v.id}`}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {v.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border/70 bg-background/30 px-2.5 py-1 text-xs font-medium text-foreground"
              data-testid={`tag-vehicle-${v.id}-${t.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

function ServiceCard({ item }: { item: ServiceItem }) {
  return (
    <Card
      className="rounded-3xl border-border/80 bg-card/50 p-4 shadow-sm backdrop-blur md:p-5"
      data-testid={`card-service-${item.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div
            className="rg-title text-base font-semibold"
            data-testid={`text-service-title-${item.id}`}
          >
            {item.title}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span data-testid={`text-service-date-${item.id}`}>{item.date}</span>
            <span className="text-muted-foreground/40">•</span>
            <span data-testid={`text-service-odo-${item.id}`}>{km(item.odometerKm)}</span>
            <span className="text-muted-foreground/40">•</span>
            <span data-testid={`text-service-workshop-${item.id}`}>{item.workshop}</span>
          </div>
        </div>

        <Badge
          className={
            item.amount === 0
              ? "bg-secondary/60 text-foreground"
              : "bg-primary text-primary-foreground"
          }
          data-testid={`badge-service-amount-${item.id}`}
        >
          {item.amount === 0 ? "Free" : formatMoney(item.amount)}
        </Badge>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {item.items.map((i) => (
          <div
            key={i.label}
            className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/20 px-3 py-2"
            data-testid={`row-service-item-${item.id}-${i.label
              .toLowerCase()
              .replace(/\s+/g, "-")}`}
          >
            <div className="text-xs font-medium text-muted-foreground">{i.label}</div>
            <div className="text-xs font-semibold text-foreground">{i.value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Garage() {
  const [activeId, setActiveId] = useState<string>(mockVehicles[0]?.id ?? "gt650");
  const [search, setSearch] = useState<string>("");

  const vehicles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mockVehicles;
    return mockVehicles.filter(
      (v) =>
        v.nickname.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q) ||
        v.tags.join(" ").toLowerCase().includes(q),
    );
  }, [search]);

  const activeVehicle = useMemo(
    () => mockVehicles.find((v) => v.id === activeId) ?? mockVehicles[0],
    [activeId],
  );

  const history = mockHistory[activeVehicle.id] ?? [];

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
                <div className="rg-title text-base font-semibold" data-testid="text-app-title">
                  Rider Garage
                </div>
                <div className="text-xs text-muted-foreground" data-testid="text-app-subtitle">
                  One interface for all your vehicles.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/" data-testid="link-back-home">
                <Button variant="secondary" className="bg-secondary/60" data-testid="button-back-home">
                  <ChevronLeft className="mr-2 size-4" />
                  Home
                </Button>
              </Link>
              <Button className="bg-primary text-primary-foreground" data-testid="button-add-vehicle">
                <Plus className="mr-2 size-4" />
                Add
              </Button>
            </div>
          </div>
        </header>

        <main className="relative mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <div className="rg-noise rounded-[28px] border border-border/70 bg-card/40 p-5 shadow-md backdrop-blur md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl">
                <div
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/30 px-3 py-1 text-xs font-semibold text-foreground"
                  data-testid="badge-hero-tag"
                >
                  <Sparkles className="size-3.5 text-primary" />
                  Open Garage
                </div>
                <h1
                  className="mt-3 rg-title text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl"
                  data-testid="text-garage-page-title"
                >
                  Your vehicles, organized.
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground" data-testid="text-garage-page-description">
                  Add anything you own or maintain\u2014motorcycles, cars, and more. Track service intervals, history, and build notes in one clean view.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="bg-primary text-primary-foreground" data-testid="button-cta-add-vehicle">
                  <Plus className="mr-2 size-4" />
                  Add vehicle
                </Button>
                <Button variant="secondary" className="bg-secondary/60" data-testid="button-cta-log-service">
                  <Wrench className="mr-2 size-4" />
                  Log service
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Quick stats">
              <div
                className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card/60 px-4 py-3 shadow-sm backdrop-blur"
                data-testid="stat-vehicles"
              >
                <div className="grid size-10 place-items-center rounded-xl border border-border/80 bg-background/40">
                  <BadgeCheck className="size-4 text-primary" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-muted-foreground">Vehicles</div>
                  <div className="truncate text-sm font-semibold text-foreground" data-testid="text-vehicles-count">
                    {mockVehicles.length}
                  </div>
                </div>
              </div>

              <div
                className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card/60 px-4 py-3 shadow-sm backdrop-blur"
                data-testid="stat-next-interval"
              >
                <div className="grid size-10 place-items-center rounded-xl border border-border/80 bg-background/40">
                  <CalendarClock className="size-4 text-primary" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-muted-foreground">Next interval</div>
                  <div className="truncate text-sm font-semibold text-foreground" data-testid="text-next-interval">
                    Due soon
                  </div>
                </div>
              </div>

              <div
                className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card/60 px-4 py-3 shadow-sm backdrop-blur"
                data-testid="stat-verified"
              >
                <div className="grid size-10 place-items-center rounded-xl border border-border/80 bg-background/40">
                  <CheckCircle2 className="size-4 text-primary" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-muted-foreground">Verified logs</div>
                  <div className="truncate text-sm font-semibold text-foreground" data-testid="text-verified-logs">
                    6 services
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <section>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="rg-title text-base font-semibold" data-testid="text-list-title">
                      Vehicle list
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid="text-list-subtitle">
                      Select a vehicle to view its interval and history.
                    </div>
                  </div>

                  <div className="flex flex-1 items-center gap-2 sm:max-w-md">
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search vehicles, tags, city…"
                      className="h-11 rounded-2xl border-border/70 bg-background/30"
                      data-testid="input-search"
                    />
                    <Button
                      variant="secondary"
                      className="h-11 rounded-2xl bg-secondary/60"
                      data-testid="button-filters"
                    >
                      <Settings2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {vehicles.map((v) => (
                    <VehicleCard
                      key={v.id}
                      v={v}
                      active={v.id === activeId}
                      onSelect={() => setActiveId(v.id)}
                    />
                  ))}
                </div>
              </section>

              <aside className="lg:sticky lg:top-6 lg:self-start">
                <motion.div
                  key={activeVehicle.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="rg-noise rounded-[28px] border border-border/70 bg-card/40 p-5 shadow-md backdrop-blur md:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-muted-foreground" data-testid="text-active-label">
                        Selected vehicle
                      </div>
                      <div className="mt-1 rg-title text-xl font-semibold" data-testid="text-active-nickname">
                        {activeVehicle.nickname}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground" data-testid="text-active-model">
                        {activeVehicle.model}
                      </div>
                    </div>

                    <Badge className="bg-primary text-primary-foreground" data-testid="badge-active-health">
                      <CheckCircle2 className="mr-1.5 size-4" />
                      {activeVehicle.health}%
                    </Badge>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <div className="rounded-3xl border border-border/70 bg-background/20 p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-muted-foreground" data-testid="text-interval-title">
                          Service interval
                        </div>
                        <div className="text-xs font-semibold text-foreground" data-testid="text-interval-next">
                          Next at {km(activeVehicle.nextServiceKm)}
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress
                          value={serviceProgress(activeVehicle).pct}
                          className="h-2.5 bg-secondary/60"
                          data-testid="progress-active-interval"
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <div className="text-muted-foreground" data-testid="text-interval-last">
                          Last: {km(activeVehicle.lastServiceKm)}
                        </div>
                        <div className="font-semibold text-foreground" data-testid="text-interval-remaining">
                          {km(serviceProgress(activeVehicle).remaining)} left
                        </div>
                      </div>
                    </div>

                    <Tabs defaultValue="history" className="w-full">
                      <TabsList
                        className="grid w-full grid-cols-2 rounded-2xl bg-secondary/60"
                        data-testid="tabs-active"
                      >
                        <TabsTrigger value="history" className="rounded-2xl" data-testid="tab-history">
                          History
                        </TabsTrigger>
                        <TabsTrigger value="build" className="rounded-2xl" data-testid="tab-build">
                          Build
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="history" className="mt-4 space-y-3">
                        {history.length === 0 ? (
                          <Card
                            className="rounded-3xl border-border/70 bg-background/20 p-4"
                            data-testid="empty-history"
                          >
                            <div className="text-sm font-semibold" data-testid="text-empty-history-title">
                              No service logs yet
                            </div>
                            <div
                              className="mt-1 text-xs text-muted-foreground"
                              data-testid="text-empty-history-subtitle"
                            >
                              Add your first service entry to start building a trustworthy history.
                            </div>
                            <Button
                              className="mt-3 w-full rounded-2xl bg-primary text-primary-foreground"
                              data-testid="button-empty-add-service"
                            >
                              <Wrench className="mr-2 size-4" />
                              Add service
                            </Button>
                          </Card>
                        ) : (
                          history.map((h) => <ServiceCard key={h.id} item={h} />)
                        )}
                      </TabsContent>

                      <TabsContent value="build" className="mt-4 space-y-3">
                        <Card className="rounded-3xl border-border/70 bg-background/20 p-4" data-testid="card-build">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="rg-title text-base font-semibold" data-testid="text-build-title">
                                Notes & setup
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground" data-testid="text-build-subtitle">
                                Track modifications, tyres, accessories, and any important notes for service.
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-secondary/60" data-testid="badge-build-mvp">
                              MVP
                            </Badge>
                          </div>

                          <div className="mt-4 grid gap-2">
                            {[
                              { k: "Tyres", v: "All-season / performance" },
                              { k: "Fluids", v: "Last changed in last service" },
                              { k: "Accessories", v: "Documented" },
                              { k: "Notes", v: "Keep receipts + photos" },
                            ].map((row) => (
                              <div
                                key={row.k}
                                className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card/40 px-3 py-2"
                                data-testid={`row-build-${row.k.toLowerCase()}`}
                              >
                                <div className="text-xs font-medium text-muted-foreground">{row.k}</div>
                                <div className="text-xs font-semibold text-foreground">{row.v}</div>
                              </div>
                            ))}
                          </div>

                          <Button
                            variant="secondary"
                            className="mt-4 w-full rounded-2xl bg-secondary/60"
                            data-testid="button-edit-build"
                          >
                            Edit notes
                            <ArrowRight className="ml-2 size-4" />
                          </Button>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                </motion.div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

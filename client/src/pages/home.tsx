import { useRef } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarClock,
  Car,
  FileText,
  Fuel,
  Gauge,
  Share2,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { NotificationBell } from "@/components/notification-bell";
import { fetchCurrentUser, fetchVehicles, fetchAllDocuments } from "@/lib/api";
import type { VehicleDocument } from "@shared/schema";

function km(n: number) {
  return n.toLocaleString("en-IN") + " km";
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: i * 0.12, duration: 0.5 },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div ref={ref} className={className}>
      {inView ? children : <div style={{ opacity: 0 }}>{children}</div>}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      custom={index}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={scaleIn}
      className="group relative rounded-3xl border border-border/70 bg-card/40 p-6 backdrop-blur transition-colors hover:border-primary/30 hover:bg-card/60"
    >
      <div className="grid size-12 place-items-center rounded-2xl border border-border/70 bg-background/40 transition-colors group-hover:border-primary/40 group-hover:bg-primary/5">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </motion.div>
  );
}

function StatPill({
  icon,
  label,
  value,
  index,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card/60 px-4 py-3 shadow-sm backdrop-blur"
    >
      <div className="grid size-10 place-items-center rounded-xl border border-border/80 bg-background/40">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-semibold text-foreground">{value}</div>
      </div>
    </motion.div>
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

  const urgentDocs = allDocuments
    .filter((doc) => {
      const diffDays = Math.ceil(
        (new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return diffDays <= 14;
    })
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  function docLabel(type: string) {
    return type === "insurance" ? "Insurance" : type === "puc" ? "PUC" : type;
  }

  function docUrgencyText(doc: VehicleDocument) {
    const diffDays = Math.ceil(
      (new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays < 0) return { text: `Expired ${Math.abs(diffDays)}d ago`, expired: true };
    if (diffDays === 0) return { text: "Expires today", expired: true };
    return { text: `${diffDays}d left`, expired: false };
  }

  const features = [
    {
      icon: <Wrench className="size-5 text-primary" />,
      title: "Service Tracking",
      desc: "Log every workshop visit with parts, cost, and odometer. Know exactly when the next service is due.",
    },
    {
      icon: <Fuel className="size-5 text-primary" />,
      title: "Fuel Efficiency",
      desc: "Track fill-ups and watch your km/L trend over time. See cost per km across your fleet.",
    },
    {
      icon: <ShieldCheck className="size-5 text-primary" />,
      title: "Document Alerts",
      desc: "Never miss an insurance or PUC renewal. Get notified before documents expire.",
    },
    {
      icon: <Sparkles className="size-5 text-primary" />,
      title: "Build Notes",
      desc: "Record every mod, upgrade, and accessory with dates and costs. Your vehicle's complete story.",
    },
    {
      icon: <Share2 className="size-5 text-primary" />,
      title: "Share Access",
      desc: "Invite family members to view and manage shared vehicles. Everyone stays in the loop.",
    },
    {
      icon: <Bell className="size-5 text-primary" />,
      title: "Notifications",
      desc: "Real-time alerts when someone shares a vehicle with you. Never miss an update.",
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 rg-grid opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_15%_0%,hsl(var(--primary)/0.20),transparent_60%),radial-gradient(900px_circle_at_85%_20%,hsl(var(--accent)/0.18),transparent_55%),radial-gradient(800px_circle_at_50%_90%,hsl(var(--foreground)/0.06),transparent_60%)]" />

        {/* Header */}
        <header className="relative z-10">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="grid size-11 place-items-center rounded-2xl border border-border/80 bg-card/60 shadow-sm backdrop-blur">
                  <Logo className="size-6 text-primary" />
                </div>
                <div className="leading-tight">
                  <div className="rg-title text-base font-semibold">Pocket Garage</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">
                    Your vehicles. Your mods. Your service story.
                  </div>
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              {user && <NotificationBell />}
              <ThemeToggle />
              {user ? (
                <>
                  <Link href="/garage">
                    <Button className="bg-primary text-primary-foreground">
                      <span className="hidden md:inline">Open garage</span>
                      <span className="md:hidden">Garage</span>
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </Link>
                  <UserMenu />
                </>
              ) : (
                <a href="/api/auth/google">
                  <Button className="bg-primary text-primary-foreground gap-2">
                    Sign in
                    <ArrowRight className="size-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <div className="flex flex-col items-center text-center">
              {/* Animated logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="grid size-20 place-items-center rounded-3xl border border-primary/30 bg-primary/10 shadow-lg shadow-primary/10 backdrop-blur sm:size-24"
              >
                <Logo className="size-10 text-primary sm:size-12" />
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="rg-title mt-8 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl"
              >
                A digital den for{" "}
                <span className="bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent">
                  your vehicles
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                Track services, fuel, modifications, and documents for every vehicle you own.
                All in one place, beautifully organized.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
              >
                {user ? (
                  <Link href="/garage">
                    <Button size="lg" className="bg-primary text-primary-foreground text-base px-8 py-6 rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
                      Open your garage
                      <ArrowRight className="ml-2 size-5" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <a href="/api/auth/google">
                      <Button size="lg" className="bg-primary text-primary-foreground text-base px-8 py-6 rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
                        <svg className="mr-2 size-5" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                      </Button>
                    </a>
                    <span className="text-xs text-muted-foreground">Free forever. No credit card needed.</span>
                  </>
                )}
              </motion.div>

              {/* Floating badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="mt-10 flex flex-wrap items-center justify-center gap-2"
              >
                {[
                  { icon: <Car className="size-3" />, text: "Cars" },
                  { icon: <Gauge className="size-3" />, text: "Bikes" },
                  { icon: <Fuel className="size-3" />, text: "Scooters" },
                  { icon: <Sparkles className="size-3" />, text: "EVs" },
                ].map((badge, i) => (
                  <motion.span
                    key={badge.text}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.1, duration: 0.4 }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur"
                  >
                    {badge.icon}
                    {badge.text}
                  </motion.span>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Logged-in user stats & alerts */}
        {user && vehicles.length > 0 && (
          <section className="relative z-10 px-4 pb-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              {urgentDocs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="mb-5"
                >
                  <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 backdrop-blur">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="size-3.5" />
                      Attention needed
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {urgentDocs.map((doc) => {
                        const v = vehicles.find((v) => v.id === doc.vehicleId);
                        const { text, expired } = docUrgencyText(doc);
                        return (
                          <Link key={doc.id} href={`/garage?vehicle=${doc.vehicleId}&tab=documents`}>
                            <div
                              className={
                                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors hover:bg-amber-500/10 " +
                                (expired
                                  ? "border-destructive/40 text-destructive"
                                  : "border-amber-500/40 text-amber-600 dark:text-amber-400")
                              }
                            >
                              <ShieldCheck className="size-3" />
                              {v?.nickname ?? "Vehicle"} · {docLabel(doc.type)} · {text}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial="hidden"
                animate="visible"
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
              >
                <StatPill
                  index={0}
                  icon={<Car className="size-4 text-primary" strokeWidth={2.2} />}
                  label="Vehicles"
                  value={`${vehicles.length} tracked`}
                />
                <StatPill
                  index={1}
                  icon={<CalendarClock className="size-4 text-primary" strokeWidth={2.2} />}
                  label="Next interval"
                  value={`${km(nearestService)} away`}
                />
                <StatPill
                  index={2}
                  icon={<Gauge className="size-4 text-primary" strokeWidth={2.2} />}
                  label="Total distance"
                  value={km(totalDistance)}
                />
                <StatPill
                  index={3}
                  icon={<FileText className="size-4 text-primary" strokeWidth={2.2} />}
                  label="Documents"
                  value={`${allDocuments.length} stored`}
                />
              </motion.div>
            </div>
          </section>
        )}

        {/* Features Grid */}
        <section className="relative z-10 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <AnimatedSection>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                className="text-center"
              >
                <motion.div custom={0} variants={fadeIn} className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Everything you need
                </motion.div>
                <motion.h2 custom={1} variants={fadeUp} className="rg-title mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  One app. Every vehicle.
                </motion.h2>
                <motion.p custom={2} variants={fadeIn} className="mx-auto mt-3 max-w-lg text-muted-foreground">
                  Whether it's a daily commuter or a weekend project, Pocket Garage keeps your entire fleet organized.
                </motion.p>
              </motion.div>
            </AnimatedSection>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="relative z-10 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <AnimatedSection>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                className="text-center"
              >
                <motion.div custom={0} variants={fadeIn} className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Get started in seconds
                </motion.div>
                <motion.h2 custom={1} variants={fadeUp} className="rg-title mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Three steps. That's it.
                </motion.h2>
              </motion.div>
            </AnimatedSection>

            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Sign in",
                  desc: "One click with your Google account. No forms, no passwords.",
                },
                {
                  step: "02",
                  title: "Add vehicles",
                  desc: "Enter your car or bike details. Set up service intervals and documents.",
                },
                {
                  step: "03",
                  title: "Stay on top",
                  desc: "Get reminders for services and renewals. Share access with family.",
                },
              ].map((item, i) => {
                const ref = useRef(null);
                const inView = useInView(ref, { once: true, margin: "-60px" });
                return (
                  <motion.div
                    key={item.step}
                    ref={ref}
                    custom={i}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                    variants={fadeUp}
                    className="text-center"
                  >
                    <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-xl font-bold text-primary">
                      {item.step}
                    </div>
                    <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{item.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        {!user && (
          <section className="relative z-10 px-4 pb-20 pt-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <AnimatedSection>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  className="rg-noise rounded-[28px] border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent p-8 text-center shadow-lg backdrop-blur sm:p-12"
                >
                  <motion.h2 custom={0} variants={fadeUp} className="rg-title text-2xl font-bold sm:text-3xl">
                    Ready to organize your garage?
                  </motion.h2>
                  <motion.p custom={1} variants={fadeIn} className="mx-auto mt-3 max-w-md text-muted-foreground">
                    Join vehicle owners who track every service, mod, and document in one beautiful interface.
                  </motion.p>
                  <motion.div custom={2} variants={fadeUp} className="mt-6">
                    <a href="/api/auth/google">
                      <Button size="lg" className="bg-primary text-primary-foreground text-base px-8 py-6 rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
                        <svg className="mr-2 size-5" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Get started free
                      </Button>
                    </a>
                  </motion.div>
                </motion.div>
              </AnimatedSection>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="relative z-10 border-t border-border/40 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Logo className="size-4 text-muted-foreground" />
              <span>Pocket Garage</span>
            </div>
            <div className="text-xs text-muted-foreground/60">
              Built for enthusiasts.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

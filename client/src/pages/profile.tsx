import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { UserMenu } from "@/components/user-menu";
import { fetchCurrentUser, updateProfile } from "@/lib/api";

const currencies = [
  { value: "INR", label: "Indian Rupee (₹)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "AED", label: "UAE Dirham (د.إ)" },
  { value: "AUD", label: "Australian Dollar (A$)" },
  { value: "CAD", label: "Canadian Dollar (C$)" },
  { value: "SGD", label: "Singapore Dollar (S$)" },
  { value: "JPY", label: "Japanese Yen (¥)" },
];

const timezones = [
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Berlin", label: "Central Europe (CET)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Japan (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "Pacific/Auckland", label: "New Zealand (NZST)" },
];

export default function Profile() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const [currency, setCurrency] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);

  const effectiveCurrency = currency ?? user?.currency ?? "INR";
  const effectiveTimezone = timezone ?? user?.timezone ?? "Asia/Kolkata";

  const hasChanges =
    (currency !== null && currency !== user?.currency) ||
    (timezone !== null && timezone !== user?.timezone);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(["currentUser"], updated);
      setCurrency(null);
      setTimezone(null);
    },
  });

  const handleSave = () => {
    const updates: { currency?: string; timezone?: string } = {};
    if (currency !== null && currency !== user?.currency) updates.currency = currency;
    if (timezone !== null && timezone !== user?.timezone) updates.timezone = timezone;
    mutation.mutate(updates);
  };

  const aliasInitials = user?.alias
    ? user.alias
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";

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
                    Pocket Garage
                  </div>
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="relative flex-1 px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <Link href="/garage">
              <Button variant="ghost" className="mb-4 gap-1.5 rounded-xl px-2 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="size-4" />
                Back to garage
              </Button>
            </Link>

            {isLoading ? (
              <div className="mt-12 flex items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                Loading...
              </div>
            ) : !user ? (
              <div className="mt-12 text-center text-sm text-muted-foreground">
                Please sign in to view your profile.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Profile card */}
                <div className="rg-noise rounded-[28px] border border-border/70 bg-card/40 p-6 shadow-md backdrop-blur md:p-8">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Your profile
                  </div>

                  <div className="mt-4 flex items-center gap-5">
                    {/* Real identity */}
                    <div className="flex items-center gap-4">
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name}
                          className="size-14 rounded-2xl border border-border/70 object-cover"
                        />
                      ) : (
                        <div className="grid size-14 place-items-center rounded-2xl border border-border/70 bg-primary/10 text-lg font-semibold text-primary">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-lg font-semibold text-foreground">
                          {user.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Anonymous alias */}
                  <div className="mt-6 rounded-2xl border border-border/70 bg-background/20 p-4">
                    <div className="text-xs font-semibold text-muted-foreground">
                      Anonymous identity (used in feed)
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <div
                        className="grid size-12 place-items-center rounded-2xl text-base font-bold text-white"
                        style={{ backgroundColor: user.avatarColor ?? "#64B5F6" }}
                      >
                        {aliasInitials}
                      </div>
                      <div>
                        <div className="text-base font-semibold text-foreground">
                          {user.alias ?? "Not assigned"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          This name is visible to others instead of your real identity.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="rg-noise rounded-[28px] border border-border/70 bg-card/40 p-6 shadow-md backdrop-blur md:p-8">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Settings
                  </div>

                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={effectiveCurrency} onValueChange={setCurrency}>
                        <SelectTrigger id="currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={effectiveTimezone} onValueChange={setTimezone}>
                        <SelectTrigger id="timezone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {hasChanges && (
                    <Button
                      className="mt-5 bg-primary text-primary-foreground"
                      onClick={handleSave}
                      disabled={mutation.isPending}
                    >
                      {mutation.isPending ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 size-4" />
                      )}
                      Save settings
                    </Button>
                  )}
                  {mutation.isError && (
                    <p className="mt-2 text-sm text-destructive">
                      Failed to save. Please try again.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bike,
  CalendarClock,
  CalendarIcon,
  Camera,
  Car,
  CheckCircle2,
  ChevronLeft,
  FileText,
  IndianRupee,
  Loader2,
  MapPin,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  fetchVehicles,
  fetchServiceRecords,
  fetchBuildNotes,
  fetchDocuments,
  fetchCurrentUser,
  createVehicle,
  createServiceRecord,
  createDocument,
  deleteVehicle,
  deleteDocument,
  upsertBuildNotes,
} from "@/lib/api";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import type { Vehicle, ServiceRecord, BuildNote, VehicleDocument } from "@shared/schema";

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
    >
      <div className="absolute inset-0 -z-10 rounded-3xl opacity-0 transition-opacity group-hover:opacity-100">
        <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(1000px_circle_at_20%_0%,hsl(var(--primary)/0.10),transparent_60%),radial-gradient(900px_circle_at_80%_30%,hsl(var(--accent)/0.10),transparent_55%)]" />
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="rg-title text-base font-semibold text-foreground md:text-lg">
              {v.nickname}
            </div>
            <Badge
              variant={active ? "default" : "secondary"}
              className={
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-foreground"
              }
            >
              {v.year}
            </Badge>
          </div>
          <div className="mt-1 truncate text-sm text-muted-foreground">
            {v.model}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge
            variant="outline"
            className="border-border/70 bg-background/30 text-foreground"
          >
            <MapPin className="mr-1 size-3.5" />
            {v.location}
          </Badge>
          <div className="text-xs font-medium text-muted-foreground">
            {km(v.odoKm)}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="text-xs font-medium text-muted-foreground">
            Next service in{" "}
            <span className="font-semibold text-foreground">
              {km(remaining)}
            </span>
          </div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-foreground">
            <span className="grid size-8 place-items-center rounded-xl border border-border/80 bg-background/30">
              <VehicleTypeIcon tags={v.tags} />
            </span>
            {v.health}%
          </div>
        </div>

        <div className="mt-2">
          <Progress value={pct} className="h-2.5 bg-secondary/60" />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {v.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border/70 bg-background/30 px-2.5 py-1 text-xs font-medium text-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

function ServiceCard({ item }: { item: ServiceRecord }) {
  return (
    <Card className="rounded-3xl border-border/80 bg-card/50 p-4 shadow-sm backdrop-blur md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="rg-title text-base font-semibold">{item.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{item.date}</span>
            <span className="text-muted-foreground/40">•</span>
            <span>{km(item.odometerKm)}</span>
            <span className="text-muted-foreground/40">•</span>
            <span>{item.workshop}</span>
          </div>
        </div>

        <Badge
          className={
            item.amount === 0
              ? "bg-secondary/60 text-foreground"
              : "bg-primary text-primary-foreground"
          }
        >
          {item.amount === 0 ? "Free" : formatMoney(item.amount)}
        </Badge>
      </div>

      {item.items.length > 0 && (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {item.items.map((text, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl border border-border/70 bg-background/20 px-3 py-2"
            >
              <div className="text-xs font-medium text-foreground">{text}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AddVehicleDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nickname: "",
    model: "",
    year: "",
    odoKm: "",
    lastServiceKm: "",
    nextServiceKm: "",
    location: "",
    tags: "",
  });

  const mutation = useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      onOpenChange(false);
      setForm({
        nickname: "",
        model: "",
        year: "",
        odoKm: "",
        lastServiceKm: "",
        nextServiceKm: "",
        location: "",
        tags: "",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      nickname: form.nickname,
      model: form.model,
      year: form.year,
      odoKm: parseInt(form.odoKm) || 0,
      lastServiceKm: parseInt(form.lastServiceKm) || 0,
      nextServiceKm: parseInt(form.nextServiceKm) || 0,
      location: form.location,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add vehicle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 pt-2">
          <div className="grid gap-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              placeholder="e.g. Weekend Twin"
              value={form.nickname}
              onChange={(e) => update("nickname", e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="e.g. Royal Enfield GT 650"
                value={form.model}
                onChange={(e) => update("model", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                placeholder="e.g. 2022"
                value={form.year}
                onChange={(e) => update("year", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="odoKm">Odometer (km)</Label>
              <Input
                id="odoKm"
                type="number"
                placeholder="12450"
                value={form.odoKm}
                onChange={(e) => update("odoKm", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastServiceKm">Last service (km)</Label>
              <Input
                id="lastServiceKm"
                type="number"
                placeholder="10000"
                value={form.lastServiceKm}
                onChange={(e) => update("lastServiceKm", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nextServiceKm">Next service (km)</Label>
              <Input
                id="nextServiceKm"
                type="number"
                placeholder="15000"
                value={form.nextServiceKm}
                onChange={(e) => update("nextServiceKm", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. Bengaluru"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="Motorcycle, Touring"
                value={form.tags}
                onChange={(e) => update("tags", e.target.value)}
              />
            </div>
          </div>
          <Button
            type="submit"
            className="mt-2 w-full bg-primary text-primary-foreground"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Plus className="mr-2 size-4" />
            )}
            Add vehicle
          </Button>
          {mutation.isError && (
            <p className="text-sm text-destructive">
              Failed to add vehicle. Please try again.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddMaintenanceDialog({
  open,
  onOpenChange,
  vehicleId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
}) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [form, setForm] = useState({
    title: "",
    odometerKm: "",
    amount: "",
    workshop: "",
    items: "",
  });

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof createServiceRecord>[1]) =>
      createServiceRecord(vehicleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["serviceRecords", vehicleId],
      });
      onOpenChange(false);
      setForm({
        title: "",
        odometerKm: "",
        amount: "",
        workshop: "",
        items: "",
      });
      setSelectedDate(undefined);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    mutation.mutate({
      title: form.title,
      date: format(selectedDate, "dd MMM yyyy"),
      odometerKm: parseInt(form.odometerKm) || 0,
      amount: parseInt(form.amount) || 0,
      workshop: form.workshop,
      items: form.items
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log maintenance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 pt-2">
          <div className="grid gap-2">
            <Label htmlFor="svc-title">Title</Label>
            <Input
              id="svc-title"
              placeholder="e.g. Periodic maintenance (10,000 km)"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={
                      "h-10 w-full justify-start rounded-xl border-border/70 bg-background/30 text-left font-normal transition-colors hover:bg-secondary/60 " +
                      (!selectedDate ? "text-muted-foreground" : "")
                    }
                  >
                    <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
                    {selectedDate
                      ? format(selectedDate, "dd MMM yyyy")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto rounded-2xl border-border/70 bg-card/95 p-0 shadow-lg backdrop-blur"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="svc-workshop">Workshop</Label>
              <Input
                id="svc-workshop"
                placeholder="e.g. RE Store — Indiranagar"
                value={form.workshop}
                onChange={(e) => update("workshop", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="svc-odo">Odometer (km)</Label>
              <Input
                id="svc-odo"
                type="number"
                placeholder="10012"
                value={form.odometerKm}
                onChange={(e) => update("odometerKm", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="svc-amount">Amount (INR)</Label>
              <Input
                id="svc-amount"
                type="number"
                placeholder="3860"
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="svc-items">Items (comma-separated)</Label>
            <Input
              id="svc-items"
              placeholder="Oil change, Filter replaced, Chain lubed"
              value={form.items}
              onChange={(e) => update("items", e.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="mt-2 w-full bg-primary text-primary-foreground"
            disabled={mutation.isPending || !selectedDate}
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Wrench className="mr-2 size-4" />
            )}
            Log maintenance
          </Button>
          {mutation.isError && (
            <p className="text-sm text-destructive">
              Failed to log maintenance. Please try again.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

const DOC_TYPES = [
  { value: "insurance", label: "Insurance" },
  { value: "puc", label: "PUC / Pollution" },
] as const;

function docTypeLabel(type: string) {
  return DOC_TYPES.find((d) => d.value === type)?.label ?? type;
}

function expiryStatus(expiryDate: string): { label: string; color: string; urgent: boolean } {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: `Expired ${Math.abs(diffDays)}d ago`, color: "text-destructive", urgent: true };
  if (diffDays === 0) return { label: "Expires today", color: "text-destructive", urgent: true };
  if (diffDays <= 14) return { label: `${diffDays}d left`, color: "text-amber-500", urgent: true };
  if (diffDays <= 30) return { label: `${diffDays}d left`, color: "text-muted-foreground", urgent: false };
  return { label: format(expiry, "dd MMM yyyy"), color: "text-muted-foreground", urgent: false };
}

function DocumentCard({
  doc,
  vehicleId,
}: {
  doc: VehicleDocument;
  vehicleId: string;
}) {
  const queryClient = useQueryClient();
  const deleteMut = useMutation({
    mutationFn: () => deleteDocument(vehicleId, doc.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents", vehicleId] }),
  });

  const status = expiryStatus(doc.expiryDate);
  const isExpired = new Date(doc.expiryDate) < new Date();

  return (
    <div className={
      "flex items-center gap-3 rounded-2xl border p-3 " +
      (isExpired
        ? "border-destructive/40 bg-destructive/5"
        : "border-border/70 bg-background/20")
    }>
      <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-border/70 bg-background/30">
        {doc.type === "insurance" ? (
          <ShieldCheck className="size-4 text-primary" strokeWidth={2.2} />
        ) : (
          <FileText className="size-4 text-primary" strokeWidth={2.2} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold text-foreground">
            {docTypeLabel(doc.type)}
          </div>
          {doc.label && (
            <div className="truncate text-xs text-muted-foreground">
              — {doc.label}
            </div>
          )}
        </div>
        <div className={`text-xs font-medium ${status.color}`}>
          {status.urgent && isExpired && <AlertTriangle className="mr-1 inline size-3" />}
          {status.label}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {doc.fileUrl && (
          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="size-7">
              <FileText className="size-3.5" />
            </Button>
          </a>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-destructive hover:bg-destructive/10"
          onClick={() => {
            if (confirm("Delete this document?")) deleteMut.mutate();
          }}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function AddDocumentDialog({
  open,
  onOpenChange,
  vehicleId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
}) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    type: "insurance" as string,
    label: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof createDocument>[1]) =>
      createDocument(vehicleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", vehicleId] });
      queryClient.invalidateQueries({ queryKey: ["allDocuments"] });
      onOpenChange(false);
      setForm({ type: "insurance", label: "", notes: "" });
      setSelectedDate(undefined);
      setFile(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    mutation.mutate({
      type: form.type,
      label: form.label || undefined,
      expiryDate: format(selectedDate, "yyyy-MM-dd"),
      notes: form.notes || undefined,
      file: file || undefined,
    });
  };

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                {DOC_TYPES.map((t) => (
                  <Button
                    key={t.value}
                    type="button"
                    variant={form.type === t.value ? "default" : "outline"}
                    className={
                      form.type === t.value
                        ? "flex-1 bg-primary text-primary-foreground"
                        : "flex-1 border-border/70 bg-background/30"
                    }
                    onClick={() => update("type", t.value)}
                  >
                    {t.value === "insurance" ? (
                      <ShieldCheck className="mr-1.5 size-3.5" />
                    ) : (
                      <FileText className="mr-1.5 size-3.5" />
                    )}
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="doc-label">Label (optional)</Label>
              <Input
                id="doc-label"
                placeholder="e.g. ICICI Lombard"
                value={form.label}
                onChange={(e) => update("label", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Expiry date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={
                      "h-10 w-full justify-start rounded-xl border-border/70 bg-background/30 text-left font-normal transition-colors hover:bg-secondary/60 " +
                      (!selectedDate ? "text-muted-foreground" : "")
                    }
                  >
                    <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
                    {selectedDate
                      ? format(selectedDate, "dd MMM yyyy")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto rounded-2xl border-border/70 bg-card/95 p-0 shadow-lg backdrop-blur"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="doc-notes">Notes (optional)</Label>
              <Input
                id="doc-notes"
                placeholder="e.g. Policy #12345"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Attach file or photo (optional)</Label>
            <div className="flex gap-2">
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-background/20 px-4 py-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/40">
                <Upload className="size-4" />
                {file ? file.name : "Choose file"}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-background/20 px-4 py-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/40">
                <Camera className="size-4" />
                Photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          <Button
            type="submit"
            className="mt-2 w-full bg-primary text-primary-foreground"
            disabled={mutation.isPending || !selectedDate}
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <FileText className="mr-2 size-4" />
            )}
            Add document
          </Button>
          {mutation.isError && (
            <p className="text-sm text-destructive">
              Failed to add document. Please try again.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Garage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: allVehicles = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
    enabled: !!user,
  });

  const vehicles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allVehicles;
    return allVehicles.filter(
      (v) =>
        v.nickname.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q) ||
        v.tags.join(" ").toLowerCase().includes(q),
    );
  }, [search, allVehicles]);

  const currentActiveId = activeId ?? allVehicles[0]?.id ?? null;
  const activeVehicle = allVehicles.find((v) => v.id === currentActiveId);

  const { data: serviceRecords = [] } = useQuery({
    queryKey: ["serviceRecords", currentActiveId],
    queryFn: () => fetchServiceRecords(currentActiveId!),
    enabled: !!currentActiveId,
  });

  const { data: buildNotes = [] } = useQuery({
    queryKey: ["buildNotes", currentActiveId],
    queryFn: () => fetchBuildNotes(currentActiveId!),
    enabled: !!currentActiveId,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["documents", currentActiveId],
    queryFn: () => fetchDocuments(currentActiveId!),
    enabled: !!currentActiveId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setActiveId(null);
    },
  });

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 rg-grid opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_15%_0%,hsl(var(--primary)/0.20),transparent_60%),radial-gradient(900px_circle_at_85%_20%,hsl(var(--accent)/0.18),transparent_55%),radial-gradient(800px_circle_at_50%_90%,hsl(var(--foreground)/0.06),transparent_60%)]" />

        <header className="relative">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl border border-border/80 bg-card/60 shadow-sm backdrop-blur">
                <Logo className="size-6 text-primary" />
              </div>
              <div className="leading-tight">
                <div className="rg-title text-base font-semibold">
                  Thaavalam <span className="ml-1 text-lg font-normal text-muted-foreground" style={{ fontFamily: "'Noto Sans Malayalam', sans-serif" }}>/ താവളം</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  One interface for all your vehicles.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/">
                <Button variant="secondary" className="bg-secondary/60">
                  <ChevronLeft className="mr-2 size-4" />
                  Home
                </Button>
              </Link>
              {user && (
                <Button
                  className="bg-primary text-primary-foreground"
                  onClick={() => setShowAddVehicle(true)}
                >
                  <Plus className="mr-2 size-4" />
                  Add
                </Button>
              )}
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="relative flex-1 mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <div className="rg-noise rounded-[28px] border border-border/70 bg-card/40 p-5 shadow-md backdrop-blur md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/30 px-3 py-1 text-xs font-semibold text-foreground">
                  <Sparkles className="size-3.5 text-primary" />
                  Open Garage
                </div>
                <h1 className="mt-3 rg-title text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl">
                  Your vehicles, organized.
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Add anything you own or maintain — motorcycles, cars, and
                  more. Track service intervals, history, and build notes in one
                  clean view.
                </p>
              </div>

              {user && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="bg-primary text-primary-foreground"
                    onClick={() => setShowAddVehicle(true)}
                  >
                    <Plus className="mr-2 size-4" />
                    Add vehicle
                  </Button>
                  {activeVehicle && (
                    <Button
                      variant="secondary"
                      className="bg-secondary/60"
                      onClick={() => setShowAddMaintenance(true)}
                    >
                      <Wrench className="mr-2 size-4" />
                      Log maintenance
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Quick stats">
              <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card/60 px-4 py-3 shadow-sm backdrop-blur">
                <div className="grid size-10 place-items-center rounded-xl border border-border/80 bg-background/40">
                  <BadgeCheck className="size-4 text-primary" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-muted-foreground">Vehicles</div>
                  <div className="truncate text-sm font-semibold text-foreground">
                    {allVehicles.length}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card/60 px-4 py-3 shadow-sm backdrop-blur">
                <div className="grid size-10 place-items-center rounded-xl border border-border/80 bg-background/40">
                  <CalendarClock className="size-4 text-primary" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-muted-foreground">Next interval</div>
                  <div className="truncate text-sm font-semibold text-foreground">
                    {allVehicles.length > 0
                      ? km(
                          Math.min(
                            ...allVehicles.map(
                              (v) => Math.max(0, v.nextServiceKm - v.odoKm),
                            ),
                          ),
                        )
                      : "—"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card/60 px-4 py-3 shadow-sm backdrop-blur">
                <div className="grid size-10 place-items-center rounded-xl border border-border/80 bg-background/40">
                  <CheckCircle2 className="size-4 text-primary" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-muted-foreground">Total distance</div>
                  <div className="truncate text-sm font-semibold text-foreground">
                    {allVehicles.length > 0
                      ? km(allVehicles.reduce((sum, v) => sum + v.odoKm, 0))
                      : "—"}
                  </div>
                </div>
              </div>
            </div>

            {!user ? (
              <div className="mt-12 flex flex-col items-center gap-4 text-center">
                <div className="grid size-16 place-items-center rounded-3xl border border-border/70 bg-background/30">
                  <Logo className="size-7 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-base font-semibold">Sign in to get started</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Log in with Google to add and manage your vehicles.
                  </div>
                </div>
                <a href="/api/auth/google">
                  <Button className="bg-primary text-primary-foreground">
                    Sign in with Google
                  </Button>
                </a>
              </div>
            ) : isLoading ? (
              <div className="mt-12 flex items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                Loading vehicles...
              </div>
            ) : isError ? (
              <div className="mt-12 text-center text-sm text-destructive">
                Failed to load vehicles. Please refresh.
              </div>
            ) : allVehicles.length === 0 ? (
              <div className="mt-12 flex flex-col items-center gap-4 text-center">
                <div className="grid size-16 place-items-center rounded-3xl border border-border/70 bg-background/30">
                  <Logo className="size-7 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-base font-semibold">No vehicles yet</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Add your first vehicle to get started.
                  </div>
                </div>
                <Button
                  className="bg-primary text-primary-foreground"
                  onClick={() => setShowAddVehicle(true)}
                >
                  <Plus className="mr-2 size-4" />
                  Add your first vehicle
                </Button>
              </div>
            ) : (
              <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <section>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="rg-title text-base font-semibold">
                        Vehicle list
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Select a vehicle to view its interval and history.
                      </div>
                    </div>

                    <div className="flex flex-1 items-center gap-2 sm:max-w-md">
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search vehicles, tags, city…"
                        className="h-11 rounded-2xl border-border/70 bg-background/30"
                      />
                      <Button
                        variant="secondary"
                        className="h-11 rounded-2xl bg-secondary/60"
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
                        active={v.id === currentActiveId}
                        onSelect={() => setActiveId(v.id)}
                      />
                    ))}
                  </div>
                </section>

                {activeVehicle && (
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
                          <div className="text-xs font-semibold text-muted-foreground">
                            Selected vehicle
                          </div>
                          <div className="mt-1 rg-title text-xl font-semibold">
                            {activeVehicle.nickname}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {activeVehicle.model}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary text-primary-foreground">
                            <CheckCircle2 className="mr-1.5 size-4" />
                            {activeVehicle.health}%
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm(`Delete "${activeVehicle.nickname}"?`)) {
                                deleteMutation.mutate(activeVehicle.id);
                              }
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-3xl border border-border/70 bg-background/20 p-4">
                            <div className="flex items-center gap-2">
                              <div className="grid size-8 place-items-center rounded-lg border border-border/70 bg-background/30">
                                <IndianRupee className="size-3.5 text-primary" strokeWidth={2.2} />
                              </div>
                              <div className="text-xs font-medium text-muted-foreground">
                                Total cost
                              </div>
                            </div>
                            <div className="mt-2 text-lg font-semibold text-foreground">
                              {serviceRecords.length > 0
                                ? formatMoney(serviceRecords.reduce((sum, r) => sum + r.amount, 0))
                                : "—"}
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {serviceRecords.length} {serviceRecords.length === 1 ? "entry" : "entries"}
                            </div>
                          </div>

                          <div className="rounded-3xl border border-border/70 bg-background/20 p-4">
                            <div className="flex items-center gap-2">
                              <div className="grid size-8 place-items-center rounded-lg border border-border/70 bg-background/30">
                                <CalendarClock className="size-3.5 text-primary" strokeWidth={2.2} />
                              </div>
                              <div className="text-xs font-medium text-muted-foreground">
                                Next service
                              </div>
                            </div>
                            <div className="mt-2 text-lg font-semibold text-foreground">
                              {km(serviceProgress(activeVehicle).remaining)}
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              at {km(activeVehicle.nextServiceKm)}
                            </div>
                          </div>
                        </div>

                        {documents.length > 0 && (() => {
                          const nearestDoc = documents.reduce((a, b) =>
                            new Date(a.expiryDate) < new Date(b.expiryDate) ? a : b
                          );
                          const status = expiryStatus(nearestDoc.expiryDate);
                          return (
                            <div className={
                              "rounded-3xl border p-3 flex items-center gap-3 " +
                              (status.urgent
                                ? "border-amber-500/40 bg-amber-500/5"
                                : "border-border/70 bg-background/20")
                            }>
                              <div className="grid size-8 shrink-0 place-items-center rounded-lg border border-border/70 bg-background/30">
                                <ShieldCheck className="size-3.5 text-primary" strokeWidth={2.2} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium text-muted-foreground">
                                  Nearest expiry
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-foreground">
                                    {docTypeLabel(nearestDoc.type)}
                                  </span>
                                  <span className={`text-xs font-medium ${status.color}`}>
                                    {status.label}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        <div className="rounded-3xl border border-border/70 bg-background/20 p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-medium text-muted-foreground">
                              Service interval
                            </div>
                            <div className="text-xs font-semibold text-foreground">
                              Next at {km(activeVehicle.nextServiceKm)}
                            </div>
                          </div>
                          <div className="mt-2">
                            <Progress
                              value={serviceProgress(activeVehicle).pct}
                              className="h-2.5 bg-secondary/60"
                            />
                          </div>
                          <div className="mt-3 flex items-center justify-between text-xs">
                            <div className="text-muted-foreground">
                              Last: {km(activeVehicle.lastServiceKm)}
                            </div>
                            <div className="font-semibold text-foreground">
                              {km(serviceProgress(activeVehicle).remaining)} left
                            </div>
                          </div>
                        </div>

                        <Tabs defaultValue="history" className="w-full">
                          <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-secondary/60">
                            <TabsTrigger value="history" className="rounded-2xl">
                              History
                            </TabsTrigger>
                            <TabsTrigger value="documents" className="rounded-2xl">
                              Docs
                            </TabsTrigger>
                            <TabsTrigger value="build" className="rounded-2xl">
                              Build
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="history" className="mt-4 space-y-3">
                            {serviceRecords.length === 0 ? (
                              <Card className="rounded-3xl border-border/70 bg-background/20 p-4">
                                <div className="text-sm font-semibold">
                                  No maintenance logs yet
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  Add your first maintenance entry to start building
                                  a trustworthy history.
                                </div>
                                <Button
                                  className="mt-3 w-full rounded-2xl bg-primary text-primary-foreground"
                                  onClick={() => setShowAddMaintenance(true)}
                                >
                                  <Wrench className="mr-2 size-4" />
                                  Add maintenance
                                </Button>
                              </Card>
                            ) : (
                              <>
                                {serviceRecords.map((r) => (
                                  <ServiceCard key={r.id} item={r} />
                                ))}
                                <Button
                                  variant="secondary"
                                  className="w-full rounded-2xl bg-secondary/60"
                                  onClick={() => setShowAddMaintenance(true)}
                                >
                                  <Plus className="mr-2 size-4" />
                                  Add maintenance
                                </Button>
                              </>
                            )}
                          </TabsContent>

                          <TabsContent value="documents" className="mt-4 space-y-3">
                            {documents.length === 0 ? (
                              <Card className="rounded-3xl border-border/70 bg-background/20 p-4">
                                <div className="text-sm font-semibold">
                                  No documents yet
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  Track insurance and PUC expiry dates, optionally attach photos or PDFs.
                                </div>
                                <Button
                                  className="mt-3 w-full rounded-2xl bg-primary text-primary-foreground"
                                  onClick={() => setShowAddDocument(true)}
                                >
                                  <FileText className="mr-2 size-4" />
                                  Add document
                                </Button>
                              </Card>
                            ) : (
                              <>
                                {documents.map((doc) => (
                                  <DocumentCard key={doc.id} doc={doc} vehicleId={activeVehicle.id} />
                                ))}
                                <Button
                                  variant="secondary"
                                  className="w-full rounded-2xl bg-secondary/60"
                                  onClick={() => setShowAddDocument(true)}
                                >
                                  <Plus className="mr-2 size-4" />
                                  Add document
                                </Button>
                              </>
                            )}
                          </TabsContent>

                          <TabsContent value="build" className="mt-4 space-y-3">
                            <Card className="rounded-3xl border-border/70 bg-background/20 p-4">
                              <div className="rg-title text-base font-semibold">
                                Notes & setup
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Track modifications, tyres, accessories, and any
                                important notes.
                              </div>

                              {buildNotes.length > 0 ? (
                                <div className="mt-4 grid gap-2">
                                  {buildNotes.map((note) => (
                                    <div
                                      key={note.id}
                                      className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card/40 px-3 py-2"
                                    >
                                      <div className="text-xs font-medium text-muted-foreground">
                                        {note.key}
                                      </div>
                                      <div className="text-xs font-semibold text-foreground">
                                        {note.value}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="mt-4 text-xs text-muted-foreground">
                                  No build notes yet.
                                </div>
                              )}
                            </Card>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </motion.div>
                  </aside>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <AddVehicleDialog open={showAddVehicle} onOpenChange={setShowAddVehicle} />
      {currentActiveId && (
        <>
          <AddMaintenanceDialog
            open={showAddMaintenance}
            onOpenChange={setShowAddMaintenance}
            vehicleId={currentActiveId}
          />
          <AddDocumentDialog
            open={showAddDocument}
            onOpenChange={setShowAddDocument}
            vehicleId={currentActiveId}
          />
        </>
      )}
    </div>
  );
}

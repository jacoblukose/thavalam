import { useEffect, useMemo, useState } from "react";
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
  Fuel,
  IndianRupee,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Settings2,
  ShieldCheck,
  Share2,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  UserPlus,
  Wrench,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchVehicles,
  fetchServiceRecords,
  fetchBuildNotes,
  fetchDocuments,
  fetchShares,
  fetchFuelLogs,
  fetchCurrentUser,
  createVehicle,
  createServiceRecord,
  createDocument,
  createFuelLog,
  shareVehicle,
  unshareVehicle,
  updateVehicle,
  updateServiceRecord,
  updateFuelLog,
  deleteServiceRecord,
  deleteFuelLog,
  deleteVehicle,
  deleteDocument,
  upsertBuildNotes,
} from "@/lib/api";
import type { ShareInfo } from "@/lib/api";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import type { Vehicle, ServiceRecord, BuildNote, VehicleDocument, FuelLog } from "@shared/schema";

const formatMoney = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR" });

function km(n: number) {
  return n.toLocaleString("en-IN") + " km";
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function serviceProgress(v: Vehicle) {
  const nextKm = v.lastServiceKm + v.serviceIntervalKm;
  const span = Math.max(1, v.serviceIntervalKm);
  const done = v.odoKm - v.lastServiceKm;
  const pct = clamp01(done / span) * 100;
  const remainingKm = Math.max(0, nextKm - v.odoKm);

  let nextDate: string | null = null;
  let remainingDays: number | null = null;
  if (v.lastServiceDate && v.serviceIntervalMonths > 0) {
    const last = new Date(v.lastServiceDate);
    const next = new Date(last);
    next.setMonth(next.getMonth() + v.serviceIntervalMonths);
    nextDate = next.toISOString().split("T")[0];
    const now = new Date();
    remainingDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  return { pct, remainingKm, nextKm, nextDate, remainingDays };
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
  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "group relative w-full rounded-2xl border px-4 py-3 text-left transition-all active:scale-[0.99] " +
        (active
          ? "border-primary/40 bg-gradient-to-b from-card to-card/60"
          : "border-border/80 bg-card/50 hover:border-border hover:bg-card/70")
      }
    >
      <div className="flex items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border/80 bg-background/30">
          <VehicleTypeIcon tags={v.tags} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rg-title truncate text-sm font-semibold text-foreground">
              {v.nickname || v.model}
            </span>
            {v.nickname && (
              <span className="truncate text-xs text-muted-foreground">
                {v.model}
              </span>
            )}
          </div>
        </div>
        <Badge
          variant={active ? "default" : "secondary"}
          className={
            "shrink-0 text-xs " +
            (active
              ? "bg-primary text-primary-foreground"
              : "bg-secondary/60 text-foreground")
          }
        >
          {v.year}
        </Badge>
        {v.status === "sold" && (
          <Badge
            variant="outline"
            className="shrink-0 border-amber-500/40 bg-amber-500/10 text-xs text-amber-600 dark:text-amber-400"
          >
            Sold
          </Badge>
        )}
      </div>
    </button>
  );
}

function ServiceTable({
  records,
  vehicleId,
  onEdit,
}: {
  records: ServiceRecord[];
  vehicleId: string;
  onEdit: (record: ServiceRecord) => void;
}) {
  const queryClient = useQueryClient();
  const deleteMut = useMutation({
    mutationFn: (serviceId: string) => deleteServiceRecord(vehicleId, serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serviceRecords", vehicleId] });
    },
  });

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border/70 bg-background/30">
            <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Date</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Service</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Odometer</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Workshop</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Items</th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Cost</th>
            <th className="w-16 px-2 py-2.5"></th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="group border-b border-border/50 last:border-0 hover:bg-background/20">
              <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">{r.date}</td>
              <td className="px-4 py-2.5 text-xs font-semibold text-foreground">{r.title}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">{km(r.odometerKm)}</td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.workshop}</td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">
                {r.items.length > 0 ? r.items.join(", ") : "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-right text-xs font-semibold text-foreground">
                {r.amount === 0 ? "Free" : formatMoney(r.amount)}
              </td>
              <td className="px-2 py-2.5">
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onEdit(r)}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete "${r.title}"?`)) {
                        deleteMut.mutate(r.id);
                      }
                    }}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
    lastServiceDate: "",
    serviceIntervalKm: "10000",
    serviceIntervalMonths: "6",
    location: "",
    tags: "",
    fuelType: "petrol",
    tankCapacity: "",
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
        lastServiceDate: "",
        serviceIntervalKm: "10000",
        serviceIntervalMonths: "6",
        location: "",
        tags: "",
        fuelType: "petrol",
        tankCapacity: "",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lastKm = parseInt(form.lastServiceKm) || 0;
    const intervalKm = parseInt(form.serviceIntervalKm) || 10000;
    const intervalMonths = parseInt(form.serviceIntervalMonths) || 6;
    mutation.mutate({
      nickname: form.nickname,
      model: form.model,
      year: form.year,
      odoKm: parseInt(form.odoKm) || 0,
      lastServiceKm: lastKm,
      lastServiceDate: form.lastServiceDate || null,
      serviceIntervalKm: intervalKm,
      serviceIntervalMonths: intervalMonths,
      nextServiceKm: lastKm + intervalKm,
      location: form.location,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      fuelType: form.fuelType,
      tankCapacity: form.tankCapacity || null,
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
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="odoKm">Odometer (km)</Label>
              <Input
                id="odoKm"
                type="number"
                placeholder="12450"
                value={form.odoKm}
                onChange={(e) => update("odoKm", e.target.value)}
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
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="lastServiceDate">Last service date</Label>
              <Input
                id="lastServiceDate"
                type="date"
                value={form.lastServiceDate}
                onChange={(e) => update("lastServiceDate", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="serviceIntervalKm">Interval (km)</Label>
              <Input
                id="serviceIntervalKm"
                type="number"
                placeholder="10000"
                value={form.serviceIntervalKm}
                onChange={(e) => update("serviceIntervalKm", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="serviceIntervalMonths">Interval (months)</Label>
              <Input
                id="serviceIntervalMonths"
                type="number"
                placeholder="6"
                value={form.serviceIntervalMonths}
                onChange={(e) => update("serviceIntervalMonths", e.target.value)}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fuelType">Fuel type</Label>
              <Select value={form.fuelType} onValueChange={(v) => update("fuelType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="cng">CNG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tankCapacity">
                {form.fuelType === "electric" ? "Battery (kWh)" : "Tank (L)"}
              </Label>
              <Input
                id="tankCapacity"
                type="number"
                step="0.1"
                placeholder={form.fuelType === "electric" ? "e.g. 3.0" : "e.g. 12"}
                value={form.tankCapacity}
                onChange={(e) => update("tankCapacity", e.target.value)}
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

function EditVehicleDialog({
  open,
  onOpenChange,
  vehicle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nickname: vehicle.nickname,
    model: vehicle.model,
    year: vehicle.year,
    odoKm: String(vehicle.odoKm),
    lastServiceKm: String(vehicle.lastServiceKm),
    lastServiceDate: vehicle.lastServiceDate ?? "",
    serviceIntervalKm: String(vehicle.serviceIntervalKm),
    serviceIntervalMonths: String(vehicle.serviceIntervalMonths),
    location: vehicle.location,
    tags: vehicle.tags.join(", "),
    status: vehicle.status,
    fuelType: vehicle.fuelType,
    tankCapacity: vehicle.tankCapacity ?? "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        nickname: vehicle.nickname,
        model: vehicle.model,
        year: vehicle.year,
        odoKm: String(vehicle.odoKm),
        lastServiceKm: String(vehicle.lastServiceKm),
        lastServiceDate: vehicle.lastServiceDate ?? "",
        serviceIntervalKm: String(vehicle.serviceIntervalKm),
        serviceIntervalMonths: String(vehicle.serviceIntervalMonths),
        location: vehicle.location,
        tags: vehicle.tags.join(", "),
        status: vehicle.status,
        fuelType: vehicle.fuelType,
        tankCapacity: vehicle.tankCapacity ?? "",
      });
    }
  }, [open, vehicle]);

  const mutation = useMutation({
    mutationFn: (updates: Parameters<typeof updateVehicle>[1]) =>
      updateVehicle(vehicle.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lastKm = parseInt(form.lastServiceKm) || 0;
    const intervalKm = parseInt(form.serviceIntervalKm) || 10000;
    const intervalMonths = parseInt(form.serviceIntervalMonths) || 6;
    mutation.mutate({
      nickname: form.nickname,
      model: form.model,
      year: form.year,
      odoKm: parseInt(form.odoKm) || 0,
      lastServiceKm: lastKm,
      lastServiceDate: form.lastServiceDate || null,
      serviceIntervalKm: intervalKm,
      serviceIntervalMonths: intervalMonths,
      nextServiceKm: lastKm + intervalKm,
      location: form.location,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      status: form.status,
      fuelType: form.fuelType,
      tankCapacity: form.tankCapacity || null,
    });
  };

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit vehicle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 pt-2">
          <div className="grid gap-2">
            <Label htmlFor="edit-nickname">Nickname</Label>
            <Input
              id="edit-nickname"
              value={form.nickname}
              onChange={(e) => update("nickname", e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-model">Model</Label>
              <Input
                id="edit-model"
                value={form.model}
                onChange={(e) => update("model", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-year">Year</Label>
              <Input
                id="edit-year"
                value={form.year}
                onChange={(e) => update("year", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-odoKm">Odometer (km)</Label>
              <Input
                id="edit-odoKm"
                type="number"
                value={form.odoKm}
                onChange={(e) => update("odoKm", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-lastServiceKm">Last service (km)</Label>
              <Input
                id="edit-lastServiceKm"
                type="number"
                value={form.lastServiceKm}
                onChange={(e) => update("lastServiceKm", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-lastServiceDate">Last service date</Label>
              <Input
                id="edit-lastServiceDate"
                type="date"
                value={form.lastServiceDate}
                onChange={(e) => update("lastServiceDate", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-serviceIntervalKm">Interval (km)</Label>
              <Input
                id="edit-serviceIntervalKm"
                type="number"
                value={form.serviceIntervalKm}
                onChange={(e) => update("serviceIntervalKm", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-serviceIntervalMonths">Interval (months)</Label>
              <Input
                id="edit-serviceIntervalMonths"
                type="number"
                value={form.serviceIntervalMonths}
                onChange={(e) => update("serviceIntervalMonths", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={form.tags}
                onChange={(e) => update("tags", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-fuelType">Fuel type</Label>
              <Select value={form.fuelType} onValueChange={(v) => update("fuelType", v)}>
                <SelectTrigger id="edit-fuelType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="cng">CNG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-tankCapacity">
                {form.fuelType === "electric" ? "Battery (kWh)" : "Tank (L)"}
              </Label>
              <Input
                id="edit-tankCapacity"
                type="number"
                step="0.1"
                value={form.tankCapacity}
                onChange={(e) => update("tankCapacity", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={form.status} onValueChange={(v) => update("status", v)}>
                <SelectTrigger id="edit-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owned">Owned</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>
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
              <Pencil className="mr-2 size-4" />
            )}
            Save changes
          </Button>
          {mutation.isError && (
            <p className="text-sm text-destructive">
              Failed to update vehicle. Please try again.
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

function EditMaintenanceDialog({
  open,
  onOpenChange,
  vehicleId,
  record,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  record: ServiceRecord;
}) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    record.date ? new Date(record.date) : undefined,
  );
  const [form, setForm] = useState({
    title: record.title,
    odometerKm: String(record.odometerKm),
    amount: String(record.amount),
    workshop: record.workshop,
    items: record.items.join(", "),
  });

  useEffect(() => {
    if (open) {
      setForm({
        title: record.title,
        odometerKm: String(record.odometerKm),
        amount: String(record.amount),
        workshop: record.workshop,
        items: record.items.join(", "),
      });
      setSelectedDate(record.date ? new Date(record.date) : undefined);
    }
  }, [open, record]);

  const mutation = useMutation({
    mutationFn: (updates: Parameters<typeof updateServiceRecord>[2]) =>
      updateServiceRecord(vehicleId, record.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serviceRecords", vehicleId] });
      onOpenChange(false);
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
          <DialogTitle>Edit maintenance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 pt-2">
          <div className="grid gap-2">
            <Label htmlFor="edit-svc-title">Title</Label>
            <Input
              id="edit-svc-title"
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
              <Label htmlFor="edit-svc-workshop">Workshop</Label>
              <Input
                id="edit-svc-workshop"
                value={form.workshop}
                onChange={(e) => update("workshop", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-svc-odo">Odometer (km)</Label>
              <Input
                id="edit-svc-odo"
                type="number"
                value={form.odometerKm}
                onChange={(e) => update("odometerKm", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-svc-amount">Amount</Label>
              <Input
                id="edit-svc-amount"
                type="number"
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-svc-items">Items (comma-separated)</Label>
            <Input
              id="edit-svc-items"
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
              <Pencil className="mr-2 size-4" />
            )}
            Save changes
          </Button>
          {mutation.isError && (
            <p className="text-sm text-destructive">
              Failed to update. Please try again.
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

function DocumentRow({
  doc,
  status,
  vehicleId,
}: {
  doc: VehicleDocument;
  status: { label: string; color: string; urgent: boolean };
  vehicleId: string;
}) {
  const queryClient = useQueryClient();
  const deleteMut = useMutation({
    mutationFn: () => deleteDocument(vehicleId, doc.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents", vehicleId] }),
  });

  return (
    <tr className="border-b border-border/50 last:border-0 hover:bg-background/20">
      <td className="px-4 py-2.5 text-xs font-semibold text-foreground">{docTypeLabel(doc.type)}</td>
      <td className="px-4 py-2.5 text-xs text-muted-foreground">{doc.label || "—"}</td>
      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">{doc.expiryDate}</td>
      <td className={`whitespace-nowrap px-4 py-2.5 text-xs font-medium ${status.color}`}>{status.label}</td>
      <td className="px-4 py-2.5 text-xs">
        {doc.fileUrl ? (
          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {doc.fileName || "View"}
          </a>
        ) : "—"}
      </td>
      <td className="px-4 py-2.5 text-xs text-muted-foreground">{doc.notes || "—"}</td>
      <td className="px-4 py-2.5">
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
      </td>
    </tr>
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
              <Select value={form.type} onValueChange={(v) => update("type", v)}>
                <SelectTrigger className="h-10 rounded-xl border-border/70 bg-background/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/70 bg-card/95 backdrop-blur">
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="rounded-lg">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

function ShareVehicleDialog({
  open,
  onOpenChange,
  vehicleId,
  vehicleName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  vehicleName: string;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const { data: shares = [] } = useQuery({
    queryKey: ["shares", vehicleId],
    queryFn: () => fetchShares(vehicleId),
    enabled: open,
  });

  const shareMutation = useMutation({
    mutationFn: (e: string) => shareVehicle(vehicleId, e),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shares", vehicleId] });
      setEmail("");
      setError("");
    },
    onError: (err: Error) => setError(err.message),
  });

  const unshareMutation = useMutation({
    mutationFn: (userId: string) => unshareVehicle(vehicleId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shares", vehicleId] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return;
    shareMutation.mutate(email.trim().toLowerCase());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{vehicleName}"</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
          <Input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            className="h-10 flex-1 rounded-xl border-border/70 bg-background/30"
          />
          <Button
            type="submit"
            className="bg-primary text-primary-foreground"
            disabled={shareMutation.isPending || !email.trim()}
          >
            {shareMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
          </Button>
        </form>
        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="mt-2 text-xs text-muted-foreground">
          Shared users can view and edit this vehicle's data but cannot delete it or manage sharing.
        </div>

        {shares.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">Shared with</div>
            {shares.map((share) => (
              <div key={share.userId} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/20 px-3 py-2">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={share.picture ?? undefined} alt={share.name} />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                    {share.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-foreground">{share.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{share.email}</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive hover:bg-destructive/10"
                  onClick={() => unshareMutation.mutate(share.userId)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

type BuildNoteRow = { key: string; value: string; date: string; cost: string; notes: string };

function BuildNotesTab({
  notes,
  vehicleId,
}: {
  notes: BuildNote[];
  vehicleId: string;
}) {
  const queryClient = useQueryClient();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const emptyRow: BuildNoteRow = { key: "", value: "", date: "", cost: "", notes: "" };
  const [editForm, setEditForm] = useState<BuildNoteRow>(emptyRow);

  const toPayload = (rows: BuildNoteRow[]) => rows.map((n) => ({
    key: n.key,
    value: n.value,
    date: n.date || null,
    cost: n.cost ? Math.round(parseFloat(n.cost) * 100) : null,
    notes: n.notes || null,
  }));

  const toRow = (n: BuildNote): BuildNoteRow => ({
    key: n.key,
    value: n.value,
    date: n.date ?? "",
    cost: n.cost ? (n.cost / 100).toString() : "",
    notes: n.notes ?? "",
  });

  const mutation = useMutation({
    mutationFn: (rows: BuildNoteRow[]) => upsertBuildNotes(vehicleId, toPayload(rows)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildNotes", vehicleId] });
      setEditingIdx(null);
      setAdding(false);
    },
  });

  const startEdit = (idx: number) => {
    setAdding(false);
    setEditingIdx(idx);
    setEditForm(toRow(notes[idx]));
  };

  const startAdd = () => {
    setEditingIdx(null);
    setEditForm(emptyRow);
    setAdding(true);
  };

  const saveEdit = () => {
    if (!editForm.key.trim()) return;
    const rows = notes.map(toRow);
    if (editingIdx !== null) {
      rows[editingIdx] = editForm;
    }
    mutation.mutate(rows);
  };

  const saveAdd = () => {
    if (!editForm.key.trim()) return;
    mutation.mutate([...notes.map(toRow), editForm]);
  };

  const deleteNote = (idx: number) => {
    mutation.mutate(notes.filter((_, i) => i !== idx).map(toRow));
  };

  const cancel = () => { setEditingIdx(null); setAdding(false); };

  const upd = (field: keyof BuildNoteRow, val: string) => setEditForm((p) => ({ ...p, [field]: val }));

  const totalCost = notes.reduce((s, n) => s + (n.cost ?? 0), 0);

  const editRow = (
    <tr className="border-b border-border/50 last:border-0 bg-background/30">
      <td className="px-3 py-2"><Input value={editForm.key} onChange={(e) => upd("key", e.target.value)} placeholder="Key" className="h-8 text-xs" /></td>
      <td className="px-3 py-2"><Input value={editForm.value} onChange={(e) => upd("value", e.target.value)} placeholder="Value" className="h-8 text-xs" /></td>
      <td className="px-3 py-2"><Input type="date" value={editForm.date} onChange={(e) => upd("date", e.target.value)} className="h-8 text-xs" /></td>
      <td className="px-3 py-2"><Input type="number" step="0.01" value={editForm.cost} onChange={(e) => upd("cost", e.target.value)} placeholder="0.00" className="h-8 text-xs" /></td>
      <td className="px-3 py-2"><Input value={editForm.notes} onChange={(e) => upd("notes", e.target.value)} placeholder="Notes" className="h-8 text-xs" /></td>
      <td className="px-3 py-2">
        <div className="flex gap-1">
          <Button size="sm" className="h-7 px-2 text-xs bg-primary text-primary-foreground" onClick={adding ? saveAdd : saveEdit} disabled={!editForm.key.trim() || mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-3 animate-spin" /> : "Save"}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={cancel}>
            <X className="size-3" />
          </Button>
        </div>
      </td>
    </tr>
  );

  if (notes.length === 0 && !adding) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-background/20 p-6 text-center">
        <div className="text-sm font-semibold">No build notes yet</div>
        <div className="text-xs text-muted-foreground">
          Track modifications, tyres, accessories, and any important notes.
        </div>
        <Button className="rounded-2xl bg-primary text-primary-foreground" onClick={startAdd}>
          <Plus className="mr-2 size-4" />
          Add build note
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground mb-2">
        Track modifications, tyres, accessories, and any important notes.
      </div>
      {totalCost > 0 && (
        <div className="rounded-2xl border border-border/70 bg-background/20 px-4 py-3 inline-block">
          <div className="text-xs text-muted-foreground">Total build cost</div>
          <div className="text-sm font-semibold">₹{(totalCost / 100).toFixed(2)}</div>
        </div>
      )}
      <div className="overflow-x-auto rounded-2xl border border-border/70">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/70 bg-background/30">
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Key</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Value</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Date</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Cost</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Notes</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground w-16"></th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note, i) =>
              editingIdx === i ? editRow : (
                <tr key={note.id} className="border-b border-border/50 last:border-0 hover:bg-background/20 group">
                  <td className="px-4 py-2.5 text-xs font-medium text-muted-foreground">{note.key}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-foreground">{note.value}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{note.date || "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{note.cost ? `₹${(note.cost / 100).toFixed(2)}` : "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{note.notes || "—"}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(i)} className="text-muted-foreground hover:text-foreground">
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete "${note.key}"?`)) deleteNote(i); }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
            {adding && editRow}
          </tbody>
        </table>
      </div>
      {!adding && editingIdx === null && (
        <Button variant="secondary" className="rounded-2xl bg-secondary/60" onClick={startAdd}>
          <Plus className="mr-2 size-4" />
          Add build note
        </Button>
      )}
    </div>
  );
}

function fuelUnit(fuelType: string) {
  return fuelType === "electric" ? "kWh" : "L";
}

function fuelEfficiencyUnit(fuelType: string) {
  return fuelType === "electric" ? "km/kWh" : "km/L";
}

function formatCost(minor: number) {
  return (minor / 100).toFixed(2);
}

type FuelFormRow = { date: string; amount: string; cost: string; odoKm: string; fullTank: boolean; station: string; notes: string };

function FuelTab({
  logs,
  vehicle,
  vehicleId,
}: {
  logs: FuelLog[];
  vehicle: Vehicle | undefined;
  vehicleId: string;
}) {
  const queryClient = useQueryClient();
  const ft = vehicle?.fuelType ?? "petrol";
  const unit = fuelUnit(ft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const emptyForm: FuelFormRow = { date: format(new Date(), "yyyy-MM-dd"), amount: "", cost: "", odoKm: "", fullTank: true, station: "", notes: "" };
  const [form, setForm] = useState<FuelFormRow>(emptyForm);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["fuelLogs", vehicleId] });

  const createMut = useMutation({
    mutationFn: (data: Parameters<typeof createFuelLog>[1]) => createFuelLog(vehicleId, data),
    onSuccess: () => { invalidate(); setAdding(false); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateFuelLog>[2] }) => updateFuelLog(vehicleId, id, data),
    onSuccess: () => { invalidate(); setEditingId(null); },
  });
  const deleteMut = useMutation({ mutationFn: (id: string) => deleteFuelLog(vehicleId, id), onSuccess: invalidate });

  const startEdit = (log: FuelLog) => {
    setAdding(false);
    setEditingId(log.id);
    setForm({ date: log.date, amount: log.amount, cost: String(log.cost / 100), odoKm: String(log.odoKm), fullTank: log.fullTank, station: log.station ?? "", notes: log.notes ?? "" });
  };

  const startAdd = () => { setEditingId(null); setForm(emptyForm); setAdding(true); };
  const cancel = () => { setEditingId(null); setAdding(false); };
  const upd = (field: keyof FuelFormRow, val: any) => setForm((p) => ({ ...p, [field]: val }));

  const toPayload = () => ({
    date: form.date,
    amount: form.amount,
    cost: Math.round(parseFloat(form.cost) * 100),
    odoKm: parseInt(form.odoKm),
    fullTank: form.fullTank,
    station: form.station || null,
    notes: form.notes || null,
  });

  const saveAdd = (e: React.FormEvent) => { e.preventDefault(); createMut.mutate(toPayload()); };
  const saveEdit = (e: React.FormEvent) => { e.preventDefault(); if (editingId) updateMut.mutate({ id: editingId, data: toPayload() }); };
  const saving = createMut.isPending || updateMut.isPending;

  // Calculate stats
  const sorted = [...logs].sort((a, b) => a.odoKm - b.odoKm);
  let totalCost = 0;
  const efficiencies: { date: string; kpl: number }[] = [];

  for (let i = 0; i < sorted.length; i++) {
    totalCost += sorted[i].cost;
    if (i > 0 && sorted[i].fullTank) {
      let prevIdx = -1;
      for (let j = i - 1; j >= 0; j--) { if (sorted[j].fullTank) { prevIdx = j; break; } }
      if (prevIdx >= 0) {
        const distKm = sorted[i].odoKm - sorted[prevIdx].odoKm;
        let segFuel = 0;
        for (let k = prevIdx + 1; k <= i; k++) segFuel += parseFloat(sorted[k].amount);
        if (distKm > 0 && segFuel > 0) efficiencies.push({ date: sorted[i].date, kpl: distKm / segFuel });
      }
    }
  }

  const avgEfficiency = efficiencies.length > 0 ? efficiencies.reduce((s, e) => s + e.kpl, 0) / efficiencies.length : null;
  const totalDistKm = sorted.length >= 2 ? sorted[sorted.length - 1].odoKm - sorted[0].odoKm : 0;
  const costPerKm = totalDistKm > 0 ? totalCost / totalDistKm : null;

  const formRow = (onSubmit: (e: React.FormEvent) => void) => (
    <tr className="border-b border-border/50 last:border-0 bg-background/30">
      <td className="px-3 py-2"><Input type="date" value={form.date} onChange={(e) => upd("date", e.target.value)} className="h-8 text-xs" required /></td>
      <td className="px-3 py-2"><Input type="number" step="0.01" value={form.amount} onChange={(e) => upd("amount", e.target.value)} placeholder="5.0" className="h-8 text-xs" required /></td>
      <td className="px-3 py-2"><Input type="number" step="0.01" value={form.cost} onChange={(e) => upd("cost", e.target.value)} placeholder="500" className="h-8 text-xs" required /></td>
      <td className="px-3 py-2"><Input type="number" value={form.odoKm} onChange={(e) => upd("odoKm", e.target.value)} placeholder="37500" className="h-8 text-xs" required /></td>
      <td className="px-3 py-2">
        <Select value={form.fullTank ? "yes" : "no"} onValueChange={(v) => upd("fullTank", v === "yes")}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-3 py-2"><Input value={form.station} onChange={(e) => upd("station", e.target.value)} placeholder="Station" className="h-8 text-xs" /></td>
      <td className="px-3 py-2">
        <div className="flex gap-1">
          <Button size="sm" className="h-7 px-2 text-xs bg-primary text-primary-foreground" onClick={onSubmit} disabled={!form.amount || !form.cost || !form.odoKm || saving}>
            {saving ? <Loader2 className="size-3 animate-spin" /> : "Save"}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={cancel}><X className="size-3" /></Button>
        </div>
      </td>
    </tr>
  );

  if (logs.length === 0 && !adding) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-background/20 p-6 text-center">
        <div className="text-sm font-semibold">No fuel logs yet</div>
        <div className="text-xs text-muted-foreground">
          Log each fill-up or charge to track fuel economy and costs.
        </div>
        <Button className="rounded-2xl bg-primary text-primary-foreground" onClick={startAdd}>
          <Fuel className="mr-2 size-4" />
          Add fuel log
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-background/20 px-4 py-3">
          <div className="text-xs text-muted-foreground">Avg efficiency</div>
          <div className="text-sm font-semibold">{avgEfficiency ? `${avgEfficiency.toFixed(1)} ${fuelEfficiencyUnit(ft)}` : "—"}</div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/20 px-4 py-3">
          <div className="text-xs text-muted-foreground">Cost / km</div>
          <div className="text-sm font-semibold">{costPerKm ? `₹${(costPerKm / 100).toFixed(2)}` : "—"}</div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/20 px-4 py-3">
          <div className="text-xs text-muted-foreground">Total fuel spent</div>
          <div className="text-sm font-semibold">₹{formatCost(totalCost)}</div>
        </div>
      </div>

      {/* Efficiency trend */}
      {efficiencies.length >= 2 && (
        <div className="rounded-2xl border border-border/70 bg-background/20 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
            <TrendingUp className="size-3.5" />
            Efficiency trend ({fuelEfficiencyUnit(ft)})
          </div>
          <div className="flex items-end gap-1 h-16">
            {(() => {
              const maxKpl = Math.max(...efficiencies.map(e => e.kpl));
              return efficiencies.map((e, i) => (
                <div key={i} className="flex-1 rounded-t bg-primary/60 hover:bg-primary/80 transition-colors relative group" style={{ height: `${(e.kpl / maxKpl) * 100}%`, minHeight: 4 }}>
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-card border border-border rounded-lg px-2 py-1 text-xs whitespace-nowrap z-10">
                    {e.kpl.toFixed(1)} {fuelEfficiencyUnit(ft)} — {e.date}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Log table */}
      <div className="overflow-x-auto rounded-2xl border border-border/70">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/70 bg-background/30">
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Date</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">{unit}</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Cost</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Odo (km)</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Full</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Station</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground w-16"></th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) =>
              editingId === log.id ? formRow(saveEdit) : (
                <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-background/20 group">
                  <td className="px-4 py-2.5 text-xs font-medium">{log.date}</td>
                  <td className="px-4 py-2.5 text-xs">{parseFloat(log.amount).toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-xs">₹{formatCost(log.cost)}</td>
                  <td className="px-4 py-2.5 text-xs">{log.odoKm.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-xs">{log.fullTank ? "Yes" : "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{log.station || "—"}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(log)} className="text-muted-foreground hover:text-foreground"><Pencil className="size-3.5" /></button>
                      <button onClick={() => { if (confirm("Delete this fuel log?")) deleteMut.mutate(log.id); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
                    </div>
                  </td>
                </tr>
              )
            )}
            {adding && formRow(saveAdd)}
          </tbody>
        </table>
      </div>

      {!adding && !editingId && (
        <Button variant="secondary" className="rounded-2xl bg-secondary/60" onClick={startAdd}>
          <Plus className="mr-2 size-4" />
          Add fuel log
        </Button>
      )}
    </div>
  );
}

export default function Garage() {
  const [activeId, setActiveId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("vehicle");
  });
  const [search, setSearch] = useState<string>("");
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showEditVehicle, setShowEditVehicle] = useState(false);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [defaultTab, setDefaultTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "history";
  });
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

  const { data: fuelLogsList = [] } = useQuery({
    queryKey: ["fuelLogs", currentActiveId],
    queryFn: () => fetchFuelLogs(currentActiveId!),
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
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="grid size-11 place-items-center rounded-2xl border border-border/80 bg-card/60 shadow-sm backdrop-blur">
                  <Logo className="size-6 text-primary" />
                </div>
                <div className="leading-tight">
                  <div className="rg-title text-base font-semibold">
                    Pocket Garage
                  </div>
                  <div className="text-xs text-muted-foreground">
                    One interface for all your vehicles.
                  </div>
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/">
                <Button variant="secondary" className="bg-secondary/60">
                  <ChevronLeft className="mr-2 size-4" />
                  Home
                </Button>
              </Link>
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="relative flex-1 mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <div className="rg-noise rounded-[28px] border border-border/70 bg-card/40 p-5 shadow-md backdrop-blur md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl">
                <h1 className="rg-title text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl">
                  Your vehicles, organized.
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Add anything you own or maintain — motorcycles, cars, and
                  more. Track service intervals, history, and build notes in one
                  clean view.
                </p>
              </div>

              {user && (
                <Button
                  className="bg-primary text-primary-foreground"
                  onClick={() => setShowAddVehicle(true)}
                >
                  <Plus className="mr-2 size-4" />
                  Add vehicle
                </Button>
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
              <div className="mt-6 space-y-6">
                {/* Vehicle list — horizontal scrollable strip */}
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

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

                {/* Vehicle detail — full-width below */}
                {activeVehicle && (
                  <motion.section
                    key={activeVehicle.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="rg-noise rounded-[28px] border border-border/70 bg-card/40 p-5 shadow-md backdrop-blur md:p-7"
                  >
                    {/* Header row with stats */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-semibold text-muted-foreground">
                            Selected vehicle
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              activeVehicle.status === "sold"
                                ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            }
                          >
                            {activeVehicle.status === "sold" ? "Sold" : "Owned"}
                          </Badge>
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
                        {activeVehicle.userId === user?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 hover:bg-primary/10"
                            onClick={() => setShowEditVehicle(true)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}
                        {activeVehicle.userId === user?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 hover:bg-primary/10"
                            onClick={() => setShowShare(true)}
                          >
                            <Share2 className="size-4" />
                          </Button>
                        )}
                        {activeVehicle.userId === user?.id && (
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
                        )}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {(() => {
                        const sp = serviceProgress(activeVehicle);
                        const v = activeVehicle;
                        const overdue = sp.remainingKm === 0 || (sp.remainingDays !== null && sp.remainingDays <= 0);
                        const dueText = sp.nextDate && sp.remainingDays !== null
                          ? sp.remainingDays > 0 ? `${sp.remainingDays}d left` : `${Math.abs(sp.remainingDays)}d overdue`
                          : null;
                        return (
                          <div className={`rounded-3xl border p-4 ${overdue ? "border-amber-500/40 bg-amber-500/5" : "border-border/70 bg-background/20"}`}>
                            <div className="flex items-center gap-2">
                              <div className="grid size-8 place-items-center rounded-lg border border-border/70 bg-background/30">
                                <Wrench className="size-3.5 text-primary" strokeWidth={2.2} />
                              </div>
                              <div className="text-xs font-medium text-muted-foreground">Service due</div>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <div className={`text-lg font-semibold ${overdue ? "text-amber-500" : "text-foreground"}`}>{km(sp.remainingKm)} left</div>
                              {dueText && <div className={`text-lg font-semibold ${overdue ? "text-amber-500" : "text-foreground"}`}>{dueText}</div>}
                            </div>
                            <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground/70">
                              <span>Last: {km(v.lastServiceKm)}{v.lastServiceDate ? ` · ${v.lastServiceDate}` : ""}</span>
                              <span>Next: {km(sp.nextKm)}{sp.nextDate ? ` · ${sp.nextDate}` : ""}</span>
                            </div>
                          </div>
                        );
                      })()}

                      {documents.length > 0 && (() => {
                        const nearestDoc = documents.reduce((a, b) =>
                          new Date(a.expiryDate) < new Date(b.expiryDate) ? a : b
                        );
                        const status = expiryStatus(nearestDoc.expiryDate);
                        return (
                          <div className={
                            "rounded-3xl border p-4 " +
                            (status.urgent
                              ? "border-amber-500/40 bg-amber-500/5"
                              : "border-border/70 bg-background/20")
                          }>
                            <div className="flex items-center gap-2">
                              <div className="grid size-8 place-items-center rounded-lg border border-border/70 bg-background/30">
                                <ShieldCheck className="size-3.5 text-primary" strokeWidth={2.2} />
                              </div>
                              <div className="text-xs font-medium text-muted-foreground">
                                Nearest expiry
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-lg font-semibold text-foreground">
                                {docTypeLabel(nearestDoc.type)}
                              </span>
                              <span className={`text-xs font-medium ${status.color}`}>
                                {status.label}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {(() => {
                        const historyCost = serviceRecords.reduce((s, r) => s + r.amount, 0); // whole rupees
                        const fuelCost = fuelLogsList.reduce((s, l) => s + l.cost, 0) / 100; // paise → rupees
                        const buildCost = buildNotes.reduce((s, n) => s + (n.cost ?? 0), 0) / 100; // paise → rupees
                        const totalCost = historyCost + fuelCost + buildCost;
                        return (
                          <div className="rounded-3xl border border-border/70 bg-background/20 p-4">
                            <div className="flex items-center gap-2">
                              <div className="grid size-8 place-items-center rounded-lg border border-border/70 bg-background/30">
                                <IndianRupee className="size-3.5 text-primary" strokeWidth={2.2} />
                              </div>
                              <div className="text-xs font-medium text-muted-foreground">Total cost</div>
                            </div>
                            <div className="mt-2 text-lg font-semibold text-foreground">
                              {totalCost > 0 ? formatMoney(totalCost) : "—"}
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {serviceRecords.length + fuelLogsList.length + buildNotes.filter(n => n.cost).length} {serviceRecords.length + fuelLogsList.length + buildNotes.filter(n => n.cost).length === 1 ? "entry" : "entries"}
                            </div>
                          </div>
                        );
                      })()}

                    </div>


                    {/* Tabs — full-width with tables */}
                    <Tabs defaultValue={defaultTab} className="mt-5 w-full">
                      <TabsList className="inline-flex rounded-2xl bg-secondary/60">
                        <TabsTrigger value="history" className="rounded-2xl">
                          History
                        </TabsTrigger>
                        <TabsTrigger value="documents" className="rounded-2xl">
                          Docs
                        </TabsTrigger>
                        <TabsTrigger value="fuel" className="rounded-2xl">
                          Fuel
                        </TabsTrigger>
                        <TabsTrigger value="build" className="rounded-2xl">
                          Build
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="history" className="mt-4">
                        {serviceRecords.length === 0 ? (
                          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-background/20 p-6 text-center">
                            <div className="text-sm font-semibold">
                              No maintenance logs yet
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Add your first maintenance entry to start building
                              a trustworthy history.
                            </div>
                            <Button
                              className="rounded-2xl bg-primary text-primary-foreground"
                              onClick={() => setShowAddMaintenance(true)}
                            >
                              <Wrench className="mr-2 size-4" />
                              Add maintenance
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <ServiceTable
                              records={serviceRecords}
                              vehicleId={currentActiveId!}
                              onEdit={setEditingRecord}
                            />
                            <Button
                              variant="secondary"
                              className="rounded-2xl bg-secondary/60"
                              onClick={() => setShowAddMaintenance(true)}
                            >
                              <Plus className="mr-2 size-4" />
                              Add maintenance
                            </Button>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="documents" className="mt-4">
                        {documents.length === 0 ? (
                          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-background/20 p-6 text-center">
                            <div className="text-sm font-semibold">
                              No documents yet
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Track insurance and PUC expiry dates, optionally attach photos or PDFs.
                            </div>
                            <Button
                              className="rounded-2xl bg-primary text-primary-foreground"
                              onClick={() => setShowAddDocument(true)}
                            >
                              <FileText className="mr-2 size-4" />
                              Add document
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="overflow-x-auto rounded-2xl border border-border/70">
                              <table className="w-full text-left text-sm">
                                <thead>
                                  <tr className="border-b border-border/70 bg-background/30">
                                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Type</th>
                                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Label</th>
                                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Expiry</th>
                                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">File</th>
                                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Notes</th>
                                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {documents.map((doc) => {
                                    const status = expiryStatus(doc.expiryDate);
                                    return (
                                      <DocumentRow key={doc.id} doc={doc} status={status} vehicleId={activeVehicle.id} />
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            <Button
                              variant="secondary"
                              className="rounded-2xl bg-secondary/60"
                              onClick={() => setShowAddDocument(true)}
                            >
                              <Plus className="mr-2 size-4" />
                              Add document
                            </Button>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="fuel" className="mt-4">
                        <FuelTab
                          logs={fuelLogsList}
                          vehicle={activeVehicle}
                          vehicleId={currentActiveId!}
                        />
                      </TabsContent>

                      <TabsContent value="build" className="mt-4">
                        <BuildNotesTab
                          notes={buildNotes}
                          vehicleId={currentActiveId!}
                        />
                      </TabsContent>
                    </Tabs>
                  </motion.section>
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
          {editingRecord && (
            <EditMaintenanceDialog
              open={!!editingRecord}
              onOpenChange={(open) => { if (!open) setEditingRecord(null); }}
              vehicleId={currentActiveId}
              record={editingRecord}
            />
          )}
          <AddDocumentDialog
            open={showAddDocument}
            onOpenChange={setShowAddDocument}
            vehicleId={currentActiveId}
          />
          {activeVehicle && (
            <>
              <EditVehicleDialog
                open={showEditVehicle}
                onOpenChange={setShowEditVehicle}
                vehicle={activeVehicle}
              />
              <ShareVehicleDialog
                open={showShare}
                onOpenChange={setShowShare}
                vehicleId={currentActiveId}
                vehicleName={activeVehicle.nickname}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

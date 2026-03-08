import { LogIn, LogOut, Settings, User } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCurrentUser, logout } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserMenu() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return null;

  if (!user) {
    return (
      <a href="/api/auth/google">
        <Button variant="secondary" className="gap-2 rounded-xl bg-secondary/60">
          <LogIn className="size-4" />
          <span className="hidden sm:inline">Sign in</span>
        </Button>
      </a>
    );
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    window.location.href = "/";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative size-9 rounded-xl border border-border/70 p-0"
        >
          <Avatar className="size-9 rounded-xl">
            <AvatarImage src={user.picture ?? undefined} alt={user.name} />
            <AvatarFallback className="rounded-xl bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 rounded-2xl border-border/70 bg-card/95 p-2 backdrop-blur"
      >
        <div className="flex items-center gap-3 px-2 py-3">
          <Avatar className="size-10 rounded-xl">
            <AvatarImage src={user.picture ?? undefined} alt={user.name} />
            <AvatarFallback className="rounded-xl bg-primary/10 text-sm font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">
              {user.name}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {user.email}
            </div>
          </div>
        </div>
        <DropdownMenuSeparator className="bg-border/70" />
        <Link href="/profile">
          <DropdownMenuItem className="gap-2 rounded-xl px-3 py-2 cursor-pointer">
            <Settings className="size-4" />
            Profile & Settings
          </DropdownMenuItem>
        </Link>
        <DropdownMenuItem
          onClick={handleLogout}
          className="gap-2 rounded-xl px-3 py-2 text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

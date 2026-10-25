import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  BrainCircuit,
  CalendarCheck,
  FileText,
  Flame,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/planner", label: "Study Planner", icon: CalendarCheck },
  { to: "/dsa", label: "DSA Tracker", icon: ListChecks },
  { to: "/interview", label: "AI Interview Coach", icon: BrainCircuit },
  { to: "/resume", label: "Resume Analyzer", icon: FileText },
  { to: "/quiz", label: "Quizzes", icon: Sparkles },
  { to: "/analytics", label: "Readiness", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function Logo() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2">
      <span className="grid size-9 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-soft">
        <Sparkles className="size-5" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-foreground">PrepMate</span>
    </Link>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
  activeTo,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  activeTo: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
    router.invalidate();
  }

  const navList = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.to === activeTo;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-sidebar-accent-foreground hover:bg-sidebar-accent",
            )}
          >
            <item.icon className={cn("size-4.5", active ? "" : "text-primary")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <div className="px-2 pb-6">
          <Logo />
        </div>
        {navList()}
        <div className="mt-auto rounded-2xl bg-primary-soft p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Flame className="size-4" />
            Stay consistent
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Small daily wins compound into offers. Keep your streak alive!
          </p>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar px-4 py-6 shadow-lift">
            <div className="flex items-center justify-between px-2 pb-6">
              <Logo />
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="size-5" />
              </Button>
            </div>
            {navList(() => setMobileOpen(false))}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
            <div className="hidden md:block lg:hidden">
              <Logo />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold leading-tight md:text-xl">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground md:text-sm">{subtitle}</p>}
            </div>
          </div>
          <UserMenu onSignOut={handleSignOut} />
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

export function UserMenu({ onSignOut }: { onSignOut: () => void }) {
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");

  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setName((data.user?.user_metadata?.full_name as string) ?? data.user?.email?.split("@")[0] ?? "");
    });
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full outline-none ring-ring focus-visible:ring-2" aria-label="Account menu">
          <Avatar className="size-9 border border-border">
            <AvatarFallback className="bg-primary-soft text-sm font-bold text-primary">
              {name ? name[0].toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="truncate text-sm font-semibold">{name || "Student"}</div>
          <div className="truncate text-xs font-normal text-muted-foreground">{email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => (window.location.hash = "", (window.location.pathname = "/profile"))}>
          <User className="size-4" /> Profile & settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onSignOut}>
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

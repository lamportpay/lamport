/**
 * LamportPay Admin application shell: a persistent left sidebar (a drawer on
 * mobile), a top bar with the signed-in admin and sign-out, and a content
 * area. Apart from the logo it shares nothing with the marketing site's header
 * or footer, so admin reads as its own product.
 */
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  Coins,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  ScrollText,
  Settings,
  Users,
  type LucideIcon,
  BadgeCheck,
  Send,
  ArrowUpRight,
  ShieldCheck,
  Search,
  MessageSquareWarning,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BrandLogo } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useModeStatus } from "@/lib/use-mode-status";

type NavItem = { to: string; label: string; icon: LucideIcon };

const ADMIN_NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Workspace",
    items: [
      { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/payments", label: "Payments", icon: ReceiptText },
      { to: "/admin/payouts", label: "Payouts", icon: Send },
    ],
  },
  {
    section: "Customers & access",
    items: [
      { to: "/admin/complaints", label: "Complaints & chats", icon: MessageSquareWarning },
      { to: "/admin/verified-customers", label: "Verified customers", icon: BadgeCheck },
      { to: "/admin/users", label: "Users & roles", icon: Users },
    ],
  },
  {
    section: "Revenue",
    items: [
      { to: "/admin/fees-revenue", label: "Fees & Revenue", icon: Coins },
      { to: "/admin/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    section: "System",
    items: [
      { to: "/admin/audit-logs", label: "Audit logs", icon: ScrollText },
      { to: "/admin/system-status", label: "System status", icon: Activity },
      { to: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

function Brand() {
  return (
    <Link
      to="/admin/dashboard"
      aria-label="LamportPay Admin dashboard"
      className="flex items-center gap-2 px-2"
    >
      <BrandLogo className="h-7" />
      <span className="rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-background">
        Admin
      </span>
    </Link>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const [search, setSearch] = useState("");
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const groups = ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      `${group.section} ${item.label}`.toLowerCase().includes(search.trim().toLowerCase()),
    ),
  })).filter((group) => group.items.length);
  return (
    <nav className="space-y-5" aria-label="Admin">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          aria-label="Find admin page"
          placeholder="Find a page…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="bg-background pl-9"
        />
      </div>
      {groups.length === 0 && <p className="px-3 text-xs text-muted-foreground">No pages found.</p>}
      {groups.map((group) => (
        <div key={group.section} className="space-y-1">
          <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.section}
          </div>
          {group.items.map(({ to, label, icon: Icon }) => (
            <Button
              asChild
              variant="ghost"
              key={to}
              className={`h-10 w-full justify-start px-3 text-sm ${pathname === to || pathname.startsWith(`${to}/`) ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground" : "text-muted-foreground"}`}
            >
              <Link
                key={to}
                to={to}
                onClick={onNavigate}
                aria-current={pathname === to || pathname.startsWith(`${to}/`) ? "page" : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            </Button>
          ))}
        </div>
      ))}
    </nav>
  );
}

function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const signOut = async () => {
    setBusy(true);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      navigate({ to: "/admin/login", search: { next: "/admin" }, replace: true });
    } catch (error) {
      setBusy(false);
      toast.error(error instanceof Error ? error.message : "Could not sign out.");
    }
  };
  return { busy, signOut };
}

export function AdminShell({ email, children }: { email: string | null; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { busy, signOut } = useSignOut();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const currentPage = ADMIN_NAV.flatMap((group) => group.items).find(
    (item) => pathname === item.to || pathname.startsWith(`${item.to}/`),
  );
  const { status, indicator } = useModeStatus();

  return (
    <div className="min-h-screen bg-muted/40 text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="h-16 flex items-center border-b border-border/60 px-3">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <SidebarNav />
        </div>
        <div className="border-t border-border/60 p-3 text-xs text-muted-foreground">
          <Button
            asChild
            variant="ghost"
            className="w-full justify-between text-xs text-muted-foreground"
          >
            <Link to="/">
              View public site
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 overflow-y-auto bg-sidebar p-0">
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <div className="h-16 flex items-center border-b border-border/60 px-3">
            <Brand />
          </div>
          <div className="px-3 py-5">
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between gap-3 border-b border-border/60 bg-background/90 backdrop-blur px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <Link
              to="/admin/dashboard"
              aria-label="LamportPay Admin dashboard"
              className="lg:hidden shrink-0"
            >
              <BrandLogo className="h-7" />
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Admin</span>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{currentPage?.label ?? "Workspace"}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-semibold sm:text-xs">
              {status
                ? status.mode === "test"
                  ? "DEMO / SIMULATED"
                  : indicator.label
                : "MODE UNVERIFIED"}
            </span>
            {email && (
              <span className="hidden sm:block text-sm text-muted-foreground truncate max-w-[220px]">
                {email}
              </span>
            )}
            <Button variant="outline" size="sm" disabled={busy} onClick={() => void signOut()}>
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Sign out
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-[1600px] px-4 py-6 md:px-7 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Page frame: breadcrumb, title, optional description and actions. */
export function AdminPage({
  title,
  description,
  actions,
  crumbs = [],
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  crumbs?: { label: string; to?: string }[];
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-6">
      <div className="space-y-2">
        <nav
          aria-label="Breadcrumb"
          className="text-xs text-muted-foreground flex flex-wrap gap-1.5"
        >
          <Link to="/admin/dashboard" className="hover:text-foreground">
            Admin
          </Link>
          {crumbs.map((c) => (
            <span key={c.label} className="flex gap-1.5">
              <span>/</span>
              {c.to ? (
                <Link to={c.to} className="hover:text-foreground">
                  {c.label}
                </Link>
              ) : (
                <span className="text-foreground">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl break-words">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

/** A white card section with an optional heading. */
export function Panel({
  title,
  description,
  actions,
  children,
}: {
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-border bg-card p-4 sm:p-5 space-y-4">
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            {title && <h2 className="font-semibold">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </div>
      <div className="mt-3 break-words text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-2">{hint}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background p-6 text-sm text-muted-foreground">
      {label}
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
      {error instanceof Error ? error.message : "Something went wrong."}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="p-4 text-sm text-muted-foreground">{children}</p>;
}

/**
 * A button that asks for confirmation before a dangerous or irreversible
 * admin action (revoking a role, changing the revenue wallet, …).
 */
export function ConfirmButton({
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  disabled,
  children,
  variant = "outline",
  size = "sm",
  "aria-label": ariaLabel,
}: {
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  disabled?: boolean;
  children: ReactNode;
  variant?: "outline" | "ghost" | "default" | "destructive";
  size?: "sm" | "default";
  "aria-label"?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} disabled={disabled} aria-label={ariaLabel}>
          {children}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground">{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

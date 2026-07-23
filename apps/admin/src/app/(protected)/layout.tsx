"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRequireAdminAuth } from "@/hooks/use-require-admin-auth";
import type { AdminRole } from "@raheja/shared";

interface NavItem {
  href: string;
  label: string;
  roles: AdminRole[];
}

// Mirrors the role table in architecture doc §7.1. Items are hidden
// (not just disabled) for roles that can't use them — this is a UX
// convenience only; the actual enforcement is Firestore Security Rules
// plus each page's own useRequireAdminAuth(roles) call.
const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", roles: ["super_admin", "operations", "procurement", "read_only"] },
  { href: "/orders", label: "Orders", roles: ["super_admin", "operations", "read_only"] },
  { href: "/procurement", label: "Procurement", roles: ["super_admin", "procurement", "read_only"] },
  { href: "/packing-list", label: "Packing List", roles: ["super_admin", "operations", "read_only"] },
  { href: "/fruits", label: "Fruits", roles: ["super_admin", "procurement", "read_only"] },
  { href: "/buildings", label: "Buildings", roles: ["super_admin", "operations", "read_only"] },
  { href: "/customers", label: "Residents", roles: ["super_admin", "operations", "read_only"] },
  { href: "/audit-log", label: "Audit Log", roles: ["super_admin", "read_only"] },
  { href: "/settings", label: "Business Settings", roles: ["super_admin"] },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useRequireAdminAuth();
  const { admin } = useAuth();
  const pathname = usePathname();

  if (loading || !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(admin.role));

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border px-4 py-6">
        <p className="mb-1 text-sm font-semibold">Raheja Fruits Admin</p>
        <p className="mb-6 text-xs text-muted-foreground">
          {admin.name} · {ROLE_LABELS[admin.role]}
        </p>
        <nav className="flex flex-1 flex-col gap-1">
          {visibleItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <SignOutButton />
      </aside>
      <main className="flex-1 px-6 py-6">{children}</main>
    </div>
  );
}

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  operations: "Operations",
  procurement: "Procurement",
  read_only: "Read Only",
};

function SignOutButton() {
  const handleSignOut = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleSignOut}
      className="mt-auto rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      Sign out
    </button>
  );
}

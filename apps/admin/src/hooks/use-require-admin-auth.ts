"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./use-auth";
import type { AdminRole } from "@raheja/shared";

// Firestore Security Rules are the real enforcement layer (see
// firestore.rules — every collection an admin can write to checks
// hasAdminRole(...) server-side). This hook is the UX layer: redirect
// signed-out or deactivated visitors before they see a blank dashboard,
// and let individual pages restrict themselves by role.
export function useRequireAdminAuth(allowedRoles?: AdminRole[]) {
  const { user, admin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!admin || !admin.isActive) {
      router.replace("/login?error=inactive");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(admin.role)) {
      router.replace("/?error=forbidden");
    }
  }, [loading, user, admin, allowedRoles, router]);

  const authorized =
    !loading &&
    !!user &&
    !!admin?.isActive &&
    (!allowedRoles || allowedRoles.includes(admin.role));

  return { loading: loading || (!!user && !admin), authorized };
}

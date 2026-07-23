"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./use-auth";

// Firestore Security Rules are the real enforcement layer — this hook is
// purely a UX redirect so a signed-out visitor doesn't sit on a blank
// catalogue page. Use in any Client Component page under a protected
// route (catalogue, cart, checkout, orders).
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  return { loading };
}

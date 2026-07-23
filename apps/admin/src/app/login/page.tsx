"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { adminLoginSchema, type AdminLoginInput } from "@raheja/shared";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";

const ERROR_MESSAGES: Record<string, string> = {
  inactive: "Your admin account isn't active. Contact a super admin for access.",
  forbidden: "You don't have permission to view that page.",
};

// useSearchParams() requires a Suspense boundary somewhere above it for
// Next.js's static build step — this default export is just that
// boundary; all the actual page logic lives in AdminLoginForm below.
export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, admin, loading: authLoading } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const queryError = searchParams.get("error");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
  });

  // Already signed in with a valid, active admin account -> skip the form.
  useEffect(() => {
    if (!authLoading && user && admin?.isActive) {
      router.replace("/");
    }
  }, [authLoading, user, admin, router]);

  const onSubmit = async (data: AdminLoginInput) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      // useRequireAdminAuth on the destination page handles the
      // isActive / role check once `admin` loads; if it turns out the
      // account isn't active, that hook will bounce back here with
      // ?error=inactive rather than leaving them signed in on a blank page.
      router.push("/");
    } catch (err) {
      console.error("Admin login failed", err);
      setServerError("Incorrect email or password.");
      await signOut(auth).catch(() => {});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold">Raheja Fruits Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to continue.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="rounded-md border border-border bg-background px-3 py-2 text-base"
            {...register("email")}
          />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="rounded-md border border-border bg-background px-3 py-2 text-base"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {(serverError || (queryError && ERROR_MESSAGES[queryError])) && (
          <p role="alert" className="text-sm text-red-600">
            {serverError ?? ERROR_MESSAGES[queryError!]}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-md bg-primary px-4 py-3 text-primary-foreground disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { httpsCallable } from "firebase/functions";
import { signInWithCustomToken } from "firebase/auth";
import Link from "next/link";
import {
  loginSchema,
  type LoginInput,
  type VerifyPinResult,
} from "@raheja/shared";
import { auth, functions } from "@/lib/firebase/client";
import { usePublicBusinessSettings } from "@/lib/business-settings";

export default function LoginPage() {
  const router = useRouter();
  const { settings } = usePublicBusinessSettings();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "+91", pin: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const verifyPin = httpsCallable<LoginInput, VerifyPinResult>(functions, "verifyPin");
      const { data: result } = await verifyPin(data);

      if (!result.ok || !result.customToken) {
        setServerError(result.error ?? "Couldn't log in. Please try again.");
        return;
      }

      await signInWithCustomToken(auth, result.customToken);
      router.push("/catalogue");
    } catch (err) {
      console.error("Login failed", err);
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold">Log in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your mobile number and PIN.
        </p>
      </div>

      {settings.maintenanceMode && (
        <p className="rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">
          {settings.maintenanceMessage || "We're temporarily unavailable for new orders."} You can still log in to view past orders.
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="text-sm font-medium">
            Mobile number
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+919876543210"
            className="rounded-md border border-border bg-background px-3 py-2 text-base"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="pin" className="text-sm font-medium">
            PIN
          </label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            maxLength={6}
            placeholder="4-6 digit PIN"
            className="rounded-md border border-border bg-background px-3 py-2 text-base tracking-widest"
            {...register("pin")}
          />
          {errors.pin && <p className="text-sm text-red-600">{errors.pin.message}</p>}
        </div>

        {serverError && (
          <p role="alert" className="text-sm text-red-600">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-md bg-primary px-4 py-3 text-primary-foreground disabled:opacity-60"
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="font-medium text-primary underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}

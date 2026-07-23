"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  variant?: "success" | "error";
  onDismiss: () => void;
}

// Auto-dismisses after a few seconds so the admin doesn't have to
// manually close it — a save confirmation shouldn't linger forever.
export function Toast({ message, variant = "success", onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="status"
      className={`fixed bottom-6 right-6 z-50 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${
        variant === "success"
          ? "border-primary/20 bg-primary text-primary-foreground"
          : "border-berry/20 bg-berry text-berry-foreground"
      }`}
    >
      {message}
    </div>
  );
}

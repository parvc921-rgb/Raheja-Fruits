"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { saveBusinessSettings } from "@/lib/settings";
import { businessSettingsSchema, DEFAULT_BUSINESS_SETTINGS } from "@raheja/shared";
import type { BusinessSettings, BusinessSettingsInput } from "@raheja/shared";
import { StoreSection } from "./store-section";
import { OrdersSection } from "./orders-section";
import { BusinessHoursSection } from "./business-hours-section";
import { CustomersSection } from "./customers-section";
import { PaymentsSection } from "./payments-section";
import { NotificationsSection } from "./notifications-section";
import { HomepageSection } from "./homepage-section";
import { InvoiceSection } from "./invoice-section";
import { Toast } from "./toast";

interface SettingsFormProps {
  settings: BusinessSettings;
}

// Strips the two server-stamped fields off a full BusinessSettings doc
// so what's left matches the form's own input shape exactly.
function toFormValues(settings: BusinessSettings): BusinessSettingsInput {
  const { updatedAt: _updatedAt, updatedBy: _updatedBy, ...formValues } = settings;
  return formValues;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const { admin } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<BusinessSettingsInput>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: toFormValues(settings),
  });

  // Re-sync the form whenever the underlying doc changes elsewhere
  // (e.g. another super_admin saved in a different tab) — but only
  // while this form has no unsaved edits, so we never silently
  // overwrite something the admin is in the middle of typing.
  useEffect(() => {
    if (!isDirty) reset(toFormValues(settings));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally excludes isDirty/reset to avoid re-running on every keystroke
  }, [settings]);

  const onSubmit = async (values: BusinessSettingsInput) => {
    if (!admin) {
      setServerError("Your session expired. Please sign in again.");
      return;
    }

    setServerError(null);
    setSubmitting(true);
    try {
      await saveBusinessSettings(values, settings, { uid: admin.id, role: admin.role });
      reset(values); // clears isDirty so a future real-time update (e.g. another
        // super_admin saving in a different tab) is allowed to sync in again
      setToast({ message: "Business settings saved.", variant: "success" });
    } catch (err) {
      console.error("saveBusinessSettings failed", err);
      setServerError("Couldn't save settings. Please try again.");
      setToast({ message: "Couldn't save settings.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => reset(toFormValues(settings));

  const handleResetToDefault = () => {
    if (!confirm("Reset all fields to their default values? This won't be saved until you click Save.")) {
      return;
    }
    reset(DEFAULT_BUSINESS_SETTINGS as BusinessSettingsInput);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <StoreSection register={register} errors={errors} />
      <OrdersSection register={register} errors={errors} />
      <BusinessHoursSection register={register} errors={errors} />
      <CustomersSection register={register} errors={errors} />
      <PaymentsSection register={register} errors={errors} />
      <NotificationsSection register={register} errors={errors} />
      <HomepageSection register={register} errors={errors} />
      <InvoiceSection register={register} errors={errors} />

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <div className="sticky bottom-0 flex flex-wrap gap-2 rounded-lg border border-border bg-card p-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={submitting}
          className="rounded-md border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleResetToDefault}
          disabled={submitting}
          className="ml-auto rounded-md border border-border px-5 py-2.5 text-sm font-medium text-berry hover:bg-berry/5 disabled:opacity-60"
        >
          Reset to Default
        </button>
      </div>

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </form>
  );
}

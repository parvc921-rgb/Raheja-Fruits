"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRequireAdminAuth } from "@/hooks/use-require-admin-auth";
import { CustomerList } from "@/components/customers/customer-list";
import { CustomerDetail } from "@/components/customers/customer-detail";
import type { Customer } from "@raheja/shared";

export default function CustomersPage() {
  const { loading, authorized } = useRequireAdminAuth(["super_admin", "operations", "read_only"]);
  const { admin } = useAuth();
  const [selected, setSelected] = useState<Customer | null>(null);

  if (loading || !authorized) return null;

  const canWrite = admin?.role === "super_admin" || admin?.role === "operations";

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-semibold">Residents</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <CustomerList onSelect={setSelected} selectedId={selected?.id ?? null} />

        <div>
          {selected ? (
            <CustomerDetail customer={selected} canWrite={canWrite} />
          ) : (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Select a customer to view details.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

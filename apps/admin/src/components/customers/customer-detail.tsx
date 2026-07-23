"use client";

import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/client";
import { useBuildings } from "@/lib/buildings";
import { useCustomerOrderHistory } from "@/lib/customers";
import { formatDate } from "@/lib/format";
import type { Customer, CustomerMutationResult } from "@raheja/shared";

interface CustomerDetailProps {
  customer: Customer;
  canWrite: boolean;
}

export function CustomerDetail({ customer, canWrite }: CustomerDetailProps) {
  const { buildings } = useBuildings();
  const { orders, loading: ordersLoading } = useCustomerOrderHistory(customer.id);
  const [updating, setUpdating] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [editBuildingId, setEditBuildingId] = useState(customer.buildingId);
  const [editWing, setEditWing] = useState(customer.wing);
  const [editFlatNumber, setEditFlatNumber] = useState(customer.flatNumber);

  const buildingName = buildings.find((b) => b.id === customer.buildingId)?.name ?? "—";
  const editSelectedBuilding = buildings.find((b) => b.id === editBuildingId);

  const handleToggleStatus = async () => {
    const nextStatus = customer.status === "active" ? "disabled" : "active";
    if (
      nextStatus === "disabled" &&
      !confirm(`Disable ${customer.name}'s account? They won't be able to log in or order.`)
    ) {
      return;
    }
    if (
      customer.status === "pending" &&
      !confirm(`Approve ${customer.name}'s account? They'll be able to log in and place orders.`)
    ) {
      return;
    }
    setUpdating(true);
    try {
      const setCustomerStatus = httpsCallable<
        { customerId: string; status: "active" | "disabled" },
        CustomerMutationResult
      >(functions, "setCustomerStatus");
      const { data } = await setCustomerStatus({ customerId: customer.id, status: nextStatus });
      if (!data.ok) console.error("setCustomerStatus failed", data.error);
    } catch (err) {
      console.error("setCustomerStatus failed", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleStartEditAddress = () => {
    setEditBuildingId(customer.buildingId);
    setEditWing(customer.wing);
    setEditFlatNumber(customer.flatNumber);
    setAddressError(null);
    setEditingAddress(true);
  };

  const handleSaveAddress = async () => {
    setAddressError(null);
    if (!editBuildingId || !editWing || !editFlatNumber.trim()) {
      setAddressError("Please fill in building, wing, and flat number.");
      return;
    }
    setSavingAddress(true);
    try {
      const updateCustomerAddress = httpsCallable<
        { customerId: string; buildingId: string; wing: string; flatNumber: string },
        CustomerMutationResult
      >(functions, "updateCustomerAddress");
      const { data } = await updateCustomerAddress({
        customerId: customer.id,
        buildingId: editBuildingId,
        wing: editWing,
        flatNumber: editFlatNumber.trim(),
      });
      if (!data.ok) {
        setAddressError(data.error ?? "Couldn't update the address.");
        return;
      }
      setEditingAddress(false);
    } catch (err) {
      console.error("updateCustomerAddress failed", err);
      setAddressError("Something went wrong. Please try again.");
    } finally {
      setSavingAddress(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold">{customer.name}</h2>
          <p className="text-sm text-muted-foreground">{customer.phone}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            customer.status === "active"
              ? "bg-primary/10 text-primary"
              : customer.status === "pending"
                ? "bg-muted text-muted-foreground"
                : "bg-berry/10 text-berry"
          }`}
        >
          {customer.status}
        </span>
      </div>

      <div className="mt-3 border-t border-border pt-3 text-sm">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Delivery address</p>
          {canWrite && !editingAddress && (
            <button
              onClick={handleStartEditAddress}
              className="text-xs font-medium text-primary hover:underline"
            >
              Edit
            </button>
          )}
        </div>

        {editingAddress ? (
          <div className="mt-2 flex flex-col gap-2">
            <select
              value={editBuildingId}
              onChange={(e) => {
                setEditBuildingId(e.target.value);
                setEditWing("");
              }}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option value="">Select building</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              value={editWing}
              onChange={(e) => setEditWing(e.target.value)}
              disabled={!editSelectedBuilding}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-50"
            >
              <option value="">{editSelectedBuilding ? "Select wing" : "Pick a building first"}</option>
              {editSelectedBuilding?.wings.map((w) => (
                <option key={w} value={w}>
                  Wing {w}
                </option>
              ))}
            </select>
            <input
              value={editFlatNumber}
              onChange={(e) => setEditFlatNumber(e.target.value)}
              placeholder="Flat number"
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            />
            {addressError && <p className="text-sm text-red-600">{addressError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSaveAddress}
                disabled={savingAddress}
                className="flex-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {savingAddress ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => setEditingAddress(false)}
                disabled={savingAddress}
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p>
            {buildingName}, Wing {customer.wing}, Flat {customer.flatNumber}
          </p>
        )}
      </div>

      <div className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
        Member since {formatDate(customer.createdAt)}
        {customer.lastOrderAt && <> · last ordered {formatDate(customer.lastOrderAt)}</>}
      </div>

      {canWrite && (
        <button
          onClick={handleToggleStatus}
          disabled={updating}
          className={`mt-4 w-full rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${
            customer.status === "active"
              ? "border border-berry text-berry hover:bg-berry/5"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {updating
            ? "Updating…"
            : customer.status === "active"
              ? "Disable account"
              : customer.status === "pending"
                ? "Approve account"
                : "Re-enable account"}
        </button>
      )}

      <div className="mt-5 border-t border-border pt-4">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Order history</h3>
        {ordersLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground">{formatDate(order.placedAt)}</span>
                <span className="text-muted-foreground">
                  {order.items.reduce((sum, i) => sum + i.quantity, 0)} items
                </span>
                <span className="font-medium">₹{order.subtotal}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

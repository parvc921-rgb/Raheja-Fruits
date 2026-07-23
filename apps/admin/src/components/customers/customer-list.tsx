"use client";

import { useMemo, useState } from "react";
import { useCustomers } from "@/lib/customers";
import { useBuildings } from "@/lib/buildings";
import type { Customer } from "@raheja/shared";

interface CustomerListProps {
  onSelect: (customer: Customer) => void;
  selectedId: string | null;
}

export function CustomerList({ onSelect, selectedId }: CustomerListProps) {
  const { customers, loading } = useCustomers();
  const { buildings } = useBuildings();
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [wingFilter, setWingFilter] = useState("");

  const buildingName = (id: string) => buildings.find((b) => b.id === id)?.name ?? id;
  const selectedBuilding = buildings.find((b) => b.id === buildingFilter);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (buildingFilter && c.buildingId !== buildingFilter) return false;
      if (wingFilter && c.wing !== wingFilter) return false;
      if (!term) return true;
      return c.name.toLowerCase().includes(term) || c.phone.includes(term);
    });
  }, [customers, search, buildingFilter, wingFilter]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or phone…"
          className="min-w-[200px] flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        />
        <select
          value={buildingFilter}
          onChange={(e) => {
            setBuildingFilter(e.target.value);
            setWingFilter(""); // reset wing when the building changes
          }}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All buildings</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          value={wingFilter}
          onChange={(e) => setWingFilter(e.target.value)}
          disabled={!selectedBuilding}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-50"
        >
          <option value="">{selectedBuilding ? "All wings" : "Pick a building first"}</option>
          {selectedBuilding?.wings.map((w) => (
            <option key={w} value={w}>
              Wing {w}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading customers…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No customers match.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Phone</th>
                <th className="px-3 py-2 font-medium">Address</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className={`cursor-pointer border-t border-border hover:bg-muted/50 ${
                    selectedId === c.id ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="px-3 py-2 font-medium">{c.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.phone}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {buildingName(c.buildingId)} · {c.wing}-{c.flatNumber}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        c.status === "active"
                          ? "bg-primary/10 text-primary"
                          : c.status === "disabled"
                            ? "bg-berry/10 text-berry"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

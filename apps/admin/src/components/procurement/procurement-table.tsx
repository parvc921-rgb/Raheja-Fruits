import type { ProcurementRow } from "@/lib/procurement";

export function ProcurementTable({ rows }: { rows: ProcurementRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No orders for this delivery date yet.
      </p>
    );
  }

  const totalItems = rows.reduce((sum, r) => sum + r.totalQuantity, 0);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Fruit</th>
            <th className="px-3 py-2 font-medium">Unit</th>
            <th className="px-3 py-2 font-medium">Total quantity</th>
            <th className="px-3 py-2 font-medium">Orders</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.fruitId} className="border-t border-border">
              <td className="px-3 py-2 font-medium">{row.name}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.unit}</td>
              <td className="px-3 py-2 font-display font-semibold text-primary">
                {row.totalQuantity}
              </td>
              <td className="px-3 py-2 text-muted-foreground">{row.orderCount}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-muted/50">
            <td className="px-3 py-2 font-medium" colSpan={2}>
              Total
            </td>
            <td className="px-3 py-2 font-display font-semibold">{totalItems}</td>
            <td className="px-3 py-2" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

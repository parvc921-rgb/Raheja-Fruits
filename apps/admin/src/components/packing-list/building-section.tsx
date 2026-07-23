import { PackingOrderCard } from "./packing-order-card";
import type { BuildingGroup } from "@/lib/packing-list";

export function BuildingSection({
  group,
  buildingName,
  canWrite,
}: {
  group: BuildingGroup;
  buildingName: string;
  canWrite: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <h2 className="mb-3 font-display text-lg font-semibold">
        {buildingName}{" "}
        <span className="text-sm font-normal text-muted-foreground">
          · {group.orderCount} {group.orderCount === 1 ? "order" : "orders"}
        </span>
      </h2>

      <div className="flex flex-col gap-4">
        {group.wings.map((wingGroup) => (
          <div key={wingGroup.wing}>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              Wing {wingGroup.wing}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {wingGroup.orders.map((order) => (
                <PackingOrderCard key={order.id} order={order} canWrite={canWrite} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

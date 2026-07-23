import type { OrderStatus } from "@raheja/shared";

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  placed: {
    label: "Order placed",
    className: "bg-muted text-muted-foreground",
  },
  packed: {
    label: "Packed",
    className: "bg-accent/15 text-accent",
  },
  out_for_delivery: {
    label: "Out for delivery",
    className: "bg-accent/15 text-accent",
  },
  delivered: {
    label: "Delivered",
    className: "bg-primary/10 text-primary",
  },
  undelivered: {
    label: "Not delivered",
    className: "bg-berry/10 text-berry",
  },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

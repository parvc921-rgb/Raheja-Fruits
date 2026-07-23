interface MinOrderProgressProps {
  subtotal: number;
  minimumOrder: number;
}

export function MinOrderProgress({ subtotal, minimumOrder }: MinOrderProgressProps) {
  const remaining = minimumOrder - subtotal;
  const pct = Math.min(100, Math.round((subtotal / minimumOrder) * 100));

  if (remaining <= 0) {
    return (
      <p className="text-sm text-primary">
        ✓ Minimum order of ₹{minimumOrder} reached
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm text-muted-foreground">
        Add ₹{remaining} more to reach the ₹{minimumOrder} minimum
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

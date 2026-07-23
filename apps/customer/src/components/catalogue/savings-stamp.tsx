// The one bold element on the page — everything else stays quiet so
// this reads as a genuine "good deal" stamp, the way a market vendor
// might mark down a price by hand. Rotation + dashed ring + slightly
// irregular ink-stamp feel (via mix-blend + soft shadow) do the work;
// no gradients, no extra ornament.

export function SavingsStamp({ amount }: { amount: number }) {
  if (amount <= 0) return null;

  return (
    <div
      className="pointer-events-none absolute -right-2 -top-2 flex h-14 w-14 -rotate-[10deg] select-none items-center justify-center rounded-full border-2 border-dashed border-accent bg-accent/95 text-center shadow-sm"
      aria-hidden="true"
    >
      <span className="font-display text-[10px] font-semibold uppercase leading-tight tracking-wide text-accent-foreground">
        Save
        <br />₹{amount}
      </span>
    </div>
  );
}

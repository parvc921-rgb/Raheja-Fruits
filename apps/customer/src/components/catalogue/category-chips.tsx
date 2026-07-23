"use client";

interface CategoryChipsProps {
  categories: string[];
  active: string | null;
  onSelect: (category: string | null) => void;
}

export function CategoryChips({ categories, active, onSelect }: CategoryChipsProps) {
  if (categories.length === 0) return null;

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Filter by category">
      <Chip label="All" selected={active === null} onClick={() => onSelect(null)} />
      {categories.map((category) => (
        <Chip
          key={category}
          label={category}
          selected={active === category}
          onClick={() => onSelect(category)}
        />
      ))}
    </div>
  );
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/50"
      }`}
    >
      {label}
    </button>
  );
}

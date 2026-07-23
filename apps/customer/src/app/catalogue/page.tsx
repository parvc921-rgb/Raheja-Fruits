"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAuth } from "@/hooks/use-auth";
import { useFruits } from "@/lib/fruits";
import { usePublicBusinessSettings } from "@/lib/business-settings";
import { FruitCard } from "@/components/catalogue/fruit-card";
import { CategoryChips } from "@/components/catalogue/category-chips";
import { CartBar } from "@/components/catalogue/cart-bar";

export default function CataloguePage() {
  const { loading: authLoading } = useRequireAuth();
  const { profile } = useAuth();
  const { fruits, loading: fruitsLoading } = useFruits();
  const { settings: businessSettings } = usePublicBusinessSettings();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    fruits.forEach((f) => f.category && set.add(f.category));
    return Array.from(set);
  }, [fruits]);

  const visibleFruits = useMemo(
    () =>
      activeCategory ? fruits.filter((f) => f.category === activeCategory) : fruits,
    [fruits, activeCategory]
  );

  if (authLoading) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">Loading…</p>;
  }

  // Maintenance mode blocks browsing/ordering entirely (order history
  // stays reachable — see the link below — since there's no reason to
  // hide someone's own past orders during a maintenance window).
  if (businessSettings.maintenanceMode) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="font-display text-xl font-semibold">We&apos;ll be right back</p>
        <p className="text-sm text-muted-foreground">
          {businessSettings.maintenanceMessage || "We're temporarily unavailable. Please check back shortly."}
        </p>
        <Link href="/orders" className="mt-2 text-sm font-medium text-primary underline">
          View order history
        </Link>
      </main>
    );
  }

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 pb-3 pt-5 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Today&apos;s Fruits
            </h1>
            {profile && (
              <p className="text-sm text-muted-foreground">
                Delivering to {profile.wing}-{profile.flatNumber}
              </p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">
              Store hours: {businessSettings.businessHours.open}–{businessSettings.businessHours.close}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Link href="/orders" className="text-xs text-muted-foreground underline">
              Order history
            </Link>
          </div>
        </div>

        {businessSettings.holidayMessage && (
          <div className="mx-auto mt-3 max-w-2xl rounded-md border border-berry/30 bg-berry/10 px-3 py-2 text-sm text-berry">
            {businessSettings.holidayMessage}
          </div>
        )}

        <div className="mx-auto mt-3 max-w-2xl">
          <CategoryChips
            categories={categories}
            active={activeCategory}
            onSelect={setActiveCategory}
          />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-4">
        {fruitsLoading ? (
          <CatalogueSkeleton />
        ) : visibleFruits.length === 0 ? (
          <EmptyState hasCategory={activeCategory !== null} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visibleFruits.map((fruit) => (
              <FruitCard key={fruit.id} fruit={fruit} />
            ))}
          </div>
        )}

        {(businessSettings.supportPhone || businessSettings.supportWhatsapp || businessSettings.supportEmail) && (
          <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            <p>Need help?</p>
            <p className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1">
              {businessSettings.supportPhone && <span>Call {businessSettings.supportPhone}</span>}
              {businessSettings.supportWhatsapp && <span>WhatsApp {businessSettings.supportWhatsapp}</span>}
              {businessSettings.supportEmail && <span>{businessSettings.supportEmail}</span>}
            </p>
          </div>
        )}
      </main>

      <CartBar />
    </div>
  );
}

function CatalogueSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-lg border border-border">
          <div className="aspect-square bg-muted" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
            <div className="h-8 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasCategory }: { hasCategory: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 py-16 text-center">
      <p className="font-display text-lg font-medium">
        {hasCategory ? "Nothing in this category right now" : "No fruits available right now"}
      </p>
      <p className="text-sm text-muted-foreground">
        {hasCategory
          ? "Try another category, or check back tomorrow."
          : "Check back soon, or try again tomorrow."}
      </p>
    </div>
  );
}

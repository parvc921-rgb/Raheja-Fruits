// Placeholder catalogue with realistic price points — retail vs member
// price gaps are illustrative, not sourced from anywhere real. Photos
// are intentionally left blank (imageUrl: "") since Storage uploads
// need real files; the catalogue UI already falls back to a text
// placeholder when imageUrl is empty. Add real photos afterward via the
// admin app's Fruit Management screen.
export interface SeedFruit {
  slug: string;
  name: string;
  unit: "kg" | "dozen" | "piece" | "box";
  category: string;
  retailPrice: number;
  memberPrice: number;
  sortOrder: number;
}

export const SEED_FRUITS: SeedFruit[] = [
  { slug: "apple-shimla", name: "Shimla Apple", unit: "kg", category: "Pome", retailPrice: 220, memberPrice: 185, sortOrder: 10 },
  { slug: "banana-robusta", name: "Banana (Robusta)", unit: "dozen", category: "Tropical", retailPrice: 60, memberPrice: 48, sortOrder: 20 },
  { slug: "orange-nagpur", name: "Nagpur Orange", unit: "kg", category: "Citrus", retailPrice: 140, memberPrice: 115, sortOrder: 30 },
  { slug: "mango-alphonso", name: "Alphonso Mango", unit: "dozen", category: "Tropical", retailPrice: 900, memberPrice: 750, sortOrder: 40 },
  { slug: "papaya", name: "Papaya", unit: "piece", category: "Tropical", retailPrice: 55, memberPrice: 45, sortOrder: 50 },
  { slug: "pineapple", name: "Pineapple", unit: "piece", category: "Tropical", retailPrice: 90, memberPrice: 75, sortOrder: 60 },
  { slug: "grapes-green", name: "Green Grapes", unit: "kg", category: "Berries", retailPrice: 130, memberPrice: 105, sortOrder: 70 },
  { slug: "pomegranate", name: "Pomegranate", unit: "kg", category: "Berries", retailPrice: 180, memberPrice: 150, sortOrder: 80 },
  { slug: "watermelon", name: "Watermelon", unit: "piece", category: "Melon", retailPrice: 70, memberPrice: 55, sortOrder: 90 },
  { slug: "kiwi", name: "Kiwi", unit: "box", category: "Exotic", retailPrice: 250, memberPrice: 210, sortOrder: 100 },
  { slug: "guava", name: "Guava", unit: "kg", category: "Pome", retailPrice: 95, memberPrice: 78, sortOrder: 110 },
  { slug: "sweet-lime", name: "Sweet Lime (Mosambi)", unit: "kg", category: "Citrus", retailPrice: 90, memberPrice: 72, sortOrder: 120 },
];

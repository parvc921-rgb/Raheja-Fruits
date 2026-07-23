// Placeholder data — replace with the real approved Raheja Estate
// building list before going live. `slug` becomes the Firestore doc ID
// so re-running the seed script updates these in place instead of
// creating duplicates.
export interface SeedBuilding {
  slug: string;
  name: string;
  wings: string[];
}

export const SEED_BUILDINGS: SeedBuilding[] = [
  { slug: "acropolis-tower-a", name: "Raheja Acropolis - Tower A", wings: ["A", "B"] },
  { slug: "acropolis-tower-b", name: "Raheja Acropolis - Tower B", wings: ["A", "B"] },
  { slug: "vivarea", name: "Raheja Vivarea", wings: ["A", "B", "C"] },
  { slug: "classique", name: "Raheja Classique", wings: ["A", "B"] },
  { slug: "exotica", name: "Raheja Exotica", wings: ["A", "B", "C", "D"] },
];

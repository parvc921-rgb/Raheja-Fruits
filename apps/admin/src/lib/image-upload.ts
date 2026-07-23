import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/client";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// Milestone 2: one image per fruit, stored at a path keyed by the
// fruit's own Firestore document ID (fruit-images/{fruitId}) rather than
// a random filename — re-uploading for the same fruit simply overwrites
// its existing photo instead of orphaning the old file in Storage.
//
// Callers must have a fruitId before calling this. For a brand-new
// fruit that doesn't have one yet, pre-generate it client-side with
// doc(collection(db, "fruits")).id (see lib/fruit-mutations.ts's
// newFruitId()) and use that same ID for both the image path and the
// Firestore document — see storage.rules for the matching write rule.
export async function uploadFruitImage(file: File, fruitId: string): Promise<string> {
  if (!fruitId) {
    throw new Error("A fruit ID is required before uploading an image.");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Image must be smaller than 5MB.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const storageRef = ref(storage, `fruit-images/${fruitId}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

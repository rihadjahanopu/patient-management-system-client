/**
 * medicine-sync.ts
 *
 * Sync Engine: MongoDB ↔ In-memory cache
 *
 * - MongoDB  → Source of truth (persists across all deploys)
 * - In-memory cache → Fast reads, no DB cost per search
 *
 * No file system involved — works identically on local dev and Vercel.
 */

const BACKEND_URL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export type RawMedicineRecord = Record<string, unknown>;

// ─── In-Memory Cache ──────────────────────────────────────────────────────────
let inMemoryCache: RawMedicineRecord[] | null = null;
let lastSyncTime: number = 0;
const CACHE_TTL_MS: number = 5 * 60 * 1000; // 5 minutes

// ─── Sync from MongoDB ────────────────────────────────────────────────────────

/**
 * Fetch all custom medicines from MongoDB (via backend API)
 * and store in in-memory cache.
 */
export async function syncFromBackend(): Promise<RawMedicineRecord[]> {
  try {
    const res: Response = await fetch(`${BACKEND_URL}/medicines/custom`, {
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`Backend returned ${res.status}`);

    const data: { success: boolean; medicines: RawMedicineRecord[] } =
      (await res.json()) as { success: boolean; medicines: RawMedicineRecord[] };

    const medicines: RawMedicineRecord[] = data.medicines || [];

    inMemoryCache = medicines;
    lastSyncTime = Date.now();

    console.log(`✅ [medicine-sync] Synced ${medicines.length} custom medicines from DB.`);
    return medicines;
  } catch (err) {
    console.error('⚠️ [medicine-sync] Failed to sync from backend:', err);
    return inMemoryCache || [];
  }
}

/**
 * Get custom medicines from in-memory cache.
 * If cache is empty or stale, syncs from MongoDB automatically.
 */
export async function getLocalMedicines(): Promise<RawMedicineRecord[]> {
  const now: number = Date.now();

  if (inMemoryCache !== null && now - lastSyncTime < CACHE_TTL_MS) {
    return inMemoryCache;
  }

  return syncFromBackend();
}

/**
 * Add a medicine to the in-memory cache immediately
 * (called after a successful MongoDB save).
 */
export function addToLocalCache(medicine: RawMedicineRecord): void {
  const current: RawMedicineRecord[] = inMemoryCache || [];
  inMemoryCache = [medicine, ...current];
  lastSyncTime = Date.now();
}

/**
 * Remove a medicine from the in-memory cache immediately
 * (called after a successful MongoDB delete).
 */
export function removeFromLocalCache(brandName: string): void {
  const current: RawMedicineRecord[] = inMemoryCache || [];
  inMemoryCache = current.filter(
    (m: RawMedicineRecord) =>
      String(m['brand name'] ?? '').toLowerCase() !== brandName.toLowerCase()
  );
  lastSyncTime = Date.now();
}

/**
 * Force invalidate cache — next call to getLocalMedicines() will re-sync from DB.
 */
export function invalidateCache(): void {
  inMemoryCache = null;
  lastSyncTime = 0;
}

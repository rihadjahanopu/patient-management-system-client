/**
 * test-sync.ts
 *
 * Sync Engine for Medical Tests & Lab Investigations:
 * - MongoDB → Source of truth (persists across Vercel/Render deploys)
 * - In-memory cache → Ultra-fast reads for Doctors, zero DB cost per search
 *
 * No file system involved — works identically on local dev and cloud servers.
 */

import { MedicalTest } from './types';

const BACKEND_URL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── In-Memory Cache ──────────────────────────────────────────────────────────
let inMemoryCache: MedicalTest[] | null = null;
let lastSyncTime: number = 0;
const CACHE_TTL_MS: number = 5 * 60 * 1000; // 5 minutes

// ─── Sync from MongoDB ────────────────────────────────────────────────────────

/**
 * Fetch all medical tests from MongoDB (via backend API)
 * and store in in-memory RAM cache.
 */
export async function syncMedicalTestsFromBackend(): Promise<MedicalTest[]> {
  try {
    const res: Response = await fetch(`${BACKEND_URL}/tests`, {
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`Backend returned ${res.status}`);

    const data: { success: boolean; tests: MedicalTest[] } =
      (await res.json()) as { success: boolean; tests: MedicalTest[] };

    const tests: MedicalTest[] = data.tests || [];

    inMemoryCache = tests;
    lastSyncTime = Date.now();

    console.log(`✅ [test-sync] Synced ${tests.length} medical tests from DB.`);
    return tests;
  } catch (err) {
    console.error('⚠️ [test-sync] Failed to sync tests from backend:', err);
    return inMemoryCache || [];
  }
}

/**
 * Get medical tests from in-memory RAM cache.
 * If cache is empty or stale (>5 min), syncs from MongoDB automatically.
 */
export async function getLocalMedicalTests(): Promise<MedicalTest[]> {
  const now: number = Date.now();

  if (inMemoryCache !== null && now - lastSyncTime < CACHE_TTL_MS) {
    return inMemoryCache;
  }

  return syncMedicalTestsFromBackend();
}

/**
 * Add a test to in-memory cache immediately (after DB save).
 */
export function addToLocalTestCache(test: MedicalTest): void {
  const current: MedicalTest[] = inMemoryCache || [];
  inMemoryCache = [test, ...current];
  lastSyncTime = Date.now();
}

/**
 * Update a test in in-memory cache immediately (after DB update).
 */
export function updateInLocalTestCache(test: MedicalTest): void {
  const current: MedicalTest[] = inMemoryCache || [];
  const id: string | undefined = test.id || test._id;
  inMemoryCache = current.map((t: MedicalTest) =>
    (t.id || t._id) === id ? { ...t, ...test } : t
  );
  lastSyncTime = Date.now();
}

/**
 * Remove a test from in-memory cache immediately (after DB delete).
 */
export function removeFromLocalTestCache(id: string): void {
  const current: MedicalTest[] = inMemoryCache || [];
  inMemoryCache = current.filter(
    (t: MedicalTest) => (t.id || t._id) !== id
  );
  lastSyncTime = Date.now();
}

/**
 * Invalidate cache to force next request to re-sync from DB.
 */
export function invalidateTestCache(): void {
  inMemoryCache = null;
  lastSyncTime = 0;
}

/**
 * Next.js API Route: /api/custom-medicines
 *
 * Sync Engine Gateway:
 * - GET  → Returns medicines from local cache/file (fast, no DB hit)
 *          If cache is empty → syncs from MongoDB first
 * - POST → Saves to MongoDB (via backend), then updates local cache+file
 * - DELETE → Deletes from MongoDB (via backend), then updates local cache+file
 *
 * This pattern ensures:
 *   1. Data persists across Vercel re-deploys (stored in MongoDB)
 *   2. Reads are fast (served from in-memory cache / JSON file)
 *   3. Writes always go to DB first (source of truth), then cache is updated
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getLocalMedicines,
  syncFromBackend,
  addToLocalCache,
  removeFromLocalCache,
  RawMedicineRecord,
} from '@/lib/medicine-sync';

const BACKEND_URL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper to get auth token from request headers
function getAuthToken(request: NextRequest): string | null {
  const authHeader: string | null = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  // Try cookie
  const cookieToken: string | undefined = request.cookies.get('token')?.value;
  return cookieToken || null;
}

// ─── GET — List all custom medicines (from cache/file, fallback to DB sync) ──
export async function GET() {
  try {
    const medicines: RawMedicineRecord[] = await getLocalMedicines();
    return NextResponse.json({ success: true, medicines });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to load custom medicines.' },
      { status: 500 }
    );
  }
}

// ─── POST — Add new custom medicine (DB first, then local cache) ───────────
export async function POST(request: NextRequest) {
  try {
    const token: string | null = getAuthToken(request);

    const body: {
      brandName: string;
      generic: string;
      dosageForm?: string;
      strength?: string;
      manufacturer?: string;
      type?: string;
    } = (await request.json()) as {
      brandName: string;
      generic: string;
      dosageForm?: string;
      strength?: string;
      manufacturer?: string;
      type?: string;
    };

    if (!body.brandName?.trim() || !body.generic?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Brand name and generic name are required.' },
        { status: 400 }
      );
    }

    // ── Step 1: Save to MongoDB via backend API ───────────────────────────
    const backendRes: Response = await fetch(`${BACKEND_URL}/medicines/custom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const backendData: {
      success: boolean;
      message: string;
      medicine?: Record<string, unknown>;
    } = (await backendRes.json()) as {
      success: boolean;
      message: string;
      medicine?: Record<string, unknown>;
    };

    if (!backendRes.ok) {
      return NextResponse.json(
        { success: false, message: backendData.message },
        { status: backendRes.status }
      );
    }

    // ── Step 2: Update local cache + JSON file ────────────────────────────
    if (backendData.medicine) {
      addToLocalCache(backendData.medicine);
    }

    return NextResponse.json({
      success: true,
      message: backendData.message,
      medicine: backendData.medicine,
    });
  } catch (err) {
    console.error('[/api/custom-medicines POST]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to add medicine. Please try again.' },
      { status: 500 }
    );
  }
}

// ─── DELETE — Remove custom medicine (DB first, then local cache) ──────────
export async function DELETE(request: NextRequest) {
  try {
    const token: string | null = getAuthToken(request);

    const body: { brandName: string } = (await request.json()) as { brandName: string };

    if (!body.brandName) {
      return NextResponse.json(
        { success: false, message: 'Brand name is required.' },
        { status: 400 }
      );
    }

    // ── Step 1: Delete from MongoDB via backend API ───────────────────────
    const backendRes: Response = await fetch(`${BACKEND_URL}/medicines/custom`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ brandName: body.brandName }),
      cache: 'no-store',
    });

    const backendData: { success: boolean; message: string } = (await backendRes.json()) as {
      success: boolean;
      message: string;
    };

    if (!backendRes.ok) {
      return NextResponse.json(
        { success: false, message: backendData.message },
        { status: backendRes.status }
      );
    }

    // ── Step 2: Remove from local cache + JSON file ───────────────────────
    removeFromLocalCache(body.brandName);

    return NextResponse.json({ success: true, message: backendData.message });
  } catch (err) {
    console.error('[/api/custom-medicines DELETE]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to remove medicine.' },
      { status: 500 }
    );
  }
}

// ─── PUT — Force sync from DB (useful after deploy / cache refresh) ──────
export async function PUT() {
  try {
    const medicines: RawMedicineRecord[] = await syncFromBackend();
    return NextResponse.json({
      success: true,
      message: `Synced ${medicines.length} medicines from database.`,
      medicines,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Sync from database failed.' },
      { status: 500 }
    );
  }
}

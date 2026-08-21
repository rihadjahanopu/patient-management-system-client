/**
 * Next.js API Gateway: /api/medical-tests
 *
 * In-Memory Sync Engine Gateway for Medical Tests:
 * - GET    → Returns tests from in-memory RAM cache (fast, zero DB hit)
 *            If cache is empty → auto-syncs from MongoDB
 * - POST   → Saves to MongoDB (via backend), then updates in-memory RAM cache
 * - PUT    → Updates in MongoDB (via backend), then updates in-memory RAM cache
 * - DELETE → Deletes from MongoDB (via backend), then updates in-memory RAM cache
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getLocalMedicalTests,
  syncMedicalTestsFromBackend,
  addToLocalTestCache,
  updateInLocalTestCache,
  removeFromLocalTestCache,
} from '@/lib/test-sync';
import { MedicalTest } from '@/lib/types';

const BACKEND_URL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getAuthToken(request: NextRequest): string | null {
  const authHeader: string | null = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const cookieToken: string | undefined = request.cookies.get('token')?.value;
  return cookieToken || null;
}

// ─── GET — List medical tests (from RAM cache, fallback to DB sync) ─────────
export async function GET() {
  try {
    const tests: MedicalTest[] = await getLocalMedicalTests();
    return NextResponse.json({ success: true, tests, count: tests.length });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to load medical tests.' },
      { status: 500 }
    );
  }
}

// ─── POST — Add new medical test (DB first, then RAM cache) ──────────────────
export async function POST(request: NextRequest) {
  try {
    const token: string | null = getAuthToken(request);
    const body: { testName: string; category?: string; price?: number; instructions?: string } =
      (await request.json()) as { testName: string; category?: string; price?: number; instructions?: string };

    if (!body.testName?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Test name is required.' },
        { status: 400 }
      );
    }

    // ── Step 1: Save to MongoDB via backend API ─────────────────────────────
    const backendRes: Response = await fetch(`${BACKEND_URL}/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const backendData: { success: boolean; message: string; test?: MedicalTest } =
      (await backendRes.json()) as { success: boolean; message: string; test?: MedicalTest };

    if (!backendRes.ok) {
      return NextResponse.json(
        { success: false, message: backendData.message },
        { status: backendRes.status }
      );
    }

    // ── Step 2: Update in-memory RAM cache ──────────────────────────────────
    if (backendData.test) {
      addToLocalTestCache(backendData.test);
    }

    return NextResponse.json({
      success: true,
      message: backendData.message,
      test: backendData.test,
    });
  } catch (err) {
    console.error('[/api/medical-tests POST]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to save test. Please try again.' },
      { status: 500 }
    );
  }
}

// ─── PUT — Update medical test (DB first, then RAM cache) ───────────────────
export async function PUT(request: NextRequest) {
  try {
    const token: string | null = getAuthToken(request);
    const body: { id: string; testName?: string; category?: string; price?: number; instructions?: string; isActive?: boolean } =
      (await request.json()) as { id: string; testName?: string; category?: string; price?: number; instructions?: string; isActive?: boolean };

    if (!body.id) {
      return NextResponse.json(
        { success: false, message: 'Test ID is required.' },
        { status: 400 }
      );
    }

    // ── Step 1: Update in MongoDB via backend API ───────────────────────────
    const backendRes: Response = await fetch(`${BACKEND_URL}/tests/${body.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const backendData: { success: boolean; message: string; test?: MedicalTest } =
      (await backendRes.json()) as { success: boolean; message: string; test?: MedicalTest };

    if (!backendRes.ok) {
      return NextResponse.json(
        { success: false, message: backendData.message },
        { status: backendRes.status }
      );
    }

    // ── Step 2: Update in-memory RAM cache ──────────────────────────────────
    if (backendData.test) {
      updateInLocalTestCache(backendData.test);
    }

    return NextResponse.json({
      success: true,
      message: backendData.message,
      test: backendData.test,
    });
  } catch (err) {
    console.error('[/api/medical-tests PUT]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to update test.' },
      { status: 500 }
    );
  }
}

// ─── DELETE — Remove medical test (DB first, then RAM cache) ───────────────
export async function DELETE(request: NextRequest) {
  try {
    const token: string | null = getAuthToken(request);
    const { searchParams } = new URL(request.url);
    const id: string = (searchParams.get('id') ?? '').trim();

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Test ID is required.' },
        { status: 400 }
      );
    }

    // ── Step 1: Delete from MongoDB via backend API ─────────────────────────
    const backendRes: Response = await fetch(`${BACKEND_URL}/tests/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    });

    const backendData: { success: boolean; message: string } =
      (await backendRes.json()) as { success: boolean; message: string };

    if (!backendRes.ok) {
      return NextResponse.json(
        { success: false, message: backendData.message },
        { status: backendRes.status }
      );
    }

    // ── Step 2: Remove from in-memory RAM cache ─────────────────────────────
    removeFromLocalTestCache(id);

    return NextResponse.json({ success: true, message: backendData.message });
  } catch (err) {
    console.error('[/api/medical-tests DELETE]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to remove test.' },
      { status: 500 }
    );
  }
}

// ─── PATCH — Force re-sync from DB ──────────────────────────────────────────
export async function PATCH() {
  try {
    const tests: MedicalTest[] = await syncMedicalTestsFromBackend();
    return NextResponse.json({
      success: true,
      message: `Synced ${tests.length} medical tests from database.`,
      tests,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Sync from database failed.' },
      { status: 500 }
    );
  }
}

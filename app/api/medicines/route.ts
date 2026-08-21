import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { RawMedicine, Medicine } from '@/lib/types';
import { MedicineDictionary } from '@/lib/dictionary-search';
import { getLocalMedicines, RawMedicineRecord } from '@/lib/medicine-sync';

let dictionaryInstance: MedicineDictionary | null = null;
let dictionaryBuiltAt: number = 0;
const DICTIONARY_TTL_MS: number = 5 * 60 * 1000; // 5 minutes

async function getDictionary(): Promise<MedicineDictionary> {
  const now: number = Date.now();

  // Rebuild dictionary if stale or missing
  if (dictionaryInstance && now - dictionaryBuiltAt < DICTIONARY_TTL_MS) {
    return dictionaryInstance;
  }

  try {
    // ── Step 1: Load main medicine.json (7.8MB, bundled with app) ────────
    let filePath: string = path.join(process.cwd(), 'medicine.json');
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), 'frontend', 'medicine.json');
    }

    let rawData: RawMedicine[] = [];
    if (fs.existsSync(filePath)) {
      const fileContent: string = fs.readFileSync(filePath, 'utf-8');
      rawData = JSON.parse(fileContent) as RawMedicine[];
    } else {
      console.warn('⚠️ medicine.json not found at', filePath);
    }

    // ── Step 2: Load custom medicines from sync engine ────────────────────
    // getLocalMedicines() handles both environments:
    //   Local dev  → reads custom-medicines.json file (written by writeFileSync)
    //   Vercel     → reads in-memory cache (synced from MongoDB on first request)
    // Either way, custom medicines come from the correct source automatically.
    const customMedicines: RawMedicineRecord[] = await getLocalMedicines();

    // ── Step 3: Merge — custom medicines appear first in search results ───
    const customAsRaw: RawMedicine[] = customMedicines as unknown as RawMedicine[];
    const merged: RawMedicine[] = [...customAsRaw, ...rawData];

    // ── Step 4: Normalize to Medicine type ───────────────────────────────
    const normalized: Medicine[] = merged.map((item: RawMedicine, index: number) => ({
      id: item['brand id'] || index + 1,
      brandName: item['brand name'] || '',
      type: item['type'] || 'allopathic',
      dosageForm: item['dosage form'] || '',
      generic: item['generic'] || '',
      strength: item['strength'] || '',
      manufacturer: item['manufacturer'] || '',
    }));

    dictionaryInstance = new MedicineDictionary(normalized);
    dictionaryBuiltAt = now;
    return dictionaryInstance;
  } catch (error) {
    console.error('Failed to build medicine dictionary:', error);
    return new MedicineDictionary([]);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query: string = (searchParams.get('q') ?? '').trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ medicines: [], totalMatches: 0 });
  }

  const startTime: number = Date.now();
  const dictionary: MedicineDictionary = await getDictionary();

  const results: Medicine[] = dictionary.search(query, 25);
  const executionTimeMs: number = Date.now() - startTime;

  return NextResponse.json({
    medicines: results,
    totalMatches: results.length,
    algorithm: 'Trie Dictionary Search',
    executionTimeMs,
  });
}

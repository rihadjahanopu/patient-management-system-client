import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { RawMedicine, Medicine } from '@/lib/types';
import { MedicineDictionary } from '@/lib/dictionary-search';

let cachedMedicines: Medicine[] | null = null;
let dictionaryInstance: MedicineDictionary | null = null;

function getDictionary(): MedicineDictionary {
  // Always rebuild to include newly added custom medicines
  try {
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

    // Merge custom medicines
    let customFilePath: string = path.join(process.cwd(), 'custom-medicines.json');
    if (!fs.existsSync(customFilePath)) {
      customFilePath = path.join(process.cwd(), 'frontend', 'custom-medicines.json');
    }
    if (fs.existsSync(customFilePath)) {
      const customContent: string = fs.readFileSync(customFilePath, 'utf-8');
      const customData: RawMedicine[] = JSON.parse(customContent) as RawMedicine[];
      rawData = [...customData, ...rawData]; // custom medicines appear first
    }

    cachedMedicines = rawData.map((item, index) => ({
      id: item['brand id'] || index + 1,
      brandName: item['brand name'] || '',
      type: item['type'] || 'allopathic',
      dosageForm: item['dosage form'] || '',
      generic: item['generic'] || '',
      strength: item['strength'] || '',
      manufacturer: item['manufacturer'] || '',
    }));

    dictionaryInstance = new MedicineDictionary(cachedMedicines);
    return dictionaryInstance;
  } catch (error) {
    console.error('Failed to load medicine.json or build Trie Dictionary:', error);
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
  const dictionary: MedicineDictionary = getDictionary();

  // Execute Dictionary Trie Search Algorithm
  const results: Medicine[] = dictionary.search(query, 25);
  const executionTimeMs: number = Date.now() - startTime;

  return NextResponse.json({
    medicines: results,
    totalMatches: results.length,
    algorithm: 'Trie Dictionary Search',
    executionTimeMs,
  });
}

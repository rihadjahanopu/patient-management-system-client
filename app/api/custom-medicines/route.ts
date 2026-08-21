import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

type MedicineRecord = Record<string, unknown>;

// Path to custom medicines file
function getCustomMedicinesPath(): string {
  let filePath: string = path.join(process.cwd(), 'custom-medicines.json');
  if (!fs.existsSync(filePath)) {
    filePath = path.join(process.cwd(), 'frontend', 'custom-medicines.json');
  }
  return filePath;
}

function readCustomMedicines(): MedicineRecord[] {
  try {
    const filePath: string = getCustomMedicinesPath();
    if (!fs.existsSync(filePath)) return [];
    const content: string = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as MedicineRecord[];
  } catch {
    return [];
  }
}

function writeCustomMedicines(data: MedicineRecord[]): void {
  const filePath: string = getCustomMedicinesPath();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// GET — list all custom medicines
export async function GET() {
  const medicines: MedicineRecord[] = readCustomMedicines();
  return NextResponse.json({ success: true, medicines });
}

// POST — add a new custom medicine
export async function POST(request: NextRequest) {
  try {
    const body: {
      brandName: string;
      generic: string;
      dosageForm: string;
      strength: string;
      manufacturer: string;
      type: string;
    } = await request.json() as {
      brandName: string;
      generic: string;
      dosageForm: string;
      strength: string;
      manufacturer: string;
      type: string;
    };

    if (!body.brandName || !body.generic) {
      return NextResponse.json(
        { success: false, message: 'Brand name and generic name are required.' },
        { status: 400 }
      );
    }

    const existing: MedicineRecord[] = readCustomMedicines();

    // Check for duplicate brand name
    const duplicate: MedicineRecord | undefined = existing.find(
      (m) => String(m['brand name'] ?? '').toLowerCase() === body.brandName.toLowerCase()
    );
    if (duplicate) {
      return NextResponse.json(
        { success: false, message: `"${body.brandName}" already exists in the custom medicine list.` },
        { status: 409 }
      );
    }

    const newEntry: MedicineRecord = {
      'brand id': Date.now(),
      'brand name': body.brandName.trim(),
      'type': body.type || 'allopathic',
      'slug': body.brandName.toLowerCase().replace(/\s+/g, '-'),
      'dosage form': body.dosageForm || '',
      'generic': body.generic.trim(),
      'strength': body.strength || '',
      'manufacturer': body.manufacturer || '',
      'package container': '',
      'Package Size': '',
      'is_custom': true,
    };

    existing.push(newEntry);
    writeCustomMedicines(existing);

    return NextResponse.json({
      success: true,
      message: `"${body.brandName}" has been added to the medicine list successfully.`,
      medicine: newEntry,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to add medicine. Please try again.' },
      { status: 500 }
    );
  }
}

// DELETE — remove a custom medicine by brand name
export async function DELETE(request: NextRequest) {
  try {
    const body: { brandName: string } = await request.json() as { brandName: string };

    if (!body.brandName) {
      return NextResponse.json({ success: false, message: 'Brand name is required.' }, { status: 400 });
    }

    const existing: MedicineRecord[] = readCustomMedicines();
    const filtered: MedicineRecord[] = existing.filter(
      (m) => String(m['brand name'] ?? '').toLowerCase() !== body.brandName.toLowerCase()
    );

    if (filtered.length === existing.length) {
      return NextResponse.json({ success: false, message: 'Medicine not found.' }, { status: 404 });
    }

    writeCustomMedicines(filtered);

    return NextResponse.json({
      success: true,
      message: `"${body.brandName}" removed from custom list.`,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to remove medicine.' },
      { status: 500 }
    );
  }
}

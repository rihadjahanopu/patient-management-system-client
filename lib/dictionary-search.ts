/* eslint-disable @typescript-eslint/typedef */
import { Medicine } from './types';

export class MedicineDictionary {
  private medicines: Medicine[] = [];

  constructor(medicines: Medicine[]) {
    this.medicines = medicines;
  }

  /**
   * Fast, relevance-ranked search across brand names and generics.
   * Matches partial queries (e.g. "nap" matches "Napa", "Napa Extra", "Naproxen").
   */
  public search(query: string, limit: number = 30): Medicine[] {
    const cleaned: string = query.toLowerCase().trim();
    if (!cleaned || cleaned.length < 2) return [];

    const queryWords: string[] = cleaned.split(/\s+/).filter(Boolean);
    if (queryWords.length === 0) return [];

    const matches: { med: Medicine; score: number }[] = [];

    for (let i: number = 0; i < this.medicines.length; i++) {
      const med: Medicine = this.medicines[i];
      const brand: string = (med.brandName || '').toLowerCase();
      const generic: string = (med.generic || '').toLowerCase();

      // Check if all query words match brand or generic
      const matchesAllWords: boolean = queryWords.every(
        (word: string) => brand.includes(word) || generic.includes(word)
      );

      if (!matchesAllWords) continue;

      // Calculate relevance score (higher score = better rank)
      let score: number = 0;

      // Exact brand match
      if (brand === cleaned) {
        score += 1000;
      }
      // Brand starts with exact query
      else if (brand.startsWith(cleaned)) {
        score += 500;
      }
      // Any word in brand starts with query
      else if (brand.split(/\s+/).some((w: string) => w.startsWith(cleaned))) {
        score += 300;
      }
      // Brand contains query
      else if (brand.includes(cleaned)) {
        score += 100;
      }
      // Generic starts with query
      else if (generic.startsWith(cleaned)) {
        score += 50;
      }
      // Generic contains query
      else {
        score += 10;
      }

      matches.push({ med, score });
    }

    // Sort by score descending (most relevant first)
    matches.sort((a: { med: Medicine; score: number }, b: { med: Medicine; score: number }) => b.score - a.score);

    return matches.slice(0, limit).map((m: { med: Medicine; score: number }) => m.med);
  }
}

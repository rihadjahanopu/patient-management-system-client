/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/typedef */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PlusCircle,
  Trash2,
  Search,
  Pill,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  X,
} from 'lucide-react';

interface CustomMedicine {
  'brand id': number;
  'brand name': string;
  type: string;
  'dosage form': string;
  generic: string;
  strength: string;
  manufacturer: string;
  is_custom?: boolean;
}

const DOSAGE_FORMS: string[] = [
  'Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection',
  'Cream', 'Ointment', 'Gel', 'Drop', 'Inhaler', 'Suppository',
  'Patch', 'Powder', 'Solution', 'Spray', 'Lotion', 'Sachet',
];

const MEDICINE_TYPES: string[] = ['allopathic', 'herbal', 'homeopathic', 'vitamin', 'supplement'];

const STRENGTH_UNITS: string[] = [
  'mg', 'mg/ml', 'mg/5 ml', 'mcg', 'mcg/dose', 'g', 'g/5 ml',
  'ml', 'IU', 'IU/ml', 'mEq', '%', 'ppm', 'mg/kg',
];

const emptyForm = {
  brandName: '',
  generic: '',
  dosageForm: 'Tablet',
  strengthValue: '',
  strengthUnit: 'mg',
  manufacturer: '',
  type: 'allopathic',
};

export default function MedicineManager() {
  const [medicines, setMedicines] = useState<CustomMedicine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [form, setForm] = useState({ ...emptyForm });
  // derived strength string
  const strengthString: string = form.strengthValue ? `${form.strengthValue} ${form.strengthUnit}` : '';
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);

  const loadMedicines = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res: Response = await fetch('/api/custom-medicines');
      const data: { success: boolean; medicines: CustomMedicine[] } = await res.json();
      setMedicines(data.medicines || []);
    } catch {
      setError('Failed to load custom medicines.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMedicines();
  }, [loadMedicines]);

  const showMsg = (type: 'success' | 'error', msg: string): void => {
    if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); }
    else { setError(msg); setTimeout(() => setError(''), 5000); }
  };

  const handleAdd = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!form.brandName.trim() || !form.generic.trim()) {
      showMsg('error', 'Brand name and generic name are required.');
      return;
    }
    setSaving(true);
    try {
      const res: Response = await fetch('/api/custom-medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, strength: strengthString }),
      });
      const data: { success: boolean; message: string } = await res.json();
      if (!res.ok) { showMsg('error', data.message); return; }
      showMsg('success', data.message);
      setForm({ ...emptyForm });
      setShowForm(false);
      await loadMedicines();
    } catch {
      showMsg('error', 'Failed to add medicine.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (brandName: string): Promise<void> => {
    if (!window.confirm(`Remove "${brandName}" from custom list?`)) return;
    setDeleting(brandName);
    try {
      const res: Response = await fetch('/api/custom-medicines', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName }),
      });
      const data: { success: boolean; message: string } = await res.json();
      if (!res.ok) { showMsg('error', data.message); return; }
      showMsg('success', data.message);
      await loadMedicines();
    } catch {
      showMsg('error', 'Failed to remove medicine.');
    } finally {
      setDeleting(null);
    }
  };

  const filtered: CustomMedicine[] = medicines.filter((m: CustomMedicine) => {
    const q: string = searchQuery.toLowerCase();
    return (
      m['brand name']?.toLowerCase().includes(q) ||
      m.generic?.toLowerCase().includes(q) ||
      m['dosage form']?.toLowerCase().includes(q) ||
      m.manufacturer?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-slate-700 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/30">
              <Pill className="w-3.5 h-3.5" />
              Custom Medicine Registry
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Medicine Dictionary Manager
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl">
              Add custom brand medicines to the prescription search dictionary. Custom medicines appear
              first in auto-complete suggestions for all doctors.
            </p>
          </div>
          <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/20 text-center shrink-0 min-w-36">
            <div className="text-3xl font-black text-emerald-400">{medicines.length}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Custom Added</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" />{success}</span>
          <button onClick={() => setSuccess('')} className="text-emerald-700 font-bold text-xs hover:text-emerald-900"><X className="w-4 h-4" /></button>
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-rose-600" />{error}</span>
          <button onClick={() => setError('')} className="text-rose-700 font-bold text-xs hover:text-rose-900"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Add Medicine Form Toggle */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-sm">
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            Add New Medicine to Dictionary
          </h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              showForm
                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {showForm ? 'Close Form' : '+ Add Medicine'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={(e) => { void handleAdd(e); }} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Brand Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Brand Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Napa Extra"
                  value={form.brandName}
                  onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 bg-white font-medium"
                />
              </div>

              {/* Generic Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Generic / Active Ingredient <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol + Caffeine"
                  value={form.generic}
                  onChange={(e) => setForm({ ...form, generic: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 bg-white font-medium"
                />
              </div>

              {/* Dosage Form */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Dosage Form</label>
                <select
                  value={form.dosageForm}
                  onChange={(e) => setForm({ ...form, dosageForm: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  {DOSAGE_FORMS.map((d: string) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Strength */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Strength / Dose</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Amount"
                    value={form.strengthValue}
                    onChange={(e) => setForm({ ...form, strengthValue: e.target.value })}
                    className="w-28 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 bg-white font-medium text-center"
                  />
                  <select
                    value={form.strengthUnit}
                    onChange={(e) => setForm({ ...form, strengthUnit: e.target.value })}
                    className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer"
                  >
                    {STRENGTH_UNITS.map((u: string) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                {strengthString && (
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1.5 pl-1">
                    ✓ Will save as: <span className="font-black">{strengthString}</span>
                  </p>
                )}
              </div>

              {/* Manufacturer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Manufacturer</label>
                <input
                  type="text"
                  placeholder="e.g. Square Pharmaceuticals Ltd."
                  value={form.manufacturer}
                  onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 bg-white font-medium"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Medicine Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-emerald-500 font-medium capitalize"
                >
                  {MEDICINE_TYPES.map((t: string) => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
              </div>
            </div>

            {/* Preview Card */}
            {form.brandName && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <FlaskConical className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <div className="font-black text-emerald-900 text-sm">{form.brandName || '—'}</div>
                  <div className="text-emerald-700 font-medium">{form.generic || 'Generic not set'} • {strengthString || 'No strength'}</div>
                  <div className="text-emerald-600">{form.dosageForm} • {form.manufacturer || 'Manufacturer not set'}</div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setForm({ ...emptyForm }); setShowForm(false); }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black text-sm rounded-xl flex items-center gap-2 transition-colors shadow-sm"
              >
                <Pill className="w-4 h-4" />
                {saving ? 'Adding...' : 'Add to Dictionary'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Custom Medicines List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
          <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-sm">
            <Pill className="w-4 h-4 text-slate-600" />
            Custom Medicines ({filtered.length})
          </h3>
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search custom medicines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 bg-white font-medium"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
              <Pill className="w-7 h-7 text-slate-400" />
            </div>
            <div>
              <h4 className="font-bold text-slate-700 text-sm">
                {searchQuery ? 'No medicines match your search.' : 'No custom medicines added yet.'}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {!searchQuery && 'Click "+ Add Medicine" to add your first custom medicine.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
                  <th className="py-3 px-4 text-left">Brand Name</th>
                  <th className="py-3 px-4 text-left">Generic / Ingredient</th>
                  <th className="py-3 px-4 text-left">Form & Strength</th>
                  <th className="py-3 px-4 text-left">Manufacturer</th>
                  <th className="py-3 px-4 text-center">Type</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((m: CustomMedicine) => (
                  <tr key={m['brand id']} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">
                          <Pill className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{m['brand name']}</div>
                          <div className="text-[10px] text-emerald-600 font-bold">✨ Custom</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-slate-600 font-medium">{m.generic}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200 mr-1.5">{m['dosage form']}</span>
                        <span className="text-slate-500">{m.strength}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-slate-500 font-medium">{m.manufacturer || '—'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black border bg-sky-50 text-sky-700 border-sky-200 capitalize">
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => { void handleDelete(m['brand name']); }}
                        disabled={deleting === m['brand name']}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1 mx-auto"
                        title="Remove from custom list"
                      >
                        {deleting === m['brand name'] ? (
                          <div className="w-3 h-3 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs text-sky-800 font-medium flex items-start gap-3">
        <div className="w-5 h-5 rounded-full bg-sky-200 text-sky-700 flex items-center justify-center shrink-0 font-black text-xs mt-0.5">ℹ</div>
        <div>
          <strong>How it works:</strong> Custom medicines are saved in <code className="px-1.5 py-0.5 rounded bg-sky-100 border border-sky-200 font-mono text-[11px]">custom-medicines.json</code> and merged with the main medicine dictionary automatically. They appear first in prescription auto-complete search for all doctors.
        </div>
      </div>
    </div>
  );
}

/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { MedicalTest } from '@/lib/types';
import {
  FlaskConical,
  PlusCircle,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Database,
} from 'lucide-react';

const DEFAULT_CATEGORIES: string[] = [
  'All',
  'Pathology',
  'Biochemistry',
  'Radiology',
  'Cardiology',
  'Microbiology',
  'Hematology',
  'General',
];

const STORAGE_KEY: string = 'medtest_custom_categories';

const emptyForm: { testName: string; category: string; price: string; instructions: string } = {
  testName: '',
  category: 'Pathology',
  price: '',
  instructions: '',
};

export default function MedicalTestManager() {
  const [tests, setTests] = useState<MedicalTest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  // Form states
  const [form, setForm] = useState({ ...emptyForm });
  const [showForm, setShowForm] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [editingTest, setEditingTest] = useState<MedicalTest | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Dynamic categories (default + user-added custom)
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [showCatInput, setShowCatInput] = useState<boolean>(false);
  const [newCatInput, setNewCatInput] = useState<string>('');

  // Load custom categories from localStorage on mount
  useEffect(() => {
    try {
      const stored: string | null = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const custom: string[] = JSON.parse(stored) as string[];
        const merged: string[] = Array.from(new Set([...DEFAULT_CATEGORIES, ...custom]));
        setCategories(merged);
      }
    } catch { /* ignore */ }
  }, []);

  // showMsg declared BEFORE handleAddCategory (which depends on it)
  const showMsg: (type: 'success' | 'error', msg: string) => void = useCallback((type: 'success' | 'error', msg: string): void => {
    if (type === 'success') {
      setSuccess(msg);
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(msg);
      setTimeout(() => setError(''), 5000);
    }
  }, []);

  const handleAddCategory: () => void = useCallback((): void => {
    const trimmed: string = newCatInput.trim();
    if (!trimmed) return;
    // Check duplicate (case-insensitive)
    if (categories.some((c: string) => c.toLowerCase() === trimmed.toLowerCase())) {
      showMsg('error', `Category "${trimmed}" already exists.`);
      return;
    }
    const updated: string[] = [...categories, trimmed];
    setCategories(updated);
    // Persist custom ones (non-default) to localStorage
    const custom: string[] = updated.filter((c: string) => !DEFAULT_CATEGORIES.includes(c));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    // Auto-select in the form
    setForm((prev) => ({ ...prev, category: trimmed }));
    setNewCatInput('');
    setShowCatInput(false);
    showMsg('success', `Category "${trimmed}" added.`);
  }, [categories, newCatInput, showMsg]);

  const getAuthHeaders: () => HeadersInit = useCallback((): HeadersInit => {
    const token: string | undefined = Cookies.get('token') ?? localStorage.getItem('token') ?? undefined;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const loadTests: () => Promise<void> = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res: Response = await fetch('/api/medical-tests');
      const data: { success: boolean; tests: MedicalTest[] } = await res.json();
      const loadedTests: MedicalTest[] = data.tests || [];
      setTests(loadedTests);

      // Extract unique categories from DB tests & merge with categories list
      const dbCategories: string[] = loadedTests
        .map((t: MedicalTest) => t.category)
        .filter((c: string | undefined): c is string => Boolean(c && c.trim()));

      let storedCustom: string[] = [];
      try {
        const stored: string | null = localStorage.getItem(STORAGE_KEY);
        if (stored) storedCustom = JSON.parse(stored) as string[];
      } catch { /* ignore */ }

      const allCategories: string[] = Array.from(
        new Set([...DEFAULT_CATEGORIES, ...storedCustom, ...dbCategories])
      );
      setCategories(allCategories);

      // Save custom ones back to localStorage
      const customOnly: string[] = allCategories.filter((c: string) => !DEFAULT_CATEGORIES.includes(c));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly));
    } catch {
      showMsg('error', 'Failed to load medical tests.');
    } finally {
      setLoading(false);
    }
  }, [showMsg]);

  // Force re-sync from MongoDB
  const handleForceSync: () => Promise<void> = useCallback(async (): Promise<void> => {
    setSyncing(true);
    try {
      const res: Response = await fetch('/api/medical-tests', { method: 'PATCH' });
      const data: { success: boolean; message: string; tests: MedicalTest[] } = await res.json();
      if (res.ok) {
        setTests(data.tests || []);
        showMsg('success', `✅ ${data.message}`);
      } else {
        showMsg('error', data.message || 'Sync failed.');
      }
    } catch {
      showMsg('error', 'Failed to sync from database.');
    } finally {
      setSyncing(false);
    }
  }, [showMsg]);

  useEffect(() => {
    void loadTests();
  }, [loadTests]);

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!form.testName.trim()) {
      showMsg('error', 'Test name is required.');
      return;
    }

    setSaving(true);
    try {
      const payload: { testName: string; category: string; price: number; instructions: string } = {
        testName: form.testName.trim(),
        category: form.category || 'General',
        price: Number(form.price) || 0,
        instructions: form.instructions.trim(),
      };

      let res: Response;
      if (editingTest && (editingTest.id || editingTest._id)) {
        const id: string | undefined = editingTest.id || editingTest._id;
        res = await fetch('/api/medical-tests', {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ id, ...payload }),
        });
      } else {
        res = await fetch('/api/medical-tests', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
      }

      const data: { success: boolean; message: string } = await res.json();
      if (!res.ok) {
        showMsg('error', data.message);
        return;
      }

      showMsg('success', data.message);
      setForm({ ...emptyForm });
      setEditingTest(null);
      setShowForm(false);
      await loadTests();
    } catch {
      showMsg('error', 'Failed to save test.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (test: MedicalTest): void => {
    setEditingTest(test);
    setForm({
      testName: test.testName,
      category: test.category || 'General',
      price: String(test.price ?? 0),
      instructions: test.instructions || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (test: MedicalTest): Promise<void> => {
    const id: string | undefined = test.id || test._id;
    if (!id) return;
    if (!window.confirm(`Are you sure you want to remove "${test.testName}"?`)) return;

    setDeleting(id as string);
    try {
      const res: Response = await fetch(`/api/medical-tests?id=${encodeURIComponent(id as string)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data: { success: boolean; message: string } = await res.json();
      if (!res.ok) {
        showMsg('error', data.message);
        return;
      }
      showMsg('success', data.message);
      await loadTests();
    } catch {
      showMsg('error', 'Failed to remove test.');
    } finally {
      setDeleting(null);
    }
  };

  const filtered: MedicalTest[] = tests.filter((t: MedicalTest) => {
    const q: string = searchQuery.toLowerCase();
    const matchesSearch: boolean =
      t.testName.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.instructions !== undefined && t.instructions.toLowerCase().includes(q));
    const matchesCategory: boolean = categoryFilter === 'All' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-slate-700 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-wider border border-indigo-500/30">
              <FlaskConical className="w-3.5 h-3.5" />
              Lab Investigations Registry
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Medical Tests & Pricing Manager
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl">
              Manage clinical lab tests, categories, internal pricing, and patient prep instructions. Doctors can select these tests in prescriptions (prices remain internal to Admin).
            </p>
            {/* DB Sync badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 text-[10px] font-bold border border-sky-500/25">
              <Database className="w-3 h-3" />
              MongoDB In-Memory Sync — 0 DB cost per search
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-indigo-500/20 text-center min-w-36">
              <div className="text-3xl font-black text-indigo-400">{tests.length}</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registered Tests</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {success}
          </span>
          <button onClick={() => setSuccess('')} className="text-emerald-700 font-bold text-xs hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            {error}
          </span>
          <button onClick={() => setError('')} className="text-rose-700 font-bold text-xs hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add / Edit Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/60">
          <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-sm">
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            {editingTest ? 'Edit Medical Test Details' : 'Register New Medical Test'}
          </h3>
          <div className="flex items-center gap-2">
            {/* Sync from DB Button */}
            <button
              onClick={() => { void handleForceSync(); }}
              disabled={syncing}
              title="Force sync tests from MongoDB database"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-xs font-bold transition-all disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync from DB'}
            </button>
            {/* Add / Close Form Button */}
            <button
              onClick={() => {
                if (showForm) {
                  setForm({ ...emptyForm });
                  setEditingTest(null);
                  setShowForm(false);
                } else {
                  setShowForm(true);
                }
              }}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                showForm
                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
              }`}
            >
              {showForm ? 'Close Form' : '+ Add Medical Test'}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={(e) => { void handleSave(e); }} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Test Name */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Test Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CBC / Serum Creatinine / USG Abdomen"
                  value={form.testName}
                  onChange={(e) => setForm({ ...form, testName: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 bg-white font-medium"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Category / Department</label>
                <div className="flex gap-2">
                  <select
                    value={form.category}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setShowCatInput(true);
                      } else {
                        setForm({ ...form, category: e.target.value });
                        setShowCatInput(false);
                      }
                    }}
                    className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__new__">➕ Add new category...</option>
                  </select>
                </div>
                {/* New Category Input */}
                {showCatInput && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder="e.g. Neurology, Dermatology..."
                      value={newCatInput}
                      onChange={(e) => setNewCatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                      className="flex-1 px-3.5 py-2 border border-indigo-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 bg-white font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-colors"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCatInput(false); setNewCatInput(''); }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Price (Admin Only Control) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Price (৳ BDT) <span className="text-slate-400 font-normal">(Admin Internal)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-extrabold text-slate-400 text-sm">৳</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full pl-8 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 bg-white font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Preparation / Instructions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Preparation Instructions for Patient <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Fasting for 12 hours required / Full bladder for ultrasound"
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white font-medium"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setForm({ ...emptyForm });
                  setEditingTest(null);
                  setShowForm(false);
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black text-sm rounded-xl flex items-center gap-2 transition-colors shadow-xs"
              >
                <FlaskConical className="w-4 h-4" />
                {saving ? 'Saving...' : editingTest ? 'Update Test' : 'Add to Test Registry'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Test List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-sm">
              <FlaskConical className="w-4 h-4 text-slate-600" />
              Medical Tests ({filtered.length})
            </h3>
            {/* Category Filter Pills */}
            <div className="hidden md:flex flex-wrap items-center gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:bg-slate-200/60 hover:text-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-white font-medium"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
              <FlaskConical className="w-7 h-7 text-slate-400" />
            </div>
            <div>
              <h4 className="font-bold text-slate-700 text-sm">
                {searchQuery ? 'No test matches your search.' : 'No medical tests registered.'}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Click &quot;+ Add Medical Test&quot; to add test items with price and clinical details.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
                  <th className="py-3 px-4 text-left">Medical Test Name</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-right">Price (Admin)</th>
                  <th className="py-3 px-4 text-left">Preparation / Instructions</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((t: MedicalTest) => (
                  <tr key={t.id || t._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>{t.testName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black border bg-indigo-50 text-indigo-700 border-indigo-200">
                        {t.category || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      ৳ {t.price?.toLocaleString() || 0}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-slate-600 italic">
                        {t.instructions || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(t)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit test details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { void handleDelete(t); }}
                          disabled={deleting === (t.id || t._id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
                          title="Delete test"
                        >
                          {deleting === (t.id || t._id) ? (
                            <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Note for Admin */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 font-medium flex items-start gap-3">
        <div className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 font-black text-xs mt-0.5">ℹ</div>
        <div className="space-y-1">
          <div><strong>Prescription Price Privacy Rule:</strong> Prices set here are strictly for Admin/Billing internal records.</div>
          <div className="text-amber-800">🔒 When Doctors add tests to prescriptions or when prescriptions are printed/shared, <strong>TEST PRICES WILL NEVER BE DISPLAYED ON THE PRESCRIPTION</strong>. Only test names and clinical instructions appear on the prescription pad.</div>
        </div>
      </div>
    </div>
  );
}

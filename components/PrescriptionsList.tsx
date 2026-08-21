'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Printer, Calendar, User, Eye, Search } from 'lucide-react';
import { Prescription } from '@/lib/types';
import { getPrescriptions } from '@/lib/storage';

interface PrescriptionsListProps {
  onSelectPrescription: (prescription: Prescription) => void;
}

export default function PrescriptionsList({ onSelectPrescription }: PrescriptionsListProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setPrescriptions(getPrescriptions());
  }, []);

  const filtered = prescriptions.filter(p => 
    p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tokenNumber.includes(searchQuery) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Issued Prescriptions History
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Access and re-print previous patient prescriptions.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, token or Rx ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Grid List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p>No issued prescriptions found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((rx) => (
            <div key={rx.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <span className="font-extrabold text-sm text-slate-900">Token #{rx.tokenNumber}</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    {rx.date}
                  </span>
                </div>

                <div className="font-bold text-slate-900 text-base mb-1">{rx.patientName}</div>
                <div className="text-xs text-slate-500 mb-3">
                  {rx.age} Yrs • {rx.gender} • Vitals: BP {rx.vitals.bp || '120/80'}
                </div>

                {rx.diagnosis && (
                  <div className="text-xs font-semibold text-slate-700 bg-slate-50 p-2 rounded-lg mb-3">
                    Dx: {rx.diagnosis}
                  </div>
                )}

                <div className="text-xs text-slate-600">
                  <strong>{rx.medicines.length} Medicines:</strong> {rx.medicines.map(m => m.brandName).join(', ')}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">ID: {rx.id}</span>
                <button
                  onClick={() => onSelectPrescription(rx)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1.5 shadow"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View / Print</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

'use client';

import React from 'react';
import { Printer, ArrowLeft, Stethoscope, ShieldCheck } from 'lucide-react';
import { Prescription } from '@/lib/types';

interface PrintablePrescriptionProps {
  prescription: Prescription;
  onBack?: () => void;
}

interface ExtendedPrescription extends Partial<Prescription> {
  appointment?: {
    patientName?: string;
    age?: number | string;
    gender?: string;
    date?: string;
    serialNumber?: number | string;
    phone?: string;
  } | string;
  createdAt?: string;
}

export default function PrintablePrescription({ prescription, onBack }: PrintablePrescriptionProps) {
  const handlePrint = (): void => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const extRx: ExtendedPrescription = prescription as ExtendedPrescription;
  const appt: ExtendedPrescription['appointment'] = typeof extRx.appointment === 'object' && extRx.appointment !== null ? extRx.appointment : undefined;
  const pName: string = prescription.patientName || (typeof appt === 'object' && appt?.patientName) || 'Patient';
  const pAge: number | string = prescription.age || (typeof appt === 'object' && appt?.age) || '--';
  const pGender: string = prescription.gender || (typeof appt === 'object' && appt?.gender) || 'N/A';
  const pDate: string = prescription.date || (typeof appt === 'object' && appt?.date) || (extRx.createdAt ? new Date(extRx.createdAt).toISOString().slice(0, 10) : 'N/A');
  const pToken: number | string = prescription.tokenNumber || (typeof appt === 'object' && appt?.serialNumber) || 1;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* On-screen Navigation Controls (Hidden when printing) */}
      <div className="mb-6 flex items-center justify-between no-print print:hidden">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        )}

        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 text-sm transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print Prescription Pad</span>
        </button>
      </div>

      {/* Printable Paper Pad Container */}
      <div className="printable-container bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-10 font-sans relative">
        {/* Doctor & Hospital Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-5 mb-4 gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-950 tracking-tight">
              {prescription.doctorName || 'Dr. Tanvir Ahmed'}
            </h1>
            <p className="text-xs font-bold text-emerald-800 mt-0.5">
              {prescription.doctorSpecialty || 'MBBS, FCPS (Medicine), MD (Cardiology)'}
            </p>
            <p className="text-xs text-slate-700 font-semibold mt-0.5">Senior Consultant (Internal Medicine)</p>
            <p className="text-[11px] text-slate-600 font-mono mt-1">
              BMDC Reg No: <strong className="text-slate-900">{prescription.doctorRegNo || 'A-54321'}</strong>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="inline-flex items-center space-x-1.5 text-slate-900 font-black text-sm uppercase tracking-wide">
              <Stethoscope className="w-4 h-4 text-emerald-700" />
              <span>SmartCare Specialist Hospital</span>
            </div>
            <p className="text-xs font-semibold text-slate-800 mt-0.5">Chamber 05 • House 42, Road 11, Banani, Dhaka</p>
            <p className="text-xs text-slate-600">Visiting Hours: 10:00 AM - 04:00 PM</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Serial Hotline: +880 1711-001122</p>
          </div>
        </div>

        {/* Patient Details Paper Strip */}
        <div className="border-y border-slate-400 py-2.5 my-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold text-slate-900 items-center">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Patient Name</span>
            <span className="font-extrabold text-slate-950 text-sm">{pName}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Age / Gender</span>
            <span className="text-slate-900">
              {pAge} Yrs / {pGender}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Date & Token</span>
            <span className="text-slate-900">
              {pDate} (Token #{pToken})
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Vitals Summary</span>
            <span className="text-slate-800 font-mono text-[11px]">
              BP: {prescription.vitals?.bp || '120/80'} | Wt: {prescription.vitals?.weight || '--'} kg
            </span>
          </div>
        </div>

        {/* Prescription Main Body: 2 Columns */}
        <div className="grid grid-cols-12 gap-6 min-h-120 mt-4">
          {/* Left Column (Clinical Margin - 35% width) */}
          <div className="col-span-12 md:col-span-4 border-r-0 md:border-r border-slate-300 md:pr-4 space-y-5 text-xs">
            {/* O/E Vitals */}
            {prescription.vitals && (
              <div>
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-300 pb-0.5 mb-1.5 uppercase">
                  O/E (Vitals)
                </h4>
                <div className="space-y-1 font-mono text-xs text-slate-800">
                  {prescription.vitals.bp && <div>BP: <strong>{prescription.vitals.bp}</strong> mmHg</div>}
                  {prescription.vitals.pulse && <div>Pulse: <strong>{prescription.vitals.pulse}</strong> bpm</div>}
                  {prescription.vitals.weight && <div>Weight: <strong>{prescription.vitals.weight}</strong> kg</div>}
                </div>
              </div>
            )}

            {/* C/C Complaints */}
            {prescription.complaints && (
              <div>
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-300 pb-0.5 mb-1.5 uppercase">
                  C/C (Chief Complaints)
                </h4>
                <p className="text-slate-800 font-medium whitespace-pre-line leading-relaxed text-xs">
                  {prescription.complaints}
                </p>
              </div>
            )}

            {/* Dx Clinical Diagnosis */}
            {prescription.diagnosis && (
              <div>
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-300 pb-0.5 mb-1 uppercase">
                  Dx (Diagnosis)
                </h4>
                <p className="font-black text-slate-950 text-xs">{prescription.diagnosis}</p>
              </div>
            )}

            {/* Adv. Doctor Advice */}
            {prescription.advice && (
              <div>
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-300 pb-0.5 mb-1 uppercase">
                  Adv. (Advice)
                </h4>
                <p className="text-slate-800 whitespace-pre-line leading-relaxed text-xs">
                  {prescription.advice}
                </p>
              </div>
            )}

            {/* Follow Up */}
            {prescription.followUpDate && (
              <div className="pt-2 border-t border-slate-200 text-xs font-semibold text-slate-900">
                <span className="text-slate-600 block">Next Visit / Follow-up:</span>
                <span className="font-bold text-slate-950">{prescription.followUpDate}</span>
              </div>
            )}
          </div>

          {/* Right Column (Rx Prescribed Medicines - 65% width) */}
          <div className="col-span-12 md:col-span-8 pl-0 md:pl-2 space-y-4">
            {/* Rx Heading */}
            <div className="border-b border-slate-300 pb-1 mb-4 flex items-center justify-between">
              <div className="text-3xl font-serif font-bold italic text-slate-950">
                R<sub>x</sub>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                Prescribed Medicines
              </span>
            </div>

            {/* Medicines List */}
            <div className="space-y-4">
              {prescription.medicines && prescription.medicines.length > 0 ? (
                prescription.medicines.map((med, idx) => (
                  <div key={med.id || idx} className="border-b border-slate-200/80 pb-3 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-slate-900 text-xs">{idx + 1}.</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {med.dosageForm}. {med.brandName}
                      </span>
                      {med.strength && (
                        <span className="text-xs font-semibold text-slate-700">({med.strength})</span>
                      )}
                    </div>

                    {med.generic && <div className="text-xs text-slate-500 italic pl-5">({med.generic})</div>}

                    <div className="pl-5 pt-0.5 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-800">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-slate-900">
                        {med.frequency}
                      </span>
                      <span>{med.timing}</span>
                      <span>for <strong>{med.duration}</strong></span>
                    </div>

                    {med.instructions && (
                      <div className="pl-5 text-[11px] text-slate-600 italic">
                        Note: {med.instructions}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-xs py-4 text-center">
                  No medicines added to this prescription.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer: Doctor Signature & System Stamp */}
        <div className="mt-14 pt-4 border-t-2 border-slate-900 flex justify-between items-end text-xs text-slate-700">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1 text-slate-900 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>SmartCare Digitally Verified Prescription</span>
            </div>
            <p className="text-[10px] text-slate-500">Prescription ID: {prescription.id}</p>
          </div>

          <div className="text-center">
            <div className="w-48 border-b border-slate-800 mb-1"></div>
            <p className="font-bold text-slate-950">{prescription.doctorName || 'Doctor Signature'}</p>
            <p className="text-[10px] text-slate-600 font-mono">BMDC Reg No: {prescription.doctorRegNo || 'A-54321'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

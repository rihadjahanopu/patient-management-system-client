/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/typedef */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/purity */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQueueStore } from '@/hooks/useQueueStore';
import { api } from '@/lib/api';
import DoctorSidebar, { DoctorTab } from '@/components/DoctorSidebar';
import ProfileSettings from '@/components/ProfileSettings';
import {
  Search,
  Plus,
  Trash2,
  Printer,
  CheckCircle,
  HeartPulse,
  Sparkles,
  RefreshCw,
  Stethoscope,
  History,
  X,
  Edit3,
  Users,
  Filter,
  FileText,
  Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const FREQUENCIES: string[] = ['1+0+1', '1+1+1', '1+0+0', '0+0+1', '1+1+1+1', '0+1+0', 'As needed'];
const TIMINGS: string[] = ['After Food', 'Before Food', 'With Food', 'Empty Stomach', 'At Bedtime'];
const DURATIONS: string[] = ['3 Days', '5 Days', '7 Days', '10 Days', '14 Days', '1 Month', 'Continue'];

interface Medicine {
  id: string;
  brandName: string;
  generic: string;
  dosageForm: string;
  strength: string;
  frequency: string;
  timing: string;
  duration: string;
  instructions: string;
}

export default function DoctorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<DoctorTab>('consultation');
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [activePatient, setActivePatient] = useState<any>(null);

  const { queue, setDoctorAndDate, fetchQueue, updateAppointmentStatus } = useQueueStore();

  // Prescription History Dynamic State
  const [rxHistory, setRxHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'All' | 'Finalized' | 'Draft'>('All');

  // Fetch doctor's prescription history
  const loadRxHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await api.prescriptions.getDoctorHistory();
      setRxHistory(res.prescriptions || []);
    } catch (e: any) {
      console.warn('Could not load rx history:', e);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return; // Wait until session restoration finishes
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'Doctor') {
      router.push('/');
      return;
    }
    if (user.doctorProfile) setDoctorProfile(user.doctorProfile);
  }, [user, authLoading, router]);

  useEffect(() => {
    if (doctorProfile?._id) {
      setDoctorAndDate(doctorProfile._id, today);
      loadRxHistory();
    }
  }, [doctorProfile, today, setDoctorAndDate, loadRxHistory]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadRxHistory();
    }
  }, [activeTab, loadRxHistory]);

  const handleSelectPatient = async (apt: any) => {
    setActivePatient(apt);
    setActiveTab('consultation');
    if (apt.status === 'Pending') {
      try {
        await updateAppointmentStatus(apt._id, 'In Progress');
      } catch (err) {
        console.warn('Could not set In Progress status:', err);
      }
    }
  };

  // Clinical notes state
  const [vitals, setVitals] = useState({ bp: '120/80', pulse: '76', weight: '65', temp: '98.6' });
  const [complaints, setComplaints] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Medicine search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentMed, setCurrentMed] = useState({
    brandName: '',
    generic: '',
    dosageForm: 'Tablet',
    strength: '',
    frequency: '1+0+1',
    timing: 'After Food',
    duration: '7 Days',
    instructions: '',
  });
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedRxId, setSavedRxId] = useState<string | null>(null);

  // Auto-select serving patient from queue
  useEffect(() => {
    const serving = queue.find((a: any) => a.status === 'In Progress');
    if (serving && serving._id !== activePatient?._id) {
      setActivePatient(serving);
    }
  }, [queue]);

  // AUTO-LOAD SAVED PRESCRIPTION ON PATIENT CHANGE
  useEffect(() => {
    if (!activePatient?._id) return;

    api.prescriptions
      .getByAppointment(activePatient._id)
      .then((data) => {
        if (data.prescription) {
          const rx = data.prescription;
          setSavedRxId(rx._id);
          if (rx.vitals) setVitals(rx.vitals);
          if (rx.complaints) setComplaints(rx.complaints);
          if (rx.diagnosis) setDiagnosis(rx.diagnosis);
          if (rx.medicines) {
            const normalizedMeds = rx.medicines.map((m: any, idx: number) => ({
              ...m,
              brandName: m.brandName || m.medicineName || '',
              medicineName: m.medicineName || m.brandName || '',
              id: m.id || m._id || `m-${Date.now()}-${idx}`,
            }));
            setMedicines(normalizedMeds);
          }
          if (rx.advice) setAdvice(rx.advice);
          if (rx.followUpDate) setFollowUpDate(rx.followUpDate);
        } else {
          setSavedRxId(null);
          setComplaints(activePatient.reason || '');
          setDiagnosis('');
          setMedicines([]);
          setAdvice('');
          setFollowUpDate('');
        }
      })
      .catch(() => {
        setSavedRxId(null);
        setComplaints(activePatient.reason || '');
        setDiagnosis('');
        setMedicines([]);
        setAdvice('');
        setFollowUpDate('');
      });
  }, [activePatient?._id]);

  const handleLoadPrescriptionFromHistory = (rx: any, autoPrint = false) => {
    setSavedRxId(rx._id);
    if (rx.vitals) setVitals(rx.vitals);
    if (rx.complaints) setComplaints(rx.complaints);
    if (rx.diagnosis) setDiagnosis(rx.diagnosis);
    if (rx.medicines) {
      const normalizedMeds = rx.medicines.map((m: any, idx: number) => ({
        ...m,
        brandName: m.brandName || m.medicineName || '',
        medicineName: m.medicineName || m.brandName || '',
        id: m.id || m._id || `m-hist-${Date.now()}-${idx}`,
      }));
      setMedicines(normalizedMeds);
    }
    if (rx.advice) setAdvice(rx.advice);
    if (rx.followUpDate) setFollowUpDate(rx.followUpDate);

    // Set matching patient info if available
    const appt = typeof rx.appointment === 'object' ? rx.appointment : null;
    setActivePatient({
      _id: appt?._id || rx.appointment,
      patientName: rx.patientName || appt?.patientName || 'Patient',
      serialNumber: rx.serialNumber || appt?.serialNumber || 1,
      phone: rx.phone || appt?.phone || '',
      age: rx.age || appt?.age || '',
      gender: rx.gender || appt?.gender || '',
      status: rx.isFinalized ? 'Completed' : 'In Progress',
    });

    setActiveTab('consultation');

    if (autoPrint) {
      setTimeout(() => {
        window.print();
      }, 300);
    }
  };

  const [searchMeta, setSearchMeta] = useState<{ time: number; total: number } | null>(null);

  // Debounced medicine search using Trie Dictionary Algorithm
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      setSearchMeta(null);
      return;
    }
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/medicines?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.medicines || []);
        setSearchMeta({ time: data.executionTimeMs || 1, total: data.totalMatches || 0 });
        setShowDropdown(true);
      } finally {
        setIsSearching(false);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const addMedicine = () => {
    if (!currentMed.brandName) {
      alert('Select or enter a medicine name.');
      return;
    }
    setMedicines([...medicines, { ...currentMed, id: `m-${Date.now()}` }]);
    setCurrentMed({
      brandName: '',
      generic: '',
      dosageForm: 'Tablet',
      strength: '',
      frequency: '1+0+1',
      timing: 'After Food',
      duration: '7 Days',
      instructions: '',
    });
    setSearchQuery('');
  };

  const handleSelectAndAddMedicine = (med: any) => {
    const newMed: Medicine = {
      id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      brandName: med.brandName,
      generic: med.generic || '',
      dosageForm: med.dosageForm || currentMed.dosageForm || 'Tablet',
      strength: med.strength || currentMed.strength || '',
      frequency: currentMed.frequency || '1+0+1',
      timing: currentMed.timing || 'After Food',
      duration: currentMed.duration || '7 Days',
      instructions: currentMed.instructions || '',
    };
    setMedicines((prev) => [...prev, newMed]);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleSaveRx = async () => {
    if (!activePatient) {
      alert('Select an active patient first.');
      return;
    }
    if (medicines.length === 0) {
      alert('Please add at least one medicine to the prescription.');
      return;
    }

    const finalDiagnosis = diagnosis.trim() || 'General Consultation';
    setSaving(true);
    try {
      const payload = {
        appointmentId: activePatient._id,
        vitals,
        complaints,
        diagnosis: finalDiagnosis,
        medicines,
        advice,
        followUpDate,
      };
      const res = savedRxId
        ? await api.prescriptions.update(savedRxId, payload)
        : await api.prescriptions.create(payload);
      const rxId = res.prescription?._id || savedRxId;
      setSavedRxId(rxId);
      alert('Prescription saved successfully! You can view or edit it anytime.');
      loadRxHistory();
      return rxId;
    } catch (e: any) {
      alert(e.message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizeAndPrint = async () => {
    if (!activePatient) {
      alert('Select an active patient from the queue first.');
      return;
    }
    if (medicines.length === 0) {
      alert('Please add at least one medicine before printing.');
      return;
    }

    const finalDiagnosis = diagnosis.trim() || 'General Consultation';
    setSaving(true);
    try {
      const payload = {
        appointmentId: activePatient._id,
        vitals,
        complaints,
        diagnosis: finalDiagnosis,
        medicines,
        advice,
        followUpDate,
      };

      let rxId = savedRxId;
      if (!rxId) {
        try {
          const res = await api.prescriptions.create(payload);
          rxId = res.prescription?._id || res.prescription?.id;
          if (rxId) setSavedRxId(rxId);
        } catch (err) {
          console.warn('Could not create rx:', err);
        }
      } else {
        try {
          await api.prescriptions.update(rxId, payload);
        } catch (err) {
          console.warn('Could not update rx:', err);
        }
      }

      if (rxId) {
        try {
          await api.prescriptions.finalize(rxId);
        } catch (err) {
          console.warn('Could not finalize rx:', err);
        }
      }

      fetchQueue();
      loadRxHistory();
    } catch (e: any) {
      console.error('Finalize print error:', e);
    } finally {
      setSaving(false);
      setTimeout(() => {
        window.print();
      }, 300);
    }
  };

  // Dynamic Prescription History Filter
  const filteredRxHistory = rxHistory.filter((rx) => {
    const q = historySearchQuery.toLowerCase().trim();
    const appt = typeof rx.appointment === 'object' ? rx.appointment : null;
    const patientName = rx.patientName || appt?.patientName || '';
    const phone = rx.phone || appt?.phone || '';
    const date = rx.date || appt?.date || (rx.createdAt ? new Date(rx.createdAt).toISOString().slice(0, 10) : '');
    const serialNumber = rx.serialNumber || appt?.serialNumber || '';

    const matchesSearch =
      !q ||
      patientName.toLowerCase().includes(q) ||
      phone.includes(q) ||
      rx.diagnosis?.toLowerCase().includes(q) ||
      rx.chiefComplaints?.toLowerCase().includes(q) ||
      date.includes(q) ||
      String(serialNumber).includes(q) ||
      rx.medicines?.some(
        (m: any) =>
          m.brandName?.toLowerCase().includes(q) ||
          m.medicineName?.toLowerCase().includes(q) ||
          m.generic?.toLowerCase().includes(q)
      );

    const matchesStatus =
      historyStatusFilter === 'All' ||
      (historyStatusFilter === 'Finalized' && rx.isFinalized) ||
      (historyStatusFilter === 'Draft' && !rx.isFinalized);

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      {/* ───────────────────────────────────────────────────────────── */}
      {/* SCREEN VIEW (Hidden when printing) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row no-print screen-only print:hidden">
        {/* Doctor Side Panel */}
        <DoctorSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenHistory={() => setActiveTab('history')}
          onRefreshQueue={fetchQueue}
          doctorName={doctorProfile?.user?.name || user?.name}
          speciality={doctorProfile?.speciality}
          bmdcRegNo={doctorProfile?.bmdcRegNo}
          queueCount={queue.length}
          inProgressPatient={queue.find((a: any) => a.status === 'In Progress')}
        />

        {/* Main Content Workspace */}
        <main className="flex-1 lg:ml-72 min-w-0 transition-all duration-300">
          {/* Top Sticky Header */}
          <header className="bg-white border-b border-slate-200 relative lg:sticky top-0 z-20 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div>
              <h1 className="text-base sm:text-xl font-black text-slate-900 capitalize flex items-center gap-2">
                {activeTab === 'consultation' && 'Clinical Prescription Suite'}
                {activeTab === 'queue' && 'Today Patient Queue Monitor'}
                {activeTab === 'history' && 'Prescription Archive & Dynamic Search'}
                {activeTab === 'profile' && 'Doctor Profile & Chamber Settings'}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                SmartCare Chamber Suite • {doctorProfile?.user?.name || user?.name} • {today}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3.5 py-2 border text-xs font-bold rounded-xl transition-all shadow-xs ${
                  activeTab === 'history'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Rx Archive ({rxHistory.length})</span>
              </button>

              <button
                onClick={() => {
                  fetchQueue();
                  loadRxHistory();
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </header>

          <div className="max-w-7xl mx-auto p-3.5 sm:p-6">
            {/* ════════════════════════════════════════════════════════════════ */}
            {/* TAB 1: CONSULTATION WORKSPACE */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'consultation' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Patient Queue Sidebar */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Today&apos;s Queue
                    </h2>
                    <span className="text-xs text-slate-500 font-bold">{queue.length} Patients</span>
                  </div>
                  <div className="space-y-2 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
                    {queue.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center py-4">No patients today</p>
                    ) : (
                      queue.map((apt: any) => (
                        <div
                          key={apt._id}
                          onClick={() => handleSelectPatient(apt)}
                          className={`bg-white rounded-xl p-3 border cursor-pointer transition-all ${
                            activePatient?._id === apt._id
                              ? 'border-emerald-500 shadow-md shadow-emerald-100 ring-2 ring-emerald-500/20'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-slate-900">
                              #{String(apt.serialNumber).padStart(2, '0')}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                                apt.status === 'In Progress'
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                  : apt.status === 'Completed'
                                  ? 'bg-slate-100 text-slate-500 border-slate-300'
                                  : 'bg-amber-100 text-amber-700 border-amber-300'
                              }`}
                            >
                              {apt.status}
                            </span>
                          </div>
                          <div className="font-semibold text-slate-800 text-xs mt-1 truncate">
                            {apt.patientName}
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            {apt.age} yrs • {apt.gender}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right: Consultation Workspace */}
                <div className="lg:col-span-9 space-y-5">
                  {/* Active Patient Banner */}
                  <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-lg">
                    {activePatient ? (
                      <>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500 text-slate-950 font-black text-xl flex items-center justify-center">
                            #{String(activePatient.serialNumber).padStart(2, '0')}
                          </div>
                          <div>
                            <div className="font-black text-white text-base flex items-center gap-2">
                              <span>{activePatient.patientName}</span>
                              {savedRxId && (
                                <span className="text-[10px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-700/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Edit3 className="w-3 h-3" /> Saved Rx Loaded
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-xs">
                              {activePatient.age} yrs • {activePatient.gender} • {activePatient.phone}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            activePatient.status === 'In Progress'
                              ? 'bg-emerald-900 text-emerald-300 border border-emerald-700'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {activePatient.status}
                        </span>
                      </>
                    ) : (
                      <p className="text-slate-400 text-sm">Select a patient from the queue →</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                    {/* Vitals + Clinical */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                          <HeartPulse className="w-4 h-4 text-emerald-600" /> Vitals
                        </h3>
                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                          {[
                            ['BP (mmHg)', 'bp'],
                            ['Pulse (bpm)', 'pulse'],
                            ['Weight (kg)', 'weight'],
                            ['Temp (°F)', 'temp'],
                          ].map(([label, key]) => (
                            <div key={key}>
                              <label className="text-slate-500 font-medium block mb-1">{label}</label>
                              <input
                                value={(vitals as any)[key]}
                                onChange={(e) => setVitals({ ...vitals, [key]: e.target.value })}
                                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 text-xs">
                        <div>
                          <label className="text-slate-600 font-bold block mb-1">Chief Complaints</label>
                          <textarea
                            rows={3}
                            value={complaints}
                            onChange={(e) => setComplaints(e.target.value)}
                            placeholder="Symptoms..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-slate-600 font-bold block mb-1">Diagnosis (Optional)</label>
                          <input
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            placeholder="e.g. Acute URTI / Fever"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-slate-600 font-bold block mb-1">Advice</label>
                          <textarea
                            rows={2}
                            value={advice}
                            onChange={(e) => setAdvice(e.target.value)}
                            placeholder="Dietary & lifestyle advice..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-slate-600 font-bold block mb-1">Follow-up Date</label>
                          <input
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                            placeholder="e.g. 7 Days later"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Smart Rx Builder */}
                    <div className="md:col-span-3 space-y-4">
                      <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-600" /> Trie Dictionary Search
                          </h3>
                          <div className="flex items-center gap-2">
                            {searchMeta && (
                              <span className="text-[10px] font-bold bg-slate-900 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                                ⚡ {searchMeta.time}ms ({searchMeta.total} matches)
                              </span>
                            )}
                            <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                              26K+ Dataset Trie
                            </span>
                          </div>
                        </div>

                        {/* Autocomplete Input */}
                        <div className="relative mb-3" ref={dropdownRef}>
                          <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                            <input
                              value={searchQuery}
                              onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentMed({ ...currentMed, brandName: e.target.value });
                              }}
                              placeholder="Type 2+ letters: Napa, Seclo, Cipro..."
                              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            />
                            {isSearching && (
                              <span className="absolute right-3.5 top-3 text-xs text-slate-400">⏳</span>
                            )}
                          </div>
                          {showDropdown && searchResults.length > 0 && (
                            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-64 overflow-y-auto">
                              <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                                <span>Click medicine to add directly</span>
                                <span>Instant Add ⚡</span>
                              </div>
                              {searchResults.map((med) => (
                                <div
                                  key={med.id}
                                  onClick={() => handleSelectAndAddMedicine(med)}
                                  className="px-3 py-2.5 hover:bg-emerald-50 cursor-pointer border-b border-slate-100 last:border-0 flex items-center justify-between group transition-colors"
                                >
                                  <div>
                                    <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                      {med.brandName}
                                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                        {med.dosageForm}
                                      </span>
                                      <span className="text-xs text-slate-500">{med.strength}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 italic">{med.generic}</div>
                                  </div>
                                  <span className="opacity-0 group-hover:opacity-100 text-[11px] font-extrabold bg-emerald-600 text-white px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-sm">
                                    + Add to Rx
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 mb-3 text-xs">
                          <div>
                            <label className="text-slate-500 font-semibold block mb-1">Dosage Form</label>
                            <select
                              value={currentMed.dosageForm}
                              onChange={(e) =>
                                setCurrentMed({ ...currentMed, dosageForm: e.target.value })
                              }
                              className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                            >
                              {['Tablet', 'Capsule', 'Syrup', 'Injection', 'Drop', 'Ointment'].map((f) => (
                                <option key={f}>{f}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-slate-500 font-semibold block mb-1">Strength</label>
                            <input
                              value={currentMed.strength}
                              onChange={(e) => setCurrentMed({ ...currentMed, strength: e.target.value })}
                              placeholder="500 mg"
                              className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>

                        {/* Quick-Click Selectors */}
                        {[
                          { label: 'Frequency', key: 'frequency', options: FREQUENCIES },
                          { label: 'Timing', key: 'timing', options: TIMINGS },
                          { label: 'Duration', key: 'duration', options: DURATIONS },
                        ].map(({ label, key, options }) => (
                          <div key={key} className="mb-3">
                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5 block">
                              {label}
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {options.map((opt) => (
                                <button
                                  type="button"
                                  key={opt}
                                  onClick={() => setCurrentMed({ ...currentMed, [key]: opt })}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    (currentMed as any)[key] === opt
                                      ? key === 'frequency'
                                        ? 'bg-slate-900 text-emerald-400'
                                        : 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}

                        <div className="flex gap-2 pt-1">
                          <input
                            value={currentMed.instructions}
                            onChange={(e) =>
                              setCurrentMed({ ...currentMed, instructions: e.target.value })
                            }
                            placeholder="Special instruction (optional)"
                            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            onClick={addMedicine}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-400" /> Add
                          </button>
                        </div>
                      </div>

                      {/* Prescription List */}
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <span className="font-black text-slate-900 text-sm">
                            Rx — {medicines.length} medicines
                          </span>
                          <span className="text-slate-400 text-xs font-medium italic">Prescription list</span>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                          {medicines.length === 0 ? (
                            <p className="py-6 text-center text-slate-400 text-xs">No medicines added yet</p>
                          ) : (
                            medicines.map((m, i) => (
                              <div
                                key={m.id || `med-scr-${i}-${m.brandName}`}
                                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                              >
                                <div>
                                  <div className="text-sm font-bold text-slate-900">
                                    <span className="text-slate-400 mr-2 font-medium">{i + 1}.</span>
                                    [{m.dosageForm}] {m.brandName} {m.strength}
                                  </div>
                                  <div className="text-xs text-slate-400 italic ml-5">{m.generic}</div>
                                  <div className="flex items-center gap-2 ml-5 mt-1">
                                    <span className="text-[11px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                                      {m.frequency}
                                    </span>
                                    <span className="text-[11px] text-slate-600">
                                      {m.timing} • {m.duration}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setMedicines(medicines.filter((x) => x.id !== m.id))}
                                  className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={handleSaveRx}
                          disabled={saving}
                          className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          {saving ? 'Saving...' : savedRxId ? 'Update Saved Rx' : 'Save Prescription'}
                        </button>
                        <button
                          onClick={handleFinalizeAndPrint}
                          disabled={saving}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                        >
                          <Printer className="w-4 h-4" /> Finalize & Print
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* TAB 2: QUEUE MONITOR */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'queue' && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-600" /> Today Patient Queue Monitor
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Date: {today} • {queue.length} Total Patients
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('consultation')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <Stethoscope className="w-4 h-4" /> Back to Rx Suite
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                        <th className="py-3 px-4 text-center">Token</th>
                        <th className="py-3 px-4 text-left">Patient Name</th>
                        <th className="py-3 px-4 text-left">Phone</th>
                        <th className="py-3 px-4 text-left">Time Slot</th>
                        <th className="py-3 px-4 text-left">Reason</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {queue.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 text-xs font-semibold">
                            No patients scheduled for today yet.
                          </td>
                        </tr>
                      ) : (
                        queue.map((apt: any) => (
                          <tr key={apt._id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 font-black text-sm">
                                #{String(apt.serialNumber).padStart(2, '0')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {apt.patientName}
                              <div className="text-xs text-slate-400 font-normal">
                                {apt.age} Yrs • {apt.gender}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-600 text-xs">{apt.phone}</td>
                            <td className="py-3.5 px-4 text-slate-600 text-xs">{apt.timeSlot}</td>
                            <td className="py-3.5 px-4 text-slate-500 text-xs">{apt.reason}</td>
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                  apt.status === 'In Progress'
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                    : apt.status === 'Completed'
                                    ? 'bg-slate-100 text-slate-600 border-slate-300'
                                    : 'bg-amber-100 text-amber-800 border-amber-300'
                                }`}
                              >
                                {apt.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => handleSelectPatient(apt)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1"
                              >
                                <Stethoscope className="w-3.5 h-3.5 text-emerald-400" /> Start Rx
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* TAB 3: DYNAMIC PRESCRIPTION HISTORY ARCHIVE */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'history' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Search & Dynamic Filter Header Bar */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
                  {/* Dynamic Search Bar */}
                  <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Dynamic search by patient, phone, diagnosis, medicine, date..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    {historySearchQuery && (
                      <button
                        onClick={() => setHistorySearchQuery('')}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Status Filters */}
                  <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                    <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5" /> Filter:
                    </span>
                    {(['All', 'Finalized', 'Draft'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setHistoryStatusFilter(st)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          historyStatusFilter === st
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}

                    <button
                      onClick={loadRxHistory}
                      disabled={historyLoading}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                      title="Reload History"
                    >
                      <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Prescription List Container */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-600" /> Prescriptions History Archive (
                      {filteredRxHistory.length})
                    </h3>
                    {historySearchQuery && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        Filtering by: &quot;{historySearchQuery}&quot;
                      </span>
                    )}
                  </div>

                  {historyLoading ? (
                    <div className="text-center py-16 text-slate-500 space-y-2">
                      <RefreshCw className="w-8 h-8 mx-auto text-emerald-500 animate-spin" />
                      <p className="font-bold text-sm text-slate-700">Loading prescription archives...</p>
                    </div>
                  ) : filteredRxHistory.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 space-y-3">
                      <FileText className="w-12 h-12 mx-auto text-slate-300" />
                      <p className="font-bold text-sm text-slate-600">No prescriptions found matching your search</p>
                      <p className="text-xs text-slate-400">Try adjusting your search keywords or status filter.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredRxHistory.map((rx) => {
                        const appt = typeof rx.appointment === 'object' ? rx.appointment : null;
                        const pName = rx.patientName || appt?.patientName || 'Patient';
                        const pAge = rx.patientAge || rx.age || appt?.age;
                        const pGender = rx.patientGender || rx.gender || appt?.gender;
                        const pPhone = rx.phone || appt?.phone || 'N/A';
                        const pDate = rx.date || appt?.date || (rx.createdAt ? new Date(rx.createdAt).toISOString().slice(0, 10) : 'N/A');
                        const pSerial = rx.serialNumber || appt?.serialNumber || 1;

                        return (
                          <div
                            key={rx._id}
                            className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 hover:border-emerald-400 hover:shadow-md transition-all space-y-3"
                          >
                            {/* Top Row: Patient Info + Token + Badges */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 font-black text-base flex items-center justify-center shadow-xs">
                                  #{String(pSerial).padStart(2, '0')}
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                                    {pName}
                                    {pAge && (
                                      <span className="text-xs font-semibold text-slate-500">
                                        ({pAge} Yrs • {pGender || 'N/A'})
                                      </span>
                                    )}
                                  </h4>
                                  <p className="text-xs text-slate-500 font-mono">Phone: {pPhone}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> {pDate}
                                </span>

                              {rx.isFinalized ? (
                                <span className="text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Finalized
                                </span>
                              ) : (
                                <span className="text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 rounded-full">
                                  Draft
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Diagnosis & Vitals Summary */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                              <span className="text-slate-400 font-bold block text-[10px] uppercase">Diagnosis:</span>
                              <span className="font-extrabold text-slate-900 text-sm">
                                {rx.diagnosis || 'General Consultation'}
                              </span>
                            </div>

                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                              <span className="text-slate-400 font-bold block text-[10px] uppercase">Vitals:</span>
                              <span className="font-medium text-slate-700">
                                BP: {rx.vitals?.bp || 'N/A'} | Pulse: {rx.vitals?.pulse || 'N/A'}
                              </span>
                            </div>

                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                              <span className="text-slate-400 font-bold block text-[10px] uppercase">
                                Prescribed Medicines ({rx.medicines?.length || 0}):
                              </span>
                              <div className="font-semibold text-emerald-700 truncate">
                                {rx.medicines && rx.medicines.length > 0
                                  ? rx.medicines.map((m: any) => m.brandName).join(', ')
                                  : 'None'}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end gap-3 pt-1">
                            <button
                              onClick={() => handleLoadPrescriptionFromHistory(rx, false)}
                              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Edit & Load in Suite</span>
                            </button>

                            <button
                              onClick={() => handleLoadPrescriptionFromHistory(rx, true)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print Prescription</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* TAB 4: DOCTOR PROFILE SETTINGS */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'profile' && <ProfileSettings />}
          </div>
        </main>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* AUTHENTIC & MODERN PHYSICAL DOCTOR PRESCRIPTION PAD TEMPLATE */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="hidden print:block printable-container bg-white text-slate-900 font-sans p-8 min-h-screen">
        {/* Doctor & Chamber Top Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-950 tracking-tight">
              {doctorProfile?.user?.name || user?.name || 'Dr. Rihad Hossain'}
            </h1>
            <p className="text-xs font-bold text-emerald-800 mt-0.5">
              {doctorProfile?.speciality || 'Internal Medicine Specialist'}
            </p>
            <p className="text-xs text-slate-700 font-semibold mt-0.5">
              {doctorProfile?.qualifications || 'MBBS, FCPS (Medicine)'}
            </p>
            <p className="text-[11px] text-slate-600 font-mono mt-1">
              BMDC Reg No: <strong className="text-slate-900">{doctorProfile?.bmdcRegNo || 'BMDC-A-12345'}</strong>
            </p>
          </div>

          <div className="text-right">
            <div className="inline-flex items-center gap-1 text-slate-900 font-black text-sm tracking-wide uppercase mb-1">
              <Stethoscope className="w-4 h-4 text-emerald-700" /> SmartCare Specialist Hospital
            </div>
            <p className="text-xs font-semibold text-slate-800">{doctorProfile?.roomNumber || 'Chamber 05'}</p>
            <p className="text-xs text-slate-600">
              Visiting: {doctorProfile?.visitingHours?.startTime || '10:00 AM'} -{' '}
              {doctorProfile?.visitingHours?.endTime || '04:00 PM'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Serial Hotline: +880 1700-000000</p>
          </div>
        </div>

        {/* Patient Details Clean Paper Strip */}
        {activePatient && (
          <div className="border-y border-slate-400 py-2.5 my-3 grid grid-cols-4 gap-3 text-xs font-semibold text-slate-900 items-center">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Patient Name</span>
              <span className="font-extrabold text-slate-950 text-sm">{activePatient.patientName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Age / Gender</span>
              <span className="text-slate-900">
                {activePatient.age} Yrs / {activePatient.gender}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Date</span>
              <span className="text-slate-900">{today}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Serial Token</span>
              <span className="font-extrabold text-slate-950 text-sm">
                #{String(activePatient.serialNumber).padStart(2, '0')}
              </span>
            </div>
          </div>
        )}

        {/* Prescription Main Layout (2 Columns Paper Style) */}
        <div className="grid grid-cols-12 gap-6 min-h-125 mt-4">
          {/* Left Column (Clinical Margin - width 4/12) */}
          <div className="col-span-4 border-r border-slate-300 pr-4 space-y-5 text-xs">
            {/* O/E (Vitals) */}
            {(vitals.bp || vitals.pulse || vitals.weight || vitals.temp) && (
              <div>
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-300 pb-0.5 mb-1.5 uppercase">
                  O/E (Vitals)
                </h4>
                <div className="space-y-1 font-mono text-xs text-slate-800">
                  {vitals.bp && <div>BP: <strong>{vitals.bp}</strong> mmHg</div>}
                  {vitals.pulse && <div>Pulse: <strong>{vitals.pulse}</strong> bpm</div>}
                  {vitals.weight && <div>Weight: <strong>{vitals.weight}</strong> kg</div>}
                  {vitals.temp && <div>Temp: <strong>{vitals.temp}</strong> °F</div>}
                </div>
              </div>
            )}

            {/* C/C (Chief Complaints) */}
            {complaints && (
              <div>
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-300 pb-0.5 mb-1.5 uppercase">
                  C/C (Chief Complaints)
                </h4>
                <p className="text-slate-800 font-medium whitespace-pre-line leading-relaxed text-xs">
                  {complaints}
                </p>
              </div>
            )}

            {/* Dx (Diagnosis) */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs border-b border-slate-300 pb-0.5 mb-1 uppercase">
                Dx (Diagnosis)
              </h4>
              <p className="font-black text-slate-950 text-xs">
                {diagnosis.trim() || 'General Consultation'}
              </p>
            </div>

            {/* Adv. (Advice) */}
            {advice && (
              <div>
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-300 pb-0.5 mb-1 uppercase">
                  Adv. (Advice)
                </h4>
                <p className="text-slate-800 whitespace-pre-line leading-relaxed text-xs">{advice}</p>
              </div>
            )}

            {/* Follow Up */}
            {followUpDate && (
              <div className="pt-2 border-t border-slate-200 text-xs font-semibold text-slate-900">
                <span className="text-slate-600 block">Next Visit / Follow-up:</span>
                <span className="font-bold text-slate-950">{followUpDate}</span>
              </div>
            )}
          </div>

          {/* Right Column (Rx Prescription - width 8/12) */}
          <div className="col-span-8 pl-2 space-y-4">
            {/* Rx Symbol Header */}
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
              {medicines.map((m, i) => (
                <div key={m.id || `med-prt-${i}-${m.brandName}`} className="border-b border-slate-200/80 pb-3 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-slate-900 text-xs">{i + 1}.</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {m.dosageForm}. {m.brandName}
                    </span>
                    {m.strength && (
                      <span className="text-xs font-semibold text-slate-700">({m.strength})</span>
                    )}
                  </div>

                  {m.generic && (
                    <div className="text-xs text-slate-500 italic pl-5">({m.generic})</div>
                  )}

                  <div className="pl-5 pt-0.5 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-800">
                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-slate-900">
                      {m.frequency}
                    </span>
                    <span>{m.timing}</span>
                    <span>for <strong>{m.duration}</strong></span>
                  </div>

                  {m.instructions && (
                    <div className="pl-5 text-[11px] text-slate-600 italic">
                      Note: {m.instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Doctor Signature Footer */}
        <div className="mt-14 pt-4 border-t-2 border-slate-900 flex justify-between items-end text-xs text-slate-700">
          <div>
            <p className="font-bold text-slate-900">SmartCare Medical System</p>
            <p className="text-[10px] text-slate-500">Official Computerized Prescription Pad</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-b border-slate-800 mb-1"></div>
            <p className="font-bold text-slate-950">{doctorProfile?.user?.name || user?.name || 'Doctor Signature'}</p>
            <p className="text-[10px] text-slate-600 font-mono">BMDC Reg No: {doctorProfile?.bmdcRegNo || 'A-12345'}</p>
          </div>
        </div>
      </div>
    </>
  );
}

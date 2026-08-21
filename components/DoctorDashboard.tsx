'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Stethoscope, User, Plus, Trash2, Search, CheckCircle, 
  Printer, AlertCircle, Clock, HeartPulse, Edit3, ChevronDown, Sparkles
} from 'lucide-react';
import { Appointment, Medicine, PrescribedMedicine, Prescription, Vitals } from '@/lib/types';
import { getAppointments, savePrescription, updateAppointmentStatus } from '@/lib/storage';

interface DoctorDashboardProps {
  selectedAppointment?: Appointment | null;
  onPrintPrescription: (prescription: Prescription) => void;
  onQueueUpdated?: () => void;
}

export default function DoctorDashboard({ 
  selectedAppointment, 
  onPrintPrescription,
  onQueueUpdated 
}: DoctorDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activePatient, setActivePatient] = useState<Appointment | null>(selectedAppointment || null);

  // Vitals State
  const [vitals, setVitals] = useState<Vitals>({
    bp: '120/80',
    pulse: '76',
    weight: '65',
    temp: '98.6',
  });

  // Clinical Notes
  const [complaints, setComplaints] = useState('Fever for 3 days, dry cough, body pain');
  const [diagnosis, setDiagnosis] = useState('Viral Upper Respiratory Tract Infection');
  const [advice, setAdvice] = useState('Drink warm water, take rest, avoid cold beverages.');
  const [followUpDate, setFollowUpDate] = useState('7 Days later');

  // Medicine Search & Auto-complete state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Current Medicine Form State
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

  // Added Prescribed Medicines List
  const [prescribedMedicines, setPrescribedMedicines] = useState<PrescribedMedicine[]>([
    {
      id: 'med-1',
      brandName: 'Napa Extra',
      generic: 'Paracetamol + Caffeine',
      dosageForm: 'Tablet',
      strength: '500 mg + 65 mg',
      frequency: '1+0+1',
      timing: 'After Food',
      duration: '5 Days',
      instructions: 'Take when fever > 100°F',
    },
    {
      id: 'med-2',
      brandName: 'Azicin',
      generic: 'Azithromycin',
      dosageForm: 'Tablet',
      strength: '500 mg',
      frequency: '1+0+0',
      timing: 'Before Food',
      duration: '5 Days',
      instructions: 'Complete full 5-day course',
    }
  ]);

  // Load appointments
  useEffect(() => {
    const data = getAppointments();
    setAppointments(data);
    if (!activePatient && data.length > 0) {
      // Pick first inside or waiting patient
      const currentInside = data.find(a => a.status === 'Inside') || data.find(a => a.status === 'Waiting') || data[0];
      setActivePatient(currentInside);
    }
  }, []);

  useEffect(() => {
    if (selectedAppointment) {
      setActivePatient(selectedAppointment);
    }
  }, [selectedAppointment]);

  // Handle outside click for medicine autocomplete dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced API search for medicine.json
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/medicines?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.medicines || []);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Failed to search medicines', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select medicine from autocomplete dropdown
  const handleSelectMedicine = (med: Medicine) => {
    setCurrentMed({
      ...currentMed,
      brandName: med.brandName,
      generic: med.generic,
      dosageForm: med.dosageForm || 'Tablet',
      strength: med.strength || '',
    });
    setSearchQuery(med.brandName);
    setShowDropdown(false);
  };

  // Add medicine to list
  const handleAddMedicine = () => {
    if (!currentMed.brandName) {
      alert('Please select or enter a medicine brand name.');
      return;
    }

    const newMed: PrescribedMedicine = {
      id: `med-${Date.now()}`,
      ...currentMed,
    };

    setPrescribedMedicines([...prescribedMedicines, newMed]);

    // Reset medicine input
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

  // Remove medicine
  const handleRemoveMedicine = (id: string) => {
    setPrescribedMedicines(prescribedMedicines.filter(m => m.id !== id));
  };

  // Build full prescription object
  const buildPrescriptionObject = (): Prescription => {
    return {
      id: `Rx-${Date.now()}`,
      appointmentId: activePatient?.id || 'walkin-1',
      tokenNumber: activePatient?.tokenNumber || '01',
      patientName: activePatient?.patientName || 'Walk-in Patient',
      age: activePatient?.age || 35,
      gender: activePatient?.gender || 'Male',
      phone: activePatient?.phone || '',
      date: new Date().toISOString().split('T')[0],
      doctorName: 'Dr. Tanvir Ahmed',
      doctorSpecialty: 'MBBS, FCPS (Medicine), MD (Cardiology)',
      doctorRegNo: 'BMDC Reg No: A-54321',
      vitals,
      complaints,
      clinicalNotes: '',
      diagnosis,
      medicines: prescribedMedicines,
      advice,
      followUpDate,
    };
  };

  const handleSaveAndPrint = () => {
    const rx = buildPrescriptionObject();
    savePrescription(rx);

    if (activePatient) {
      updateAppointmentStatus(activePatient.id, 'Completed');
      if (onQueueUpdated) onQueueUpdated();
    }

    onPrintPrescription(rx);
  };

  // Preset Options
  const frequencies = ['1+0+1', '1+1+1', '1+0+0', '0+0+1', '1+1+1+1', '0+1+0', 'As needed'];
  const timings = ['After Food', 'Before Food', 'With Food', 'Empty Stomach', 'At Bedtime'];
  const durations = ['3 Days', '5 Days', '7 Days', '10 Days', '14 Days', '1 Month', 'Continue'];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Top Bar: Active Patient Selector */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg mb-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
            #{activePatient?.tokenNumber || '01'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white">{activePatient?.patientName || 'Select Patient'}</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-700">
                {activePatient?.status || 'Active'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {activePatient?.age} Yrs • {activePatient?.gender} • Phone: {activePatient?.phone} • Reason: {activePatient?.reason || 'Checkup'}
            </p>
          </div>
        </div>

        {/* Change Patient Dropdown */}
        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-slate-400 whitespace-nowrap hidden sm:inline">Select Queue Patient:</label>
          <select
            value={activePatient?.id || ''}
            onChange={(e) => {
              const selected = appointments.find(a => a.id === e.target.value);
              if (selected) setActivePatient(selected);
            }}
            className="bg-slate-800 text-white text-xs rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-emerald-500"
          >
            {appointments.map((apt) => (
              <option key={apt.id} value={apt.id}>
                Token #{apt.tokenNumber} - {apt.patientName} ({apt.status})
              </option>
            ))}
          </select>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (4 Cols): Vitals & Clinical Examination */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Patient Vitals Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3 flex items-center space-x-2">
              <HeartPulse className="w-4 h-4 text-emerald-600" />
              <span>Patient Vitals</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Blood Pressure (mmHg)</label>
                <input
                  type="text"
                  value={vitals.bp}
                  onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold focus:border-emerald-500 outline-none"
                  placeholder="120/80"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Pulse (bpm)</label>
                <input
                  type="text"
                  value={vitals.pulse}
                  onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold focus:border-emerald-500 outline-none"
                  placeholder="76"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Weight (kg)</label>
                <input
                  type="text"
                  value={vitals.weight}
                  onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold focus:border-emerald-500 outline-none"
                  placeholder="65"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Temperature (°F)</label>
                <input
                  type="text"
                  value={vitals.temp}
                  onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold focus:border-emerald-500 outline-none"
                  placeholder="98.6"
                />
              </div>
            </div>
          </div>

          {/* Clinical Findings & Notes */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center space-x-2">
              <Edit3 className="w-4 h-4 text-emerald-600" />
              <span>Clinical Examination</span>
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chief Complaints / Symptoms</label>
              <textarea
                rows={3}
                value={complaints}
                onChange={(e) => setComplaints(e.target.value)}
                placeholder="Describe symptoms..."
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-emerald-500 outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Clinical Diagnosis</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Acute Gastritis, Viral Fever"
                className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold text-slate-900 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Doctor Advice</label>
              <textarea
                rows={2}
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                placeholder="General dietary & lifestyle advice..."
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Follow-Up Date</label>
              <input
                type="text"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                placeholder="e.g. 7 Days later"
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

        </div>

        {/* Right Column (8 Cols): Smart Prescription Builder */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Smart Medicine Search & Fast Selector */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>Smart Medicine Search (medicine.json)</span>
              </h3>
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                26,000+ Auto-Complete Database
              </span>
            </div>

            {/* Medicine Auto-Complete Input */}
            <div className="relative mb-4" ref={dropdownRef}>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Type Medicine Name (Min 2-3 letters)
              </label>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="e.g. Napa, Seclo, Sergel, Ace, Cipro..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentMed({ ...currentMed, brandName: e.target.value });
                  }}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-semibold text-sm transition-all"
                />
                {isSearching && (
                  <div className="absolute right-3.5 top-3.5 text-xs text-slate-400 animate-spin">
                    ⏳
                  </div>
                )}
              </div>

              {/* Auto-Complete Dropdown List */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((med) => (
                    <div
                      key={med.id}
                      onClick={() => handleSelectMedicine(med)}
                      className="p-3 hover:bg-emerald-50/80 cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                          <span>{med.brandName}</span>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border">
                            {med.dosageForm}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">{med.strength}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          Generic: <span className="text-slate-700 italic">{med.generic}</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium text-right max-w-[140px] truncate">
                        {med.manufacturer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dosage Form & Strength details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Dosage Form</label>
                <select
                  value={currentMed.dosageForm}
                  onChange={(e) => setCurrentMed({ ...currentMed, dosageForm: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Suspension">Suspension</option>
                  <option value="Drop">Drop</option>
                  <option value="Ointment">Ointment</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Strength</label>
                <input
                  type="text"
                  placeholder="e.g. 500 mg"
                  value={currentMed.strength}
                  onChange={(e) => setCurrentMed({ ...currentMed, strength: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 font-medium"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-semibold text-slate-600 mb-1">Generic Name</label>
                <input
                  type="text"
                  placeholder="Generic active ingredient..."
                  value={currentMed.generic}
                  onChange={(e) => setCurrentMed({ ...currentMed, generic: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 font-medium"
                />
              </div>
            </div>

            {/* Quick-Click Selector 1: Frequency */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Frequency (Quick Select)
              </label>
              <div className="flex flex-wrap gap-2">
                {frequencies.map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setCurrentMed({ ...currentMed, frequency: freq })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      currentMed.frequency === freq
                        ? 'bg-slate-900 text-emerald-400 shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick-Click Selector 2: Timing */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Timing (Quick Select)
              </label>
              <div className="flex flex-wrap gap-2">
                {timings.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setCurrentMed({ ...currentMed, timing: time })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentMed.timing === time
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick-Click Selector 3: Duration */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Duration (Quick Select)
              </label>
              <div className="flex flex-wrap gap-2">
                {durations.map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setCurrentMed({ ...currentMed, duration: dur })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentMed.duration === dur
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {dur}
                  </button>
                ))}
              </div>
            </div>

            {/* Specific Instructions & Add Button */}
            <div className="flex flex-col sm:flex-row items-end gap-3 pt-2">
              <div className="w-full">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Special Instruction (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Take with full glass of water when pain occurs"
                  value={currentMed.instructions}
                  onChange={(e) => setCurrentMed({ ...currentMed, instructions: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleAddMedicine}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Add Medicine to Rx</span>
              </button>
            </div>

          </div>

          {/* Prescribed Medicines List Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900">Prescribed Medicine Items ({prescribedMedicines.length})</h4>
              <span className="text-xs text-slate-500">Drag/reorder or delete items</span>
            </div>

            <div className="divide-y divide-slate-100">
              {prescribedMedicines.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No medicines added yet. Use the smart search box above to build prescription.
                </div>
              ) : (
                prescribedMedicines.map((med, idx) => (
                  <div key={med.id} className="p-4 hover:bg-slate-50/50 flex items-center justify-between gap-4">
                    <div className="flex items-start space-x-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          [{med.dosageForm}] {med.brandName} <span className="text-xs text-slate-600 font-normal">{med.strength}</span>
                        </div>
                        <div className="text-xs text-slate-400 italic mb-1">{med.generic}</div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                            {med.frequency}
                          </span>
                          <span className="text-slate-600 font-medium">{med.timing}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-700 font-semibold">{med.duration}</span>
                        </div>
                        {med.instructions && (
                          <div className="text-[11px] text-slate-500 mt-1">Note: {med.instructions}</div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveMedicine(med.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove medicine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Bar: Save & Print */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="text-xs text-slate-500">
              Ready to issue prescription for <strong className="text-slate-800">{activePatient?.patientName || 'Patient'}</strong>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                onClick={handleSaveAndPrint}
                className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Save & Print A4 Prescription</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

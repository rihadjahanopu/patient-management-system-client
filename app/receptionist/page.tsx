/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/typedef */
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQueueStore } from '@/hooks/useQueueStore';
import { api } from '@/lib/api';
import ReceptionistSidebar, { ReceptionistTab } from '@/components/ReceptionistSidebar';
import ProfileSettings from '@/components/ProfileSettings';
import {
  Plus,
  Play,
  CheckCircle,
  XCircle,
  RefreshCw,
  Stethoscope,
  Search,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useClinicSetting } from '@/hooks/useClinicSetting';

export default function ReceptionistPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const today: string = new Date().toISOString().split('T')[0];
  const { enableTimeSlot } = useClinicSetting();
  const timeSlotEnabled: boolean = enableTimeSlot !== false;

  const [activeTab, setActiveTab] = useState<ReceptionistTab>('queue');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Search/Track Patient
  const [trackId, setTrackId] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackError, setTrackError] = useState('');

  const [form, setForm] = useState({
    patientName: '',
    phone: '',
    age: '',
    gender: 'Male',
    timeSlot: '09:00 AM - 09:30 AM',
    reason: '',
  });
  const [formError, setFormError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Zustand Store
  const {
    queue,
    currentServingSerial,
    nextSerial,
    waitingCount,
    setDoctorAndDate,
    updateAppointmentStatus,
    bookAppointment,
    fetchQueue,
  } = useQueueStore();

  const slots: string[] = [
    '09:00 AM - 09:30 AM',
    '09:30 AM - 10:00 AM',
    '10:00 AM - 10:30 AM',
    '10:30 AM - 11:00 AM',
    '11:00 AM - 11:30 AM',
    '11:30 AM - 12:00 PM',
    '05:00 PM - 05:30 PM',
    '05:30 PM - 06:00 PM',
    '06:00 PM - 06:30 PM',
  ];

  useEffect(() => {
    if (authLoading) return; // Wait until session restoration finishes
    if (!user) {
      router.push('/login');
      return;
    }
    if (!['Receptionist', 'Admin'].includes(user.role)) {
      router.push('/');
      return;
    }
    api.doctors.getAll().then((d) => {
      setDoctors(d.doctors || []);
      if (d.doctors && d.doctors.length > 0) setSelectedDoctor(d.doctors[0]._id);
    });
  }, [user, authLoading, router]);

  useEffect(() => {
    if (selectedDoctor) {
      setDoctorAndDate(selectedDoctor, today);
    }
  }, [selectedDoctor, today, setDoctorAndDate]);

  const handleStatusChange = async (appointmentId: string, status: string) => {
    try {
      await updateAppointmentStatus(appointmentId, status);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);
    try {
      const res = await bookAppointment({
        ...form,
        timeSlot: timeSlotEnabled ? form.timeSlot : 'Open Serial / Chamber Hours',
        age: Number(form.age),
        doctorId: selectedDoctor,
        date: today,
      });
      setBookingSuccess(
        `Token #${String(res.appointment.serialNumber).padStart(2, '0')} issued for ${
          res.appointment.patientName
        }`
      );
      setShowForm(false);
      setForm({
        patientName: '',
        phone: '',
        age: '',
        gender: 'Male',
        timeSlot: '09:00 AM - 09:30 AM',
        reason: '',
      });
      setTimeout(() => setBookingSuccess(null), 5000);
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackId.trim()) return;
    setTrackError('');
    setTrackResult(null);
    try {
      const res = await api.appointments.track(trackId.trim());
      setTrackResult(res);
    } catch (e: any) {
      setTrackError(e.message || 'Appointment not found');
    }
  };

  const statusColor: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-800 border-amber-300',
    'In Progress': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Completed: 'bg-slate-100 text-slate-600 border-slate-300',
    Cancelled: 'bg-rose-100 text-rose-800 border-rose-300',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Receptionist Side Panel */}
      <ReceptionistSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewAppointment={() => {
          setActiveTab('queue');
          setShowForm(true);
        }}
        onRefresh={fetchQueue}
        waitingCount={waitingCount}
        totalToday={queue.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 min-w-0 transition-all duration-300">
        {/* Sticky Top Header */}
        <header className="bg-white border-b border-slate-200 relative lg:sticky top-0 z-20 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div>
            <h1 className="text-base sm:text-xl font-black text-slate-900 capitalize flex items-center gap-2">
              {activeTab === 'queue' && 'Receptionist Live Queue & Booking'}
              {activeTab === 'doctors' && 'Doctor Schedules & Room Roster'}
              {activeTab === 'track' && 'Patient Appointment Tracker'}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
              SmartCare Clinic • Today: {today}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchQueue()}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Refresh Queue"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('queue');
                setShowForm(!showForm);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Appointment</span>
            </button>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-3.5 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Success Toast */}
          {bookingSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 animate-fadeIn">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              {bookingSuccess}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: QUEUE & BOOKING */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'queue' && (
            <div className="space-y-6">
              {/* Live Queue Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-linear-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-5 col-span-2 shadow-lg border border-slate-800">
                  <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Serving Now
                  </div>
                  <div className="text-5xl font-black">
                    {currentServingSerial ? `#${String(currentServingSerial).padStart(2, '0')}` : '--'}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-1">Next Up</div>
                  <div className="text-4xl font-black text-amber-500">
                    {nextSerial ? `#${String(nextSerial).padStart(2, '0')}` : '--'}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-1">Waiting In Queue</div>
                  <div className="text-4xl font-black text-slate-800">{waitingCount}</div>
                </div>
              </div>

              {/* Doctor Selection Bar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                    Select Doctor:
                  </label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.user?.name} — {d.speciality} ({d.roomNumber || 'Room 01'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Booking Form */}
              {showForm && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-fadeIn">
                  <h3 className="font-extrabold text-slate-900 text-base mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-600" /> Schedule New Appointment Token
                  </h3>
                  <form onSubmit={handleBookAppointment} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Patient Full Name *', field: 'patientName', placeholder: 'e.g. Kabir Hossain', type: 'text' },
                      { label: 'Phone Number *', field: 'phone', placeholder: '+880 1700-000000', type: 'tel' },
                      { label: 'Age *', field: 'age', placeholder: '34', type: 'number' },
                    ].map(({ label, field, placeholder, type }) => (
                      <div key={field}>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                        <input
                          type={type}
                          required
                          placeholder={placeholder}
                          value={(form as any)[field]}
                          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    ))}

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Gender *</label>
                      <select
                        value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:border-emerald-500 font-semibold"
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>

                    {timeSlotEnabled && (
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Select Time Slot</label>
                        <div className="grid grid-cols-3 gap-2">
                          {slots.map((s) => (
                            <button
                              type="button"
                              key={s}
                              onClick={() => setForm({ ...form, timeSlot: s })}
                              className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                form.timeSlot === s
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for Visit</label>
                      <input
                        type="text"
                        placeholder="e.g. Fever, Routine Checkup"
                        value={form.reason}
                        onChange={(e) => setForm({ ...form, reason: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {formError && (
                      <div className="sm:col-span-2 text-rose-600 text-xs font-semibold bg-rose-50 border border-rose-200 p-3 rounded-xl">
                        {formError}
                      </div>
                    )}

                    <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="px-5 py-2.5 bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md disabled:opacity-50"
                      >
                        {loading ? 'Booking...' : 'Issue Serial Token'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Live Queue Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Today&apos;s Patient Queue — {queue.length} Patients Total
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                        <th className="py-3 px-4 text-center">Token</th>
                        <th className="py-3 px-4 text-left">Patient</th>
                        <th className="py-3 px-4 text-left">Phone</th>
                        <th className="py-3 px-4 text-left">Slot</th>
                        <th className="py-3 px-4 text-left">Reason</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {queue.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                            No appointments booked for this doctor today.
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
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{apt.patientName}</div>
                              <div className="text-xs text-slate-400">
                                {apt.age} Yrs • {apt.gender}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 text-xs font-mono font-medium">
                              {apt.phone}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 text-xs">{apt.timeSlot}</td>
                            <td className="py-3.5 px-4 text-slate-500 text-xs max-w-35 truncate">
                              {apt.reason}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                                  statusColor[apt.status] || ''
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                    apt.status === 'In Progress'
                                      ? 'bg-emerald-500 animate-pulse'
                                      : apt.status === 'Pending'
                                      ? 'bg-amber-500'
                                      : 'bg-slate-400'
                                  }`}
                                ></span>
                                {apt.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center justify-center gap-2">
                                {apt.status === 'Pending' && (
                                  <button
                                    onClick={() => handleStatusChange(apt._id, 'In Progress')}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                                  >
                                    <Play className="w-3 h-3 fill-white" /> Call In
                                  </button>
                                )}
                                {apt.status === 'In Progress' && (
                                  <button
                                    onClick={() => handleStatusChange(apt._id, 'Completed')}
                                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                                  >
                                    <CheckCircle className="w-3 h-3 text-emerald-400" /> Done
                                  </button>
                                )}
                                {['Pending', 'In Progress'].includes(apt.status) && (
                                  <button
                                    onClick={() => handleStatusChange(apt._id, 'Cancelled')}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                    title="Cancel Appointment"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: DOCTORS */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'doctors' && (
            <div className="space-y-6">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-600" /> Chamber Doctor Schedule & Room Roster
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.map((doc) => (
                  <div key={doc._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-xl bg-linear-to-tr from-sky-500 to-teal-400 flex items-center justify-center text-white font-bold text-base shadow-md">
                        <Stethoscope className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{doc.user?.name || 'Doctor'}</h4>
                        <span className="inline-block text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full mt-0.5">
                          {doc.speciality}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Qualifications:</span>
                        <span className="font-semibold text-slate-800">{doc.qualifications}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">BMDC Reg No:</span>
                        <span className="font-mono font-bold text-slate-800">{doc.bmdcRegNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Chamber Room:</span>
                        <span className="font-bold text-slate-900">{doc.roomNumber || 'Room 01'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Visiting Hours:</span>
                        <span className="font-semibold text-slate-700">
                          {doc.visitingHours?.startTime} - {doc.visitingHours?.endTime}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Max Daily Patients:</span>
                        <span className="font-bold text-emerald-700">{doc.maxDailyPatients}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: TRACK */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'track' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Search className="w-5 h-5 text-emerald-600" /> Patient Token Lookup
                </h3>
                <form onSubmit={handleTrackPatient} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Appointment ID (e.g. 64abc...)"
                    value={trackId}
                    onChange={(e) => setTrackId(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
                  >
                    Track
                  </button>
                </form>

                {trackError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                    ❌ {trackError}
                  </div>
                )}

                {trackResult && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs text-emerald-950 animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
                      <span className="font-bold text-sm">{trackResult.appointment?.patientName}</span>
                      <span className="font-black text-lg text-emerald-700">
                        Serial #{String(trackResult.appointment?.serialNumber).padStart(2, '0')}
                      </span>
                    </div>
                    <p><span className="font-semibold">Doctor:</span> {trackResult.appointment?.doctorName}</p>
                    <p><span className="font-semibold">Status:</span> {trackResult.appointment?.status}</p>
                    <p><span className="font-semibold">Patients Ahead:</span> <strong className="text-emerald-700">{trackResult.serialsAhead} Patients</strong></p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE SETTINGS */}
          {activeTab === 'profile' && <ProfileSettings />}
        </div>
      </main>
    </div>
  );
}

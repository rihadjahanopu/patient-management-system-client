/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/typedef */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useQueueStore } from '@/hooks/useQueueStore';
import { api } from '@/lib/api';
import { useClinicSetting } from '@/hooks/useClinicSetting';
import { toPng } from 'html-to-image';
import {
  Stethoscope,
  Users,
  Clock,
  Search,
  Ticket,
  User,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Download,
  Building2,
  Megaphone,
  ChevronRight,
} from 'lucide-react';

export default function HomePage() {
  const today = new Date().toISOString().split('T')[0];
  const {
    publicClinicName,
    publicLogoUrl,
    publicTagline,
    publicAnnouncement,
    showPublicAnnouncement,
    enableTimeSlot,
    chamberStartTime,
    chamberEndTime,
    offDays,
    bookingEnabled,
  } = useClinicSetting();

  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');

  // Check Chamber Schedule & Off-Days
  const currentDayName: string = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const isOffDay: boolean = Array.isArray(offDays) && offDays.includes(currentDayName);

  const isWithinChamberHours: boolean = (() => {
    if (!chamberStartTime || !chamberEndTime) return true;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = chamberStartTime.split(':').map(Number);
    const [endH, endM] = chamberEndTime.split(':').map(Number);

    const startMinutes = (startH || 9) * 60 + (startM || 0);
    const endMinutes = (endH || 21) * 60 + (endM || 0);

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  })();

  const isBookingAllowed: boolean = bookingEnabled !== false && !isOffDay && isWithinChamberHours;

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    patientName: '',
    phone: '',
    age: '',
    gender: 'Male',
    timeSlot: '09:00 AM - 09:30 AM',
    reason: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [issuedTicket, setIssuedTicket] = useState<any>(null);

  // Tracking State
  const [appointmentIdInput, setAppointmentIdInput] = useState('');
  const [trackedAppointment, setTrackedAppointment] = useState<any>(null);
  const [trackError, setTrackError] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);

  // Time Slot Enabled setting (synced from DB via useClinicSetting)
  const timeSlotEnabled: boolean = enableTimeSlot !== false;

  const slots = [
    '09:00 AM - 09:30 AM',
    '09:30 AM - 10:00 AM',
    '10:00 AM - 10:30 AM',
    '10:30 AM - 11:00 AM',
    '11:00 AM - 11:30 AM',
    '05:00 PM - 05:30 PM',
  ];

  // Fetch doctors on mount
  useEffect(() => {
    api.doctors
      .getAll()
      .then((data) => {
        if (data.doctors && data.doctors.length > 0) {
          setDoctors(data.doctors);
          if (data.doctors.length === 1) {
            setSelectedDoctor(data.doctors[0]._id);
          }
        }
      })
      .catch((err) => console.warn('Could not fetch doctors:', err));
  }, []);

  // Connect Zustand Queue Store
  const {
    currentServingSerial,
    currentServingPatient,
    nextSerial,
    waitingCount,
    completedCount,
    queue,
    loading,
    setDoctorAndDate,
    fetchQueue,
    bookAppointment,
    startPolling,
    stopPolling,
  } = useQueueStore();

  // Sync selected doctor with Zustand store + start realtime polling
  useEffect(() => {
    if (selectedDoctor) {
      setDoctorAndDate(selectedDoctor, today);
      startPolling(10_000); // auto-refresh every 10s across all devices
    }
    return () => {
      stopPolling();
    };
  }, [selectedDoctor, today, setDoctorAndDate, startPolling, stopPolling]);

  // Handle Serial Booking submission via Zustand
  const handleBookSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) {
      setBookingError('Please select a doctor.');
      return;
    }
    setBookingError('');
    setBookingLoading(true);

    try {
      const res = await bookAppointment({
        ...bookingForm,
        timeSlot: timeSlotEnabled ? bookingForm.timeSlot : 'Open Serial / Chamber Hours',
        age: Number(bookingForm.age),
        doctorId: selectedDoctor,
        date: today,
      });

      setIssuedTicket(res.appointment);
      setBookingForm({
        patientName: '',
        phone: '',
        age: '',
        gender: 'Male',
        timeSlot: '09:00 AM - 09:30 AM',
        reason: '',
      });
    } catch (err: any) {
      setBookingError(err.message || 'Failed to issue serial token.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle Appointment Lookup
  const handleTrackAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentIdInput.trim()) return;
    setTrackError('');
    setTrackLoading(true);
    try {
      const res = await api.appointments.track(appointmentIdInput.trim());
      setTrackedAppointment(res);
    } catch (err: any) {
      setTrackError(err.message || 'Appointment not found.');
      setTrackedAppointment(null);
    } finally {
      setTrackLoading(false);
    }
  };

  const selectedDoctorInfo = doctors.find((d) => d._id === selectedDoctor);

  // Check Doctor-Specific Pause State (handles 2h, 4h, today, indefinite duration)
  const isDocPaused: boolean = (() => {
    if (!selectedDoctorInfo) return false;
    if (!selectedDoctorInfo.isBookingPaused) return false;
    if (!selectedDoctorInfo.pausedUntil) return true; // paused indefinitely
    return new Date() < new Date(selectedDoctorInfo.pausedUntil);
  })();

  const docPauseUntilText: string = (() => {
    if (!selectedDoctorInfo?.pausedUntil) return 'Paused by Admin';
    const until = new Date(selectedDoctorInfo.pausedUntil);
    return `Paused until ${until.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  })();

  // Check Doctor-Specific Off-Days
  const isDocOffDay: boolean = (() => {
    if (!selectedDoctorInfo?.offDays || !Array.isArray(selectedDoctorInfo.offDays)) return false;
    return selectedDoctorInfo.offDays.includes(currentDayName);
  })();

  // Check Doctor-Specific Booking Hours (e.g. 08:00 AM - 12:00 PM)
  const isDocWithinHours: boolean = (() => {
    if (!selectedDoctorInfo?.bookingStartTime || !selectedDoctorInfo?.bookingEndTime) return true;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = selectedDoctorInfo.bookingStartTime.split(':').map(Number);
    const [endH, endM] = selectedDoctorInfo.bookingEndTime.split(':').map(Number);

    const startMinutes = (startH || 8) * 60 + (startM || 0);
    const endMinutes = (endH || 20) * 60 + (endM || 0);

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  })();

  const isFinalBookingAllowed: boolean =
    isBookingAllowed && !isDocPaused && !isDocOffDay && isDocWithinHours;

  // Ref for ticket card element
  const ticketRef = useRef<HTMLDivElement>(null);

  // Download ticket card directly as PNG (Ultra-HD 5x Super-Sampling)
  const [downloadLoading, setDownloadLoading] = useState(false);
  const handleDownloadTicket = async () => {
    if (!ticketRef.current || !issuedTicket) return;
    setDownloadLoading(true);
    try {
      const dataUrl = await toPng(ticketRef.current, {
        pixelRatio: 5, // 5x Super-Sampling for ultra-sharp HD resolution
        quality: 1.0,
        cacheBust: true,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `OPD-Token-${String(issuedTicket.serialNumber).padStart(2, '0')}-${issuedTicket.patientName.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Ticket download failed:', err);
    } finally {
      setDownloadLoading(false);
    }
  };
  return (
    <>
      <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden selection:bg-emerald-500 selection:text-slate-950 font-sans">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* ULTRA-MODERN GLASSMOPHIC TOP NAVBAR (FULLY MOBILE RESPONSIVE) */}
        {/* ───────────────────────────────────────────────────────────── */}
        <header className="min-h-16 shrink-0 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md px-3 sm:px-6 py-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 z-30">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {publicLogoUrl ? (
              <img
                src={publicLogoUrl}
                alt={publicClinicName}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover border border-slate-800 shadow-lg shadow-emerald-500/20"
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-linear-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            )}
            <div className="truncate">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-sm sm:text-lg text-white tracking-tight truncate">
                  {publicClinicName || 'SmartCare'}
                </span>
                <span className="hidden xs:inline-flex text-[9px] sm:text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  Live Queue
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden md:block truncate">
                {publicTagline || 'Public OPD Serial & Live Tracking Portal'}
              </span>
            </div>
          </div>

          {/* Doctor Selector & Staff Navigation (Responsive Flex Controls) */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-auto sm:ml-0">
            {doctors.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2 sm:px-3 py-1.5 rounded-xl max-w-28 xs:max-w-40 sm:max-w-56">
                <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="bg-transparent text-white font-bold text-[11px] sm:text-xs focus:outline-none cursor-pointer w-full truncate"
                >
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id} className="bg-slate-900 text-white">
                      {d.user?.name || 'Doctor'} ({d.speciality})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => fetchQueue()}
              className="p-1.5 sm:px-3 sm:py-2 bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-1.5"
              title="Refresh State"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Sync Live</span>
            </button>

            <Link
              href="/login"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-95 shrink-0"
            >
              <User className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs font-bold">Staff Portal</span>
            </Link>
          </div>
        </header>

        {/* Live Public Patient Announcement Banner */}
        {showPublicAnnouncement && publicAnnouncement && (
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-slate-950 px-3 sm:px-6 py-1.5 sm:py-2 flex items-center justify-between text-xs font-black shadow-md border-b border-amber-400 z-20 shrink-0 animate-fadeIn">
            <div className="flex items-center gap-2 max-w-5xl truncate">
              <Megaphone className="w-4 h-4 text-slate-950 shrink-0 animate-bounce" />
              <span className="truncate text-[11px] sm:text-xs">{publicAnnouncement}</span>
            </div>
            <span className="text-[9px] sm:text-[10px] bg-slate-950 text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold shrink-0 hidden md:inline">
              Announcement
            </span>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* DASHBOARD WORKSPACE GRID (100% RESPONSIVE FOR MOBILE & DESKTOP) */}
        {/* ───────────────────────────────────────────────────────────── */}
        <main className="flex-1 p-3 sm:p-4 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[calc(100vh-64px)]">
          {/* ═════════════════════════════════════════════════════════════ */}
          {/* COLUMN 1: LIVE CHAMBER STATS + QUICK CHIPS (Mobile-first)   */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-4 flex flex-col gap-3 min-h-0">
            {/* Quick Stat Chips — compact horizontal row on mobile */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl text-center">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Next Up
                </span>
                <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">
                  {nextSerial ? `#${String(nextSerial).padStart(2, '0')}` : '--'}
                </div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl text-center">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Waiting
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-200 mt-0.5">{waitingCount}</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl text-center">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Done
                </span>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">{completedCount}</div>
              </div>
            </div>

            {/* Currently Serving Hero Card — hidden on mobile (saves space), full on desktop */}
            <div className="hidden lg:flex bg-linear-to-br from-emerald-950/90 via-slate-900 to-teal-950/90 border border-emerald-600/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex-1 flex-col justify-between">
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-emerald-400 text-xs font-extrabold uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Inside Chamber Now
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">Date: {today}</span>
                </div>
                <div className="my-4">
                  <div className="text-6xl lg:text-7xl font-black text-white tracking-tight flex items-baseline gap-2">
                    {currentServingSerial ? (
                      `#${String(currentServingSerial).padStart(2, '00')}`
                    ) : (
                      <span className="text-slate-700">--</span>
                    )}
                  </div>
                  {currentServingPatient ? (
                    <div className="text-emerald-200 text-sm font-extrabold mt-1 truncate">
                      Patient: {currentServingPatient}
                    </div>
                  ) : (
                    <div className="text-slate-500 text-xs mt-1">Waiting for next patient</div>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-emerald-900/60 flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">
                  {selectedDoctorInfo?.user?.name || 'Selected Doctor'}
                </span>
                <span className="text-emerald-400 font-mono text-[11px] font-bold">
                  {selectedDoctorInfo?.roomNumber || 'Chamber 01'}
                </span>
              </div>
            </div>

            {/* Mobile-only: slim currently serving bar */}
            <div className="flex lg:hidden items-center justify-between bg-linear-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-700/40 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">Serving Now</span>
              </div>
              <div className="text-2xl font-black text-white">
                {currentServingSerial ? `#${String(currentServingSerial).padStart(2, '0')}` : '--'}
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 truncate max-w-24">{currentServingPatient || 'No patient'}</div>
                <div className="text-[9px] text-emerald-500 font-bold">{selectedDoctorInfo?.roomNumber || 'Chamber 01'}</div>
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* COLUMN 2: BOOK SERIAL TOKEN & TRACK POSITION (5 COLS / 42%) */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto min-h-0">
            {/* BOOK SERIAL TOKEN CARD */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <Ticket className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white">Book Serial Token</h2>
                    <p className="text-[11px] text-slate-400">
                      {selectedDoctor ? 'Step 2: Fill Patient Info' : 'Step 1: Select a Doctor'}
                    </p>
                  </div>
                </div>

                {selectedDoctorInfo && doctors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDoctor('')}
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/80 border border-emerald-700/60 px-2.5 py-1 rounded-full transition-all flex items-center gap-1 active:scale-95"
                  >
                    <span>{selectedDoctorInfo.speciality}</span>
                    <span className="text-slate-400 font-normal">| Change 🔄</span>
                  </button>
                )}
              </div>

              {/* Selected Doctor Summary Chip */}
              {selectedDoctorInfo && !issuedTicket && (
                <div className="flex items-center justify-between bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-3 text-xs animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-white text-xs">
                        {selectedDoctorInfo.user?.name}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-medium">
                        {selectedDoctorInfo.speciality} • {selectedDoctorInfo.roomNumber || 'Chamber 01'}
                      </div>
                    </div>
                  </div>

                  {doctors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSelectedDoctor('')}
                      className="text-[10px] font-extrabold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-xl transition-all active:scale-95"
                    >
                      Change 🔄
                    </button>
                  )}
                </div>
              )}

              {issuedTicket ? (
                /* ── Issued Ticket Confirmation ── */
                <div className="space-y-3 animate-fadeIn">
                  {/* Success badge */}
                  <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-700/50 rounded-xl px-3 py-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest block">Token Issued!</span>
                      <span className="text-slate-400 text-[10px]">Save your ticket below.</span>
                    </div>
                  </div>

                  {/* ── Beautiful White OPD Ticket Card (Explicit Inline Styles for 100% Clean Image Capture) ── */}
                  <div
                    ref={ticketRef}
                    style={{
                      background: '#ffffff',
                      color: '#0f172a',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                      border: '1px solid #e2e8f0',
                      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                    }}
                  >
                    {/* Top Green Banner */}
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #0d9488 100%)',
                        padding: '16px 20px',
                        borderBottomLeftRadius: '16px',
                        borderBottomRightRadius: '16px',
                        position: 'relative',
                        boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 900, color: '#ffffff', fontSize: '18px', letterSpacing: '-0.5px' }}>
                            {publicClinicName || 'SmartCare'} OPD
                          </div>
                          <div style={{ color: '#a7f3d0', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '2px' }}>
                            OUT-PATIENT DEPARTMENT · QUEUE TOKEN
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            background: 'rgba(255, 255, 255, 0.18)',
                            color: '#ecfdf5',
                            border: '1px solid rgba(255, 255, 255, 0.35)',
                            padding: '4px 12px',
                            borderRadius: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                          }}
                        >
                          + CONFIRMED
                        </span>
                      </div>
                    </div>

                    {/* Serial Number Hero Section */}
                    <div style={{ padding: '20px', textAlign: 'center', borderBottom: '2px dashed #cbd5e1', background: '#ffffff' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        YOUR SERIAL TOKEN
                      </div>
                      <div style={{ fontSize: '64px', fontWeight: 900, color: '#059669', margin: '4px 0', lineHeight: 1, letterSpacing: '-1px' }}>
                        #{String(issuedTicket.serialNumber).padStart(2, '0')}
                      </div>
                      <span
                        style={{
                          display: 'inline-block',
                          background: '#ecfdf5',
                          color: '#047857',
                          border: '1px solid #a7f3d0',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '4px 14px',
                          borderRadius: '20px',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                        }}
                      >
                        ✓ BOOKING CONFIRMED
                      </span>
                    </div>

                    {/* Information Rows */}
                    <div style={{ padding: '16px 20px', borderBottom: '2px dashed #cbd5e1', background: '#ffffff' }}>
                      {[
                        { label: 'PATIENT NAME', value: issuedTicket.patientName },
                        { label: 'DOCTOR', value: selectedDoctorInfo?.user?.name || 'Doctor' },
                        { label: 'SPECIALITY', value: selectedDoctorInfo?.speciality || '—', accent: true },
                        { label: 'ROOM / CHAMBER', value: selectedDoctorInfo?.roomNumber || 'Chamber 01' },
                        { label: 'TIME SLOT', value: issuedTicket.timeSlot, accent: true },
                        {
                          label: 'DATE',
                          value: new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          }),
                        },
                        ...(issuedTicket.phone ? [{ label: 'PHONE', value: issuedTicket.phone }] : []),
                      ].map(({ label, value, accent }, idx, arr) => (
                        <div
                          key={label}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: idx === arr.length - 1 ? '0' : '10px',
                            fontSize: '12px',
                          }}
                        >
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                            {label}
                          </span>
                          <span style={{ fontWeight: 700, color: accent ? '#059669' : '#0f172a' }}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Barcode Section */}
                    <div style={{ background: '#f8fafc', padding: '12px 20px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', alignItems: 'flex-end', marginBottom: '4px' }}>
                        {[28, 18, 32, 14, 28, 22, 36, 12, 28, 18, 24, 32, 16, 28, 20, 36, 14, 28, 18, 32, 12, 28, 22, 36, 18, 28, 14, 24, 32, 16, 28, 20, 36, 12, 28, 18, 32, 14, 28, 22, 36, 12].map((h, i) => (
                          <div key={i} style={{ width: '2px', height: `${h}px`, background: '#1e293b', borderRadius: '1px' }} />
                        ))}
                      </div>
                      <div style={{ fontFamily: 'Courier, monospace', fontSize: '9px', color: '#64748b', letterSpacing: '1px' }}>
                        ID: {issuedTicket._id}
                      </div>
                    </div>

                    {/* Footer Note */}
                    <div style={{ background: '#f8fafc', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#94a3b8' }}>
                      <span>Please arrive 10 min before your slot.</span>
                      <span style={{ fontWeight: 600, color: '#475569' }}>
                        {new Date().toLocaleDateString('en-US')}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadTicket}
                      disabled={downloadLoading}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Download className={`w-3.5 h-3.5 ${downloadLoading ? 'animate-bounce' : ''}`} />
                      {downloadLoading ? 'Generating...' : 'Download PNG'}
                    </button>
                    <button
                      onClick={() => setIssuedTicket(null)}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all active:scale-95"
                    >
                      Book Another
                    </button>
                  </div>
                </div>
              ) : !selectedDoctor ? (
                /* ── Step 1: Doctor Selection Screen ── */
                <div className="space-y-3 animate-fadeIn">
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4" /> Step 1: Select a Doctor
                      </h3>
                      <p className="text-[11px] text-slate-300 mt-0.5">Pick a doctor below to check schedule & book serial.</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {doctors.map((doc) => {
                      const isDocPaused: boolean = Boolean(
                        doc.isBookingPaused && (!doc.pausedUntil || new Date() < new Date(doc.pausedUntil))
                      );
                      const isDocOff: boolean = Array.isArray(doc.offDays) && doc.offDays.includes(currentDayName);

                      return (
                        <div
                          key={doc._id}
                          onClick={() => setSelectedDoctor(doc._id)}
                          className="group bg-slate-950 border border-slate-800 hover:border-emerald-500/70 p-3 rounded-2xl cursor-pointer transition-all active:scale-98 flex items-center justify-between gap-3 shadow-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold shrink-0 shadow-md shadow-emerald-500/20">
                              <Stethoscope className="w-5 h-5" />
                            </div>
                            <div className="truncate">
                              <h4 className="font-extrabold text-sm text-white group-hover:text-emerald-400 transition-colors truncate">
                                {doc.user?.name || 'Dr. Medical'}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800">
                                  {doc.speciality}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {doc.roomNumber || 'Chamber 01'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {isDocPaused ? (
                              <span className="text-[9px] font-bold text-amber-400 bg-amber-950/80 border border-amber-700/60 px-2 py-1 rounded-lg">
                                Paused
                              </span>
                            ) : isDocOff ? (
                              <span className="text-[9px] font-bold text-rose-400 bg-rose-950/80 border border-rose-700/60 px-2 py-1 rounded-lg">
                                Holiday
                              </span>
                            ) : (
                              <span className="text-[11px] font-extrabold text-white bg-emerald-600 group-hover:bg-emerald-500 px-3 py-1.5 rounded-xl shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1">
                                Select <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : !isFinalBookingAllowed ? (
                /* ── Chamber / Doctor Closed / Off-Day / Paused Banner ── */
                <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-5 text-center space-y-3 animate-fadeIn">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider">
                      {bookingEnabled === false
                        ? 'Serial Booking Paused'
                        : isDocPaused
                        ? `Booking Paused for ${selectedDoctorInfo?.user?.name || 'Doctor'}`
                        : isDocOffDay
                        ? `${selectedDoctorInfo?.user?.name || 'Doctor'} Off Today (${currentDayName})`
                        : !isDocWithinHours
                        ? `Outside ${selectedDoctorInfo?.user?.name || 'Doctor'} Booking Hours`
                        : isOffDay
                        ? `Chamber Closed Today (${currentDayName})`
                        : 'Outside Chamber Hours'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-medium">
                      {bookingEnabled === false ? (
                        'Online serial token bookings are currently paused by the clinic administration.'
                      ) : isDocPaused ? (
                        <>
                          Serial token booking for <span className="text-emerald-400 font-bold">{selectedDoctorInfo?.user?.name}</span> is currently paused by admin ({docPauseUntilText}).
                        </>
                      ) : isDocOffDay ? (
                        <>
                          <span className="text-emerald-400 font-bold">{selectedDoctorInfo?.user?.name}</span> is on weekly holiday today (<span className="text-rose-400 font-bold">{currentDayName}</span>).
                        </>
                      ) : !isDocWithinHours ? (
                        <>
                          Serial booking for <span className="text-emerald-400 font-bold">{selectedDoctorInfo?.user?.name}</span> is open between{' '}
                          <span className="text-emerald-400 font-mono font-bold">{selectedDoctorInfo?.bookingStartTime || '08:00'}</span> and{' '}
                          <span className="text-emerald-400 font-mono font-bold">{selectedDoctorInfo?.bookingEndTime || '20:00'}</span>.
                        </>
                      ) : isOffDay ? (
                        <>
                          Today is a weekly clinic holiday (<span className="text-rose-400 font-bold">{currentDayName}</span>).
                        </>
                      ) : (
                        <>
                          Serial token bookings are open daily between{' '}
                          <span className="text-emerald-400 font-mono font-bold">{chamberStartTime}</span> and{' '}
                          <span className="text-emerald-400 font-mono font-bold">{chamberEndTime}</span>.
                        </>
                      )}
                    </p>
                  </div>

                  {selectedDoctorInfo?.offDays && selectedDoctorInfo.offDays.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-300">Doctor Off Days:</span>
                      {selectedDoctorInfo.offDays.map((d: string) => (
                        <span key={d} className="bg-rose-950/60 text-rose-300 border border-rose-800 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* ── Mobile-First Booking Form ── */
                <form onSubmit={handleBookSerial} className="space-y-3 sm:space-y-3.5">
                  {/* Patient Name — full width for easy typing on mobile */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
                      Patient Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahim Uddin"
                      value={bookingForm.patientName}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, patientName: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 transition-colors"
                    />
                  </div>

                  {/* Phone + Age in 2 cols */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="01700-000000"
                        value={bookingForm.phone}
                        onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                        className="w-full px-3 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
                        Age *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="120"
                        placeholder="30"
                        value={bookingForm.age}
                        onChange={(e) => setBookingForm({ ...bookingForm, age: e.target.value })}
                        className="w-full px-3 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Gender — horizontal pill buttons (more touch-friendly than dropdown) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
                      Gender *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Male', 'Female', 'Other'].map((g) => (
                        <button
                          type="button"
                          key={g}
                          onClick={() => setBookingForm({ ...bookingForm, gender: g })}
                          className={`py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                            bookingForm.gender === g
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-600/30'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slot — 2-col grid for easy thumb tapping on mobile */}
                  {timeSlotEnabled && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
                        Time Slot *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {slots.map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setBookingForm({ ...bookingForm, timeSlot: s })}
                            className={`px-2 py-2 rounded-xl text-[10px] sm:text-[11px] font-bold border transition-all active:scale-95 text-center ${
                              bookingForm.timeSlot === s
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-500/30'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Symptoms — optional, full width */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
                      Symptoms / Reason <span className="text-slate-600 normal-case font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Fever, Headache, Checkup"
                      value={bookingForm.reason}
                      onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 transition-colors"
                    />
                  </div>

                  {bookingError && (
                    <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  {/* Large, prominent submit button — easy thumb reach */}
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/30 uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Ticket className="w-4 h-4" />
                    {bookingLoading ? 'Issuing Token...' : 'Get Instant Serial Token'}
                  </button>
                </form>
              )}
            </div>


            {/* TRACK SERIAL POSITION CARD (PLACED DIRECTLY UNDER BOOK SERIAL TOKEN) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <Search className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider">
                  Track Serial Position
                </h3>
              </div>

              <form onSubmit={handleTrackAppointment} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={appointmentIdInput}
                  onChange={(e) => setAppointmentIdInput(e.target.value)}
                  placeholder="Enter Appointment ID"
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={trackLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl whitespace-nowrap transition-all active:scale-95"
                >
                  {trackLoading ? '...' : 'Track'}
                </button>
              </form>

              {trackError && (
                <p className="text-[11px] text-rose-400 font-semibold">⚠️ {trackError}</p>
              )}

              {trackedAppointment && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-700/50 rounded-xl text-xs space-y-1 animate-fadeIn">
                  <div className="flex justify-between font-bold text-white">
                    <span>{trackedAppointment.appointment?.patientName}</span>
                    <span className="text-emerald-400 font-black">
                      Token #{String(trackedAppointment.appointment?.serialNumber).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>Status: <strong className="text-emerald-400">{trackedAppointment.appointment?.status}</strong></span>
                    <span>Ahead: <strong className="text-amber-400">{trackedAppointment.serialsAhead} Patients</strong></span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* COLUMN 3: TODAY'S LIVE QUEUE ROSTER TABLE (3 COLS / 25%) */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-0">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/50">
              <h3 className="font-extrabold text-white text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <Users className="w-4 h-4 text-emerald-400" /> Today Queue ({queue.length})
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Live Sync</span>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-800/60">
              {queue.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  <Clock className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                  No tokens booked today yet.
                </div>
              ) : (
                queue.map((apt: any) => (
                  <div
                    key={apt._id}
                    className={`p-3 text-xs transition-colors flex items-center justify-between ${
                      apt.status === 'In Progress'
                        ? 'bg-emerald-950/60 border-l-4 border-emerald-500'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                          apt.status === 'In Progress'
                            ? 'bg-emerald-500 text-slate-950 shadow-xs'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        #{String(apt.serialNumber).padStart(2, '0')}
                      </span>
                      <div>
                        <div className="font-bold text-slate-200 truncate max-w-27.5">
                          {apt.patientName}
                        </div>
                        <div className="text-[10px] text-slate-500">{apt.timeSlot}</div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase ${
                        apt.status === 'In Progress'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : apt.status === 'Completed'
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                      }`}
                    >
                      {apt.status === 'In Progress' ? 'Serving' : apt.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Clock, Calendar, Power, CheckCircle2, AlertCircle, Save, Stethoscope } from 'lucide-react';

const DAYS_SHORT = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DoctorScheduleCardProps {
  doc: any;
  onUpdate: () => void;
}

export default function DoctorScheduleCard({ doc, onUpdate }: DoctorScheduleCardProps) {
  const docUser = doc.user;
  const isDocActive = docUser?.isActive !== false;
  const userId = typeof docUser === 'object' ? docUser?._id : docUser;

  const [bookingStart, setBookingStart] = useState<string>('08:00');
  const [bookingEnd, setBookingEnd] = useState<string>('20:00');
  const [offDays, setOffDays] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pausedUntil, setPausedUntil] = useState<string | null>(null);

  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setBookingStart(doc.bookingStartTime || '08:00');
    setBookingEnd(doc.bookingEndTime || '20:00');
    setOffDays(Array.isArray(doc.offDays) ? doc.offDays : []);
    setIsPaused(Boolean(doc.isBookingPaused));
    setPausedUntil(doc.pausedUntil || null);
  }, [doc]);

  const toggleOffDay = (day: string) => {
    if (offDays.includes(day)) {
      setOffDays(offDays.filter((d) => d !== day));
    } else {
      setOffDays([...offDays, day]);
    }
  };

  const handlePauseDuration = async (hours: number | 'today' | 'indefinite' | 'resume') => {
    setSaving(true);
    setMessage('');
    setError('');

    let newIsPaused = true;
    let newPausedUntil: string | null = null;

    if (hours === 'resume') {
      newIsPaused = false;
      newPausedUntil = null;
    } else if (hours === 'indefinite') {
      newIsPaused = true;
      newPausedUntil = null;
    } else if (hours === 'today') {
      newIsPaused = true;
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      newPausedUntil = endOfDay.toISOString();
    } else if (typeof hours === 'number') {
      newIsPaused = true;
      const untilTime = new Date(Date.now() + hours * 60 * 60 * 1000);
      newPausedUntil = untilTime.toISOString();
    }

    try {
      await api.doctors.updateDoctor(doc._id, {
        isBookingPaused: newIsPaused,
        pausedUntil: newPausedUntil,
      });

      setIsPaused(newIsPaused);
      setPausedUntil(newPausedUntil);
      setMessage(
        hours === 'resume'
          ? 'Booking Resumed!'
          : `Booking Paused (${hours === 'today' ? 'Rest of Today' : hours === 'indefinite' ? 'Indefinitely' : hours + ' Hours'})`
      );
      setTimeout(() => setMessage(''), 3000);
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to update pause state.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await api.doctors.updateDoctor(doc._id, {
        bookingStartTime: bookingStart,
        bookingEndTime: bookingEnd,
        offDays,
      });

      setMessage('Doctor schedule saved successfully!');
      setTimeout(() => setMessage(''), 3000);
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to save doctor schedule.');
    } finally {
      setSaving(false);
    }
  };

  // Check if pause duration is currently active
  const isPauseActive = isPaused && (!pausedUntil || new Date() < new Date(pausedUntil));
  const formatPauseUntilText = () => {
    if (!pausedUntil) return 'Paused Indefinitely';
    const untilDate = new Date(pausedUntil);
    if (untilDate < new Date()) return 'Pause Expired (Auto-Resumed)';
    return `Paused until ${untilDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div
      className={`bg-white rounded-2xl border p-5 shadow-xs space-y-4 transition-all ${
        isDocActive ? 'border-slate-200 hover:border-emerald-300' : 'border-rose-200 bg-rose-50/20'
      }`}
    >
      {/* Header Info */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md ${
              isDocActive ? 'bg-linear-to-tr from-emerald-500 to-teal-400' : 'bg-slate-400'
            }`}
          >
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">{doc.user?.name || 'Dr. Medical'}</h4>
            <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
              {doc.speciality}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
              isDocActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {isDocActive ? 'Account Active' : 'Blocked'}
          </span>

          {isPauseActive ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
              Paused
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Booking Open
            </span>
          )}
        </div>
      </div>

      {message && (
        <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Info details */}
      <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">Room:</span>
          <span className="font-bold text-slate-800">{doc.roomNumber || 'Room 01'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">Visiting Hours:</span>
          <span className="font-semibold text-slate-700">
            {doc.visitingHours?.startTime} - {doc.visitingHours?.endTime}
          </span>
        </div>
      </div>

      {/* ── Per-Doctor Booking Schedule Editor ── */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-600" /> Booking Hours (Start & End)
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Start Time</label>
            <input
              type="time"
              value={bookingStart}
              onChange={(e) => setBookingStart(e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">End Time</label>
            <input
              type="time"
              value={bookingEnd}
              onChange={(e) => setBookingEnd(e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Doctor Off Days Selector */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-emerald-600" /> Doctor Weekly Holidays
          </label>
          <div className="flex flex-wrap gap-1">
            {DAYS_SHORT.map((day) => {
              const isOff = offDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleOffDay(day)}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${
                    isOff
                      ? 'bg-rose-500 text-white border-rose-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveSchedule}
          disabled={saving}
          className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
        >
          <Save className="w-3 h-3 text-emerald-400" />
          Save Schedule & Holidays
        </button>
      </div>

      {/* ── Per-Doctor Duration Pause Controls ── */}
      <div className="bg-slate-900 text-white p-3 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-amber-400">
            <Power className="w-3.5 h-3.5" /> Serial Booking Controls
          </span>
          {isPauseActive && (
            <span className="text-[9px] text-amber-300 font-mono font-bold truncate max-w-[130px]">
              {formatPauseUntilText()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handlePauseDuration(2)}
            disabled={saving}
            className="py-1.5 px-2 bg-slate-800 hover:bg-amber-600/30 border border-slate-700 hover:border-amber-500 text-slate-200 hover:text-amber-300 font-bold text-[10px] rounded-lg transition-all active:scale-95 text-center"
          >
            ⏸️ Pause 2 Hours
          </button>
          <button
            type="button"
            onClick={() => handlePauseDuration(4)}
            disabled={saving}
            className="py-1.5 px-2 bg-slate-800 hover:bg-amber-600/30 border border-slate-700 hover:border-amber-500 text-slate-200 hover:text-amber-300 font-bold text-[10px] rounded-lg transition-all active:scale-95 text-center"
          >
            ⏸️ Pause 4 Hours
          </button>
          <button
            type="button"
            onClick={() => handlePauseDuration('today')}
            disabled={saving}
            className="py-1.5 px-2 bg-slate-800 hover:bg-amber-600/30 border border-slate-700 hover:border-amber-500 text-slate-200 hover:text-amber-300 font-bold text-[10px] rounded-lg transition-all active:scale-95 text-center"
          >
            ⏸️ Pause Rest of Today
          </button>

          {isPauseActive ? (
            <button
              type="button"
              onClick={() => handlePauseDuration('resume')}
              disabled={saving}
              className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] rounded-lg transition-all active:scale-95 text-center shadow-md shadow-emerald-600/30"
            >
              ▶️ Resume Booking
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handlePauseDuration('indefinite')}
              disabled={saving}
              className="py-1.5 px-2 bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-[10px] rounded-lg transition-all active:scale-95 text-center"
            >
              ⏸️ Pause OFF (Indefinite)
            </button>
          )}
        </div>
      </div>

      {/* Account Block Toggle */}
      {userId && (
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => {
              api.auth.toggleUser(userId).then(() => onUpdate()).catch((e) => setError(e.message));
            }}
            className={`w-full py-1.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              isDocActive
                ? 'bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200'
                : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {isDocActive ? 'Block Doctor Account' : 'Unblock Doctor Account'}
          </button>
        </div>
      )}
    </div>
  );
}

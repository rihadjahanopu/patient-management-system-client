/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { useClinicSetting } from '@/hooks/useClinicSetting';
import { api } from '@/lib/api';
import { Clock, Calendar, Power, CheckCircle2, AlertCircle, RefreshCw, Save } from 'lucide-react';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default function ChamberScheduleSettings() {
  const {
    chamberStartTime,
    chamberEndTime,
    offDays,
    bookingEnabled,
    refreshSetting,
  } = useClinicSetting();

  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('21:00');
  const [selectedOffDays, setSelectedOffDays] = useState<string[]>([]);
  const [isBookingOn, setIsBookingOn] = useState<boolean>(true);

  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setStartTime(chamberStartTime || '09:00');
    setEndTime(chamberEndTime || '21:00');
    setSelectedOffDays(offDays || []);
    setIsBookingOn(bookingEnabled !== false);
  }, [chamberStartTime, chamberEndTime, offDays, bookingEnabled]);

  const toggleDay = (day: string) => {
    if (selectedOffDays.includes(day)) {
      setSelectedOffDays(selectedOffDays.filter((d) => d !== day));
    } else {
      setSelectedOffDays([...selectedOffDays, day]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await api.settings.updateClinic({
        chamberStartTime: startTime,
        chamberEndTime: endTime,
        offDays: selectedOffDays,
        bookingEnabled: isBookingOn,
      });

      await refreshSetting();
      setMessage('Chamber schedule and holiday settings saved successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update chamber schedule settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" /> Chamber Hours & Holiday Control
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure daily opening/closing hours and weekly holidays. Booking form automatically enforces these rules.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Global Booking Kill-Switch */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <Power className="w-4 h-4 text-emerald-600" /> Global Booking Status
            </div>
            <p className="text-xs text-slate-500">
              Turn off to instantly halt all patient serial token bookings across the public portal.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setIsBookingOn(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                isBookingOn ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isBookingOn ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
              OPEN (Active)
            </button>
            <button
              type="button"
              onClick={() => setIsBookingOn(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                !isBookingOn ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${!isBookingOn ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
              CLOSED (Halt)
            </button>
          </div>
        </div>

        {/* Operating Hours Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 tracking-wider">
              Chamber Opening Time *
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 tracking-wider">
              Chamber Closing Time *
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono font-bold"
            />
          </div>
        </div>

        {/* Weekly Off Days / Holidays Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" /> Weekly Holidays / Chamber Off Days
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Select days when the chamber remains closed. Serial booking form will automatically show a &quot;Chamber Closed Today&quot; message.
          </p>

          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const isOff = selectedOffDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    isOff
                      ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOff ? 'bg-white' : 'bg-emerald-500'
                    }`}
                  ></span>
                  {day} {isOff && '(Holiday)'}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Schedule & Holiday Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

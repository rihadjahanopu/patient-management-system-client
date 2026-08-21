'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import PatientLiveTracker from '@/components/PatientLiveTracker';
import { Stethoscope, Search, AlertCircle } from 'lucide-react';

export default function TrackPage() {
  const [appointmentId, setAppointmentId] = useState('');
  const [trackData, setTrackData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentId.trim()) return;
    setError('');
    setLoading(true);
    try {
      const data = await api.appointments.track(appointmentId.trim());
      setTrackData(data);
    } catch (err: any) {
      setError(err.message || 'Appointment not found.');
    } finally {
      setLoading(false);
    }
  };

  if (trackData) {
    const { appointment, currentServingSerial } = trackData;
    const today = new Date().toISOString().split('T')[0];
    // We need doctorId — it's embedded inside appointment lookup
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
        {/* Back button */}
        <div className="p-4 print:hidden">
          <button onClick={() => setTrackData(null)}
            className="text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5">
            ← Track a different appointment
          </button>
        </div>
        {/* Pass fetched doctorId from appointment */}
        <PatientLiveTracker
          doctorId={appointment.doctor?._id || ''}
          date={appointment.date}
          mySerial={appointment.serialNumber}
          myName={appointment.patientName}
        />

        {/* Appointment detail card */}
        <div className="max-w-md mx-auto px-4 pb-8">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 mt-2 space-y-2 text-sm">
            <h3 className="font-black text-white text-sm border-b border-slate-800 pb-2 mb-3">Appointment Details</h3>
            {[
              ['Doctor', appointment.doctorName],
              ['Date', appointment.date],
              ['Time Slot', appointment.timeSlot],
              ['Status', appointment.status],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-500 text-xs">{label}</span>
                <span className="text-slate-200 font-semibold text-xs">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30">
            <Stethoscope className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Track Your Serial</h1>
          <p className="text-slate-400 text-sm mt-1">Enter your Appointment ID to see real-time queue status</p>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Appointment ID
              </label>
              <input
                type="text"
                required
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                placeholder="Enter your appointment ID"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder-slate-600 font-mono"
              />
              <p className="text-slate-600 text-[11px] mt-1">Provided by the receptionist when booking</p>
            </div>

            {error && (
              <div className="flex items-start space-x-2 p-3 bg-rose-950/50 border border-rose-800/50 rounded-xl">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="text-rose-300 text-xs">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Searching...' : 'Track My Serial'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800">
            <p className="text-slate-600 text-[11px] text-center">
              Staff login? <a href="/login" className="text-emerald-500 hover:text-emerald-400 font-semibold">Sign In Here</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

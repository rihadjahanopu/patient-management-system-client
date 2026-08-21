'use client';

import React, { useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';
import { useQueueStore } from '@/hooks/useQueueStore';

interface PatientLiveTrackerProps {
  doctorId: string;
  date: string;
  mySerial: number;
  myName?: string;
}

export default function PatientLiveTracker({
  doctorId,
  date,
  mySerial,
  myName,
}: PatientLiveTrackerProps) {
  const {
    currentServingSerial,
    currentServingPatient,
    nextSerial,
    waitingCount,
    lastUpdated,
    setDoctorAndDate,
  } = useQueueStore();

  useEffect(() => {
    if (doctorId && date) {
      setDoctorAndDate(doctorId, date);
    }
  }, [doctorId, date, setDoctorAndDate]);

  const serialsAhead = currentServingSerial !== null
    ? Math.max(0, mySerial - currentServingSerial - 1)
    : mySerial - 1;

  const isMyTurn = currentServingSerial === mySerial;
  const isCompleted = currentServingSerial !== null && mySerial < currentServingSerial;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Status indicator */}
        <div className="flex items-center justify-center space-x-2 mb-6 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full w-fit mx-auto text-emerald-400 bg-emerald-950/80 border border-emerald-700/50">
          <Activity className="w-3.5 h-3.5" />
          <span>Zustand State Active</span>
        </div>

        <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-900/60 to-teal-900/60 px-6 py-4 border-b border-slate-800">
            <h1 className="text-white font-black text-lg text-center">Chamber Serial Tracker</h1>
            {myName && <p className="text-emerald-300 text-xs text-center mt-0.5">{myName}</p>}
          </div>

          <div className="p-6 space-y-4">

            {/* Currently Serving */}
            <div className="bg-slate-800/70 rounded-2xl p-5 border border-slate-700 text-center">
              <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block mb-2">
                Currently Inside Chamber
              </span>
              <div className="text-6xl font-black text-white my-2">
                {currentServingSerial
                  ? `#${String(currentServingSerial).padStart(2, '0')}`
                  : <span className="text-slate-600">--</span>}
              </div>
              {currentServingPatient && (
                <p className="text-slate-300 text-sm font-medium">{currentServingPatient}</p>
              )}
            </div>

            {/* Your Token */}
            <div className={`rounded-2xl p-5 text-center border ${
              isMyTurn
                ? 'bg-gradient-to-br from-amber-500 to-amber-600 border-amber-400 animate-pulse'
                : isCompleted
                ? 'bg-slate-800/50 border-slate-700'
                : 'bg-gradient-to-br from-emerald-700 to-teal-800 border-emerald-600'
            }`}>
              <span className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${isMyTurn ? 'text-amber-950' : 'text-emerald-200'}`}>
                Your Serial Token
              </span>
              <div className={`text-5xl font-black my-1 ${isMyTurn ? 'text-white' : 'text-white'}`}>
                #{String(mySerial).padStart(2, '0')}
              </div>

              <div className={`mt-3 pt-3 border-t ${isMyTurn ? 'border-amber-400/50' : 'border-emerald-500/30'}`}>
                {isCompleted ? (
                  <p className="text-slate-400 text-xs">Your consultation has been completed.</p>
                ) : isMyTurn ? (
                  <p className="text-amber-950 font-extrabold text-sm animate-bounce">
                    🔔 It's your turn! Please enter the chamber.
                  </p>
                ) : (
                  <p className="text-emerald-200 text-xs">
                    <strong className="text-white text-sm">{serialsAhead}</strong> patient{serialsAhead !== 1 ? 's' : ''} ahead of you
                  </p>
                )}
              </div>
            </div>

            {/* Queue Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700">
                <div className="text-2xl font-black text-amber-400">{waitingCount}</div>
                <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Waiting</div>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700">
                <div className="text-2xl font-black text-emerald-400">
                  {nextSerial ? `#${String(nextSerial).padStart(2, '0')}` : '--'}
                </div>
                <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Next Up</div>
              </div>
            </div>

            {/* Last updated timestamp */}
            {lastUpdated && (
              <div className="flex items-center justify-center space-x-1.5 text-slate-500 text-[11px]">
                <Clock className="w-3 h-3" />
                <span>Last updated: {lastUpdated}</span>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

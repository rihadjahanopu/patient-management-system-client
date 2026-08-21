'use client';

import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, UserCheck, Play, CheckCircle, Clock, ChevronRight, Activity, Filter } from 'lucide-react';
import { Appointment, AppointmentStatus } from '@/lib/types';
import { getAppointments, updateAppointmentStatus } from '@/lib/storage';

interface QueueStatusProps {
  onSelectPatientForRx?: (apt: Appointment) => void;
  onQueueUpdated?: () => void;
}

export default function QueueStatus({ onSelectPatientForRx, onQueueUpdated }: QueueStatusProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQueue = () => {
    setIsRefreshing(true);
    const data = getAppointments();
    setAppointments(data);
    setLastRefreshed(new Date().toLocaleTimeString());
    setTimeout(() => setIsRefreshing(false), 300);
    if (onQueueUpdated) onQueueUpdated();
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleStatusChange = (id: string, newStatus: AppointmentStatus) => {
    const updated = updateAppointmentStatus(id, newStatus);
    setAppointments(updated);
    if (onQueueUpdated) onQueueUpdated();
  };

  // Currently inside
  const insidePatient = appointments.find(a => a.status === 'Inside');
  // Next in line
  const nextWaitingPatient = appointments.find(a => a.status === 'Waiting');
  // Waiting list count
  const waitingList = appointments.filter(a => a.status === 'Waiting');

  const filteredAppointments = appointments.filter(a => {
    if (filterStatus === 'All') return true;
    return a.status === filterStatus;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Header & Refresh Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-3">
            <span>Chamber Queue Status</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Real-time token sequence tracking for patients and chamber receptionist.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Last updated: <span className="font-semibold text-slate-700">{lastRefreshed || 'Just now'}</span>
          </span>

          <button
            onClick={fetchQueue}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all border border-slate-700 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Highlights Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        
        {/* Card 1: Currently Inside */}
        <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-emerald-700/50">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <UserCheck className="w-36 h-36 text-white" />
          </div>
          <div className="flex items-center justify-between text-emerald-300 font-bold text-xs uppercase tracking-widest mb-3">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Currently Inside</span>
            </span>
            <span className="bg-emerald-800/80 text-emerald-200 px-2 py-0.5 rounded text-[10px]">ACTIVE</span>
          </div>

          {insidePatient ? (
            <div>
              <div className="text-5xl font-black text-white tracking-tight mb-2">
                Token #{insidePatient.tokenNumber}
              </div>
              <div className="text-lg font-bold text-emerald-100 truncate">{insidePatient.patientName}</div>
              <div className="text-xs text-emerald-300 mt-0.5">
                {insidePatient.age} yrs • {insidePatient.gender} • Slot: {insidePatient.slot}
              </div>
              {onSelectPatientForRx && (
                <button
                  onClick={() => onSelectPatientForRx(insidePatient)}
                  className="mt-4 w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center justify-center space-x-1.5 shadow"
                >
                  <span>Open Rx Panel</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="py-4 text-center">
              <div className="text-3xl font-black text-emerald-400/50">--</div>
              <p className="text-xs text-emerald-300/70 mt-1">No patient currently inside</p>
            </div>
          )}
        </div>

        {/* Card 2: Next Token */}
        <div className="bg-gradient-to-br from-amber-900/90 to-amber-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-amber-700/50">
          <div className="flex items-center justify-between text-amber-300 font-bold text-xs uppercase tracking-widest mb-3">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Next Token</span>
            </span>
            <span className="bg-amber-800/80 text-amber-200 px-2 py-0.5 rounded text-[10px]">UP NEXT</span>
          </div>

          {nextWaitingPatient ? (
            <div>
              <div className="text-5xl font-black text-amber-300 tracking-tight mb-2">
                Token #{nextWaitingPatient.tokenNumber}
              </div>
              <div className="text-lg font-bold text-amber-100 truncate">{nextWaitingPatient.patientName}</div>
              <div className="text-xs text-amber-300/80 mt-0.5">
                {nextWaitingPatient.age} yrs • {nextWaitingPatient.gender} • Slot: {nextWaitingPatient.slot}
              </div>
              <button
                onClick={() => handleStatusChange(nextWaitingPatient.id, 'Inside')}
                className="mt-4 w-full py-2 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold rounded-lg text-xs transition-all flex items-center justify-center space-x-1.5 shadow"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Call Inside Chamber</span>
              </button>
            </div>
          ) : (
            <div className="py-4 text-center">
              <div className="text-3xl font-black text-amber-400/50">--</div>
              <p className="text-xs text-amber-300/70 mt-1">No waiting patients</p>
            </div>
          )}
        </div>

        {/* Card 3: Total Waiting Counter */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">
              <span className="flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Total Waiting in Queue</span>
              </span>
            </div>
            <div className="text-5xl font-black text-slate-900 mt-2">
              {waitingList.length} <span className="text-base font-medium text-slate-500">Patients</span>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
            <span>Total Today: {appointments.length}</span>
            <span>Completed: {appointments.filter(a => a.status === 'Completed').length}</span>
          </div>
        </div>

      </div>

      {/* Filter Tabs & Queue Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Table Filter Navigation */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Filter Queue:</span>
          </div>

          <div className="flex space-x-1 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
            {['All', 'Waiting', 'Inside', 'Completed'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === st
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st} {st !== 'All' && `(${appointments.filter(a => a.status === st).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100/70 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                <th className="py-3.5 px-4 sm:px-6">Token</th>
                <th className="py-3.5 px-4 sm:px-6">Patient Name</th>
                <th className="py-3.5 px-4 sm:px-6">Age / Gender</th>
                <th className="py-3.5 px-4 sm:px-6">Time Slot</th>
                <th className="py-3.5 px-4 sm:px-6">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Chamber Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                    No appointments found matching "{filterStatus}"
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Token */}
                    <td className="py-4 px-4 sm:px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-xl bg-slate-900 text-emerald-400 font-extrabold text-sm border border-slate-800 shadow-xs">
                        #{apt.tokenNumber}
                      </span>
                    </td>

                    {/* Patient Name & Phone */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="font-bold text-slate-900">{apt.patientName}</div>
                      <div className="text-xs text-slate-400">{apt.phone}</div>
                    </td>

                    {/* Age / Gender */}
                    <td className="py-4 px-4 sm:px-6 text-slate-600">
                      {apt.age} yrs • {apt.gender}
                    </td>

                    {/* Time Slot */}
                    <td className="py-4 px-4 sm:px-6 text-slate-600 text-xs font-medium">
                      {apt.slot}
                    </td>

                    {/* Status Pill */}
                    <td className="py-4 px-4 sm:px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          apt.status === 'Inside'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : apt.status === 'Waiting'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : apt.status === 'Completed'
                            ? 'bg-slate-100 text-slate-700 border border-slate-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          apt.status === 'Inside' ? 'bg-emerald-500 animate-pulse' :
                          apt.status === 'Waiting' ? 'bg-amber-500' : 'bg-slate-400'
                        }`}></span>
                        {apt.status}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        
                        {apt.status === 'Waiting' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'Inside')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Call Inside</span>
                          </button>
                        )}

                        {apt.status === 'Inside' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'Completed')}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1"
                          >
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            <span>Mark Complete</span>
                          </button>
                        )}

                        {onSelectPatientForRx && (
                          <button
                            onClick={() => onSelectPatientForRx(apt)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
                          >
                            Prescribe Rx
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
  );
}

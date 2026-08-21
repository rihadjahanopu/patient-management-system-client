'use client';

import React from 'react';
import { Calendar, Users, Stethoscope, FileText, Activity } from 'lucide-react';

interface NavbarProps {
  activeTab: 'booking' | 'queue' | 'doctor' | 'prescriptions';
  setActiveTab: (tab: 'booking' | 'queue' | 'doctor' | 'prescriptions') => void;
  waitingCount: number;
}

export default function Navbar({ activeTab, setActiveTab, waitingCount }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md print:hidden border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Clinic Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('doctor')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none tracking-tight text-slate-100">
                SmartCare <span className="text-emerald-400 font-medium text-xs ml-1 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">Rx Suite</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">Doctor & Queue Management</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('doctor')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'doctor'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor Rx Panel</span>
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all relative ${
                activeTab === 'queue'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Live Queue</span>
              {waitingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-full">
                  {waitingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('booking')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'booking'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Book Serial</span>
            </button>

            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'prescriptions'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Saved Rx</span>
            </button>
          </nav>

          {/* Quick status pill */}
          <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-medium">Chamber Active</span>
          </div>

        </div>
      </div>
    </header>
  );
}

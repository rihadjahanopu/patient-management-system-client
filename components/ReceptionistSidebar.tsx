/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/typedef */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Stethoscope,
  Search,
  Plus,
  LogOut,
  Menu,
  X,
  RefreshCw,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClinicSetting } from '@/hooks/useClinicSetting';

export type ReceptionistTab = 'queue' | 'doctors' | 'track' | 'profile';

interface ReceptionistSidebarProps {
  activeTab: ReceptionistTab;
  setActiveTab: (tab: ReceptionistTab) => void;
  onOpenNewAppointment?: () => void;
  onRefresh?: () => void;
  waitingCount?: number;
  totalToday?: number;
}

export default function ReceptionistSidebar({
  activeTab,
  setActiveTab,
  onOpenNewAppointment,
  onRefresh,
  waitingCount = 0,
  totalToday = 0,
}: ReceptionistSidebarProps) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { id: ReceptionistTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'queue', label: 'Today Queue & Booking', icon: Calendar, badge: waitingCount },
    { id: 'doctors', label: 'Doctor Schedule Roster', icon: Stethoscope },
    { id: 'track', label: 'Patient Tracker Lookup', icon: Search },
    { id: 'profile', label: 'Profile Settings', icon: UserIcon },
  ];

  const handleSelectTab = (tab: ReceptionistTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  const { clinicName, logoUrl } = useClinicSetting();

  const sidebarContent = (isMobile: boolean) => (
    <>
      <div>
        {/* Top Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          <div className={`flex items-center space-x-3 overflow-hidden ${collapsed && !isMobile ? 'justify-center' : ''}`}>
            {logoUrl ? (
              <img src={logoUrl} alt={clinicName} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-700 shadow-md" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
            )}
            {(!collapsed || isMobile) && (
              <div className="truncate">
                <h2 className="font-bold text-base text-slate-100 leading-tight truncate flex items-center gap-1.5">
                  {clinicName || 'SmartCare'}
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    Reception
                  </span>
                </h2>
                <p className="text-xs text-slate-400 truncate">Queue & Booking Suite</p>
              </div>
            )}
          </div>

          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Profile Card */}
        <div className={`m-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3 ${collapsed && !isMobile ? 'p-2 justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
          </div>
          {(!collapsed || isMobile) && (
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-slate-100 truncate">{user?.name || 'Receptionist'}</h4>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || 'reception@clinic.com'}</p>
              <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-sky-400">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                Front Desk Active
              </div>
            </div>
          )}
        </div>

        {/* Quick Action Button */}
        {onOpenNewAppointment && (!collapsed || isMobile) && (
          <div className="px-3 mb-2">
            <button
              onClick={() => {
                onOpenNewAppointment();
                if (isMobile) setMobileOpen(false);
              }}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Book New Appointment</span>
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="mt-2 px-3 space-y-1.5">
          <div className={`text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3 py-1 ${collapsed && !isMobile ? 'text-center px-0' : ''}`}>
            {collapsed && !isMobile ? '•' : 'Reception Navigation'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`
                  w-full flex items-center rounded-xl px-3 py-2.5 text-xs font-semibold transition-all relative group
                  ${collapsed && !isMobile ? 'justify-center px-0' : 'justify-between'}
                  ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-950/40 font-bold'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                  }
                `}
                title={collapsed && !isMobile ? item.label : undefined}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-400'}`} />
                  {(!collapsed || isMobile) && (
                    <span className="truncate">{item.label}</span>
                  )}
                </div>

                {item.badge !== undefined && item.badge > 0 && (!collapsed || isMobile) && (
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ml-2 shrink-0 ${isActive ? 'bg-sky-950 text-sky-200 border border-sky-400/30' : 'bg-amber-500 text-slate-950'}`}>
                    {item.badge}
                  </span>
                )}

                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-sky-300 rounded-r" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        {(!collapsed || isMobile) && (
          <div className="px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="text-[11px] font-semibold text-slate-400">Today Total</span>
            <span className="text-[11px] font-extrabold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {totalToday} Patients
            </span>
          </div>
        )}

        <button
          onClick={logout}
          className={`
            w-full flex items-center rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 border border-transparent hover:border-rose-900/50 transition-all
            ${collapsed && !isMobile ? 'justify-center px-0' : 'space-x-3'}
          `}
          title={collapsed && !isMobile ? 'Logout' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {(!collapsed || isMobile) && <span>Logout Account</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ─── MOBILE TOP NAVIGATION BAR (Visible only on < lg screens) ─── */}
      <div className="lg:hidden sticky top-0 z-30 bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shadow-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 focus:outline-none"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white shadow-md">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm text-slate-100">Reception Desk</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button onClick={onRefresh} className="p-2 text-slate-400 hover:text-white" title="Refresh">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
            </button>
          )}
          <button onClick={logout} className="p-2 text-slate-400 hover:text-rose-400" title="Logout">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ─── MOBILE DRAWER OVERLAY (Rendered only when open on mobile) ─── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between shadow-2xl lg:hidden">
            {sidebarContent(true)}
          </aside>
        </>
      )}

      {/* ─── DESKTOP SIDEBAR CONTAINER (Hidden completely on mobile) ─── */}
      <aside
        className={`
          hidden lg:flex fixed top-0 bottom-0 left-0 z-40 bg-slate-900 text-slate-300 border-r border-slate-800/80
          flex-col justify-between transition-all duration-300 ease-in-out shadow-2xl
          ${collapsed ? 'w-20' : 'w-72'}
        `}
      >
        {sidebarContent(false)}
      </aside>
    </>
  );
}

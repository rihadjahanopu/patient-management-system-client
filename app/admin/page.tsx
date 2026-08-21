/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/typedef */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import AdminSidebar, { AdminTab } from '@/components/AdminSidebar';
import ProfileSettings from '@/components/ProfileSettings';
import MedicineManager from '@/components/MedicineManager';
import ClinicBrandingSettings from '@/components/ClinicBrandingSettings';
import PublicHomePageSettings from '@/components/PublicHomePageSettings';
import MedicalTestManager from '@/components/MedicalTestManager';
import {
  Users,
  UserPlus,
  Power,
  AlertCircle,
  Stethoscope,
  Calendar,
  FileText,
  Search,
  Activity,
  CheckCircle2,
  Filter,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Server,
  Database,
  X,
  Eye,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Time Slot Selection Feature Toggle (stored in localStorage)
  const [timeSlotEnabled, setTimeSlotEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('time_slot_enabled') !== 'false';
    }
    return true;
  });

  const handleToggleTimeSlot = async (enabled: boolean): Promise<void> => {
    setTimeSlotEnabled(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('time_slot_enabled', enabled ? 'true' : 'false');
      window.dispatchEvent(new Event('storage'));
    }
    try {
      await api.settings.updateClinic({ enableTimeSlot: enabled });
    } catch (err) {
      console.warn('Could not save time slot setting to DB:', err);
    }
  };

  useEffect(() => {
    api.settings
      .getClinic()
      .then((res: any) => {
        if (res && res.setting) {
          const enabled: boolean = res.setting.enableTimeSlot !== false;
          setTimeSlotEnabled(enabled);
          if (typeof window !== 'undefined') {
            localStorage.setItem('time_slot_enabled', enabled ? 'true' : 'false');
          }
        }
      })
      .catch(() => {});
  }, []);

  // User filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');

  // Prescription filters
  const [rxSearchTerm, setRxSearchTerm] = useState('');
  const [rxStatusFilter, setRxStatusFilter] = useState<'All' | 'Finalized' | 'Draft'>('All');
  const [rxDoctorFilter, setRxDoctorFilter] = useState<string>('All');
  const [selectedRx, setSelectedRx] = useState<any | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'Receptionist',
    speciality: '',
    qualifications: '',
    bmdcRegNo: '',
    roomNumber: '',
  });

  const loadData = useCallback(async () => {
    setFetching(true);
    setError('');
    try {
      const [userData, doctorData, rxData] = await Promise.allSettled([
        api.auth.getAllUsers(),
        api.doctors.getAll(),
        api.prescriptions.getAll(),
      ]);

      if (userData.status === 'fulfilled') {
        setUsers(userData.value.users || []);
      }
      if (doctorData.status === 'fulfilled') {
        setDoctors(doctorData.value.doctors || []);
      }
      if (rxData.status === 'fulfilled') {
        setPrescriptions(rxData.value.prescriptions || []);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load admin data');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return; // Wait until AuthProvider completes restoring session
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'Admin') {
      router.push('/');
      return;
    }
    loadData();
  }, [user, authLoading, router, loadData]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.auth.register(form);
      setSuccess(`${form.role} account created for ${form.name}`);
      setShowForm(false);
      setForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'Receptionist',
        speciality: '',
        qualifications: '',
        bmdcRegNo: '',
        roomNumber: '',
      });
      loadData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const [approvalFilter, setApprovalFilter] = useState<'All' | 'Pending' | 'Approved'>('All');

  const handleToggle = async (id: string) => {
    try {
      await api.auth.toggleUser(id);
      loadData();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleApproveUser = async (id: string) => {
    try {
      const res = await api.auth.approveUser(id);
      setSuccess(res.message || 'User approved successfully!');
      loadData();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      const res = await api.auth.updateUserRole(id, newRole);
      setSuccess(res.message || `Role updated to ${newRole}!`);
      loadData();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const roleColors: Record<string, string> = {
    Admin: 'bg-purple-100 text-purple-800 border-purple-300',
    Doctor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Receptionist: 'bg-sky-100 text-sky-800 border-sky-300',
    Patient: 'bg-slate-100 text-slate-700 border-slate-300',
  };

  const pendingApprovalsCount = users.filter((u) => u.isApproved === false).length;

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.includes(searchTerm);
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesApproval =
      approvalFilter === 'All'
        ? true
        : approvalFilter === 'Pending'
        ? u.isApproved === false
        : u.isApproved !== false;
    return matchesSearch && matchesRole && matchesApproval;
  });

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const q = rxSearchTerm.toLowerCase().trim();
    const docName = rx.doctor?.user?.name || '';
    const docId = rx.doctor?._id || rx.doctor || '';
    // Patient info lives inside rx.appointment (nested populate)
    const patientName = rx.appointment?.patientName || '';
    const patientPhone = rx.appointment?.phone || '';
    const apptDate = rx.appointment?.date || '';
    const matchesSearch =
      !q ||
      patientName.toLowerCase().includes(q) ||
      patientPhone.includes(q) ||
      rx.diagnosis?.toLowerCase().includes(q) ||
      docName.toLowerCase().includes(q) ||
      apptDate.includes(q) ||
      rx.medicines?.some(
        (m: any) =>
          m.brandName?.toLowerCase().includes(q) ||
          m.medicineName?.toLowerCase().includes(q) ||
          m.generic?.toLowerCase().includes(q)
      );

    const matchesStatus =
      rxStatusFilter === 'All' ||
      (rxStatusFilter === 'Finalized' && rx.isFinalized) ||
      (rxStatusFilter === 'Draft' && !rx.isFinalized);

    const matchesDoctor =
      rxDoctorFilter === 'All' || String(docId) === rxDoctorFilter;

    return matchesSearch && matchesStatus && matchesDoctor;
  });

  const stats = {
    totalUsers: users.length,
    adminsCount: users.filter((u) => u.role === 'Admin').length,
    doctorsCount: users.filter((u) => u.role === 'Doctor').length,
    receptionistsCount: users.filter((u) => u.role === 'Receptionist').length,
    patientsCount: users.filter((u) => u.role === 'Patient').length,
    pendingApprovalsCount: pendingApprovalsCount,
    activeCount: users.filter((u) => u.isActive).length,
    prescriptionsCount: prescriptions.length,
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-bold text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying Staff Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Side Panel Component */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddUser={() => {
          setActiveTab('users');
          setShowForm(true);
        }}
        stats={stats}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 lg:ml-72 min-w-0 transition-all duration-300">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 relative lg:sticky top-0 z-20 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-base sm:text-xl font-black text-slate-900 capitalize flex items-center gap-2">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'approvals' && 'Pending Account Approvals & Review'}
                {activeTab === 'users' && 'User Accounts Management'}
                {activeTab === 'doctors' && 'Doctor Roster & Schedules'}
                {activeTab === 'appointments' && 'Queue & Appointments Monitor'}
                {activeTab === 'prescriptions' && 'Digital Prescription System Archive'}
                {activeTab === 'medicines' && '💊 Medicine Dictionary Manager'}
                {activeTab === 'settings' && 'System Configuration & Health'}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                SmartCare Clinic Suite • Admin Workspace
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadData}
              disabled={fetching}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${fetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('users');
                setShowForm(true);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add User</span>
            </button>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-3.5 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Success Notification */}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center justify-between animate-fadeIn">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> {success}
              </span>
              <button
                onClick={() => setSuccess('')}
                className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Error Notification */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" /> {error}
              </span>
              <button
                onClick={() => setError('')}
                className="text-rose-700 hover:text-rose-900 font-bold text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: OVERVIEW */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-black text-slate-900">{stats.totalUsers}</div>
                    <div className="text-xs font-bold text-slate-500 mt-1">Total Registered Users</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-black text-slate-900">{stats.doctorsCount}</div>
                    <div className="text-xs font-bold text-slate-500 mt-1">Active Doctors</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-black text-slate-900">{stats.prescriptionsCount}</div>
                    <div className="text-xs font-bold text-slate-500 mt-1">Prescriptions Issued</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-black text-slate-900">{stats.activeCount}</div>
                    <div className="text-xs font-bold text-slate-500 mt-1">Active Accounts</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Pending Registration Requests Alert Banner */}
              {pendingApprovalsCount > 0 && (
                <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 rounded-2xl p-5 text-white shadow-md flex flex-wrap items-center justify-between gap-4 border border-amber-400">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                      <Users className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base flex items-center gap-2">
                        ⏳ {pendingApprovalsCount} Account Registration Request{pendingApprovalsCount > 1 ? 's' : ''} Pending Review
                      </h3>
                      <p className="text-xs text-amber-100 font-medium">
                        Doctor / Receptionist accounts submitted publicly require your review & approval.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('users');
                      setApprovalFilter('Pending');
                    }}
                    className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-amber-300 font-black text-xs rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Review Pending Accounts →
                  </button>
                </div>
              )}
              <div className="bg-linear-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-extrabold border border-emerald-500/30">
                    <Sparkles className="w-3.5 h-3.5" /> Quick Operations
                  </div>
                  <h2 className="text-xl font-black tracking-tight">System Control & Role Administration</h2>
                  <p className="text-slate-300 text-xs max-w-xl">
                    Manage system credentials, create new Receptionist or Doctor profiles, inspect registered doctors, and monitor live clinic queues and prescriptions archive.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => {
                      setActiveTab('users');
                      setShowForm(true);
                    }}
                    className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" /> Create User Account
                  </button>
                  <button
                    onClick={() => setActiveTab('prescriptions')}
                    className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors"
                  >
                    View Prescription Archive
                  </button>
                </div>
              </div>

              {/* Role Breakdown Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-slate-600" /> Account Role Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { role: 'Admin', count: stats.adminsCount, color: 'bg-purple-500', desc: 'Full System Access' },
                    { role: 'Doctor', count: stats.doctorsCount, color: 'bg-emerald-500', desc: 'Prescriptions & Queue' },
                    { role: 'Receptionist', count: stats.receptionistsCount, color: 'bg-sky-500', desc: 'Appointment Booking' },
                    { role: 'Patient', count: stats.patientsCount, color: 'bg-slate-400', desc: 'Live Track Access' },
                  ].map(({ role, count, color, desc }) => (
                    <div key={role} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                          <span className="font-bold text-sm text-slate-900">{role}s</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
                      </div>
                      <span className="text-xl font-black text-slate-800">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TAB 1.5: PENDING APPROVALS DEDICATED PAGE */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'approvals' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-amber-400 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-950/40 text-amber-200 text-xs font-black uppercase tracking-wider border border-amber-300/30">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Staff Review Queue
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                      Pending Account Approvals ({pendingApprovalsCount})
                    </h2>
                    <p className="text-xs md:text-sm text-amber-100 max-w-xl">
                      Review public registration requests for Doctors & Receptionists before granting access to SmartCare Clinic Suite.
                    </p>
                  </div>

                  <div className="bg-slate-950/60 backdrop-blur-md p-4 rounded-2xl border border-amber-400/30 text-center shrink-0 min-w-44">
                    <div className="text-3xl font-black text-amber-300">{pendingApprovalsCount}</div>
                    <div className="text-[11px] font-bold text-amber-100 uppercase tracking-wider">
                      Awaiting Action
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Accounts Grid / List */}
              {pendingApprovalsCount === 0 ? (
                <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900">All Account Requests Reviewed!</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      There are currently no pending Doctor or Receptionist registration requests awaiting approval.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-md"
                  >
                    Manage Existing User Accounts →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {users
                    .filter((u) => u.isApproved === false)
                    .map((u) => (
                      <div
                        key={u._id}
                        className="bg-white rounded-3xl border border-amber-200/80 p-6 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />

                        {/* User Profile Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black text-lg shadow-md shrink-0">
                              {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                                {u.name}
                              </h3>
                              <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                              <p className="text-xs text-slate-500 font-mono mt-0.5">📞 {u.phone}</p>
                            </div>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black border ${
                              roleColors[u.role] || ''
                            }`}
                          >
                            {u.role} Request
                          </span>
                        </div>

                        {/* Doctor Specific Details Badge (if role === Doctor) */}
                        {u.role === 'Doctor' && u.doctorProfile && (
                          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs space-y-1.5 text-amber-950">
                            <div className="font-bold text-amber-900 flex items-center gap-1.5">
                              <Stethoscope className="w-4 h-4 text-amber-600" />
                              <span>Doctor Credentials Submitted:</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div><span className="font-semibold">Speciality:</span> {u.doctorProfile.speciality || 'General Medicine'}</div>
                              <div><span className="font-semibold">Qualifications:</span> {u.doctorProfile.qualifications || 'MBBS'}</div>
                              <div><span className="font-semibold">BMDC No:</span> <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200">{u.doctorProfile.bmdcRegNo || 'Pending'}</code></div>
                              <div><span className="font-semibold">Room:</span> {u.doctorProfile.roomNumber || 'Room 01'}</div>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleToggle(u._id)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 transition-all active:scale-95 cursor-pointer"
                          >
                            Reject Request
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRoleChange(u._id, 'Admin')}
                              className="px-3 py-2 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200 transition-all active:scale-95 cursor-pointer"
                              title="Approve & Grant Full Admin Access"
                            >
                              👑 Make Admin
                            </button>

                            <button
                              onClick={() => handleApproveUser(u._id)}
                              className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve Account
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: USERS */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* User Controls Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Role & Approval Filter Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <div className="flex items-center gap-1 overflow-x-auto">
                    <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5" /> Role:
                    </span>
                    {['All', 'Admin', 'Doctor', 'Receptionist', 'Patient'].map((r) => (
                      <button
                        key={r}
                        onClick={() => setRoleFilter(r)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                          roleFilter === r
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                    <span className="text-xs font-bold text-slate-500 mr-1">Status:</span>
                    <button
                      onClick={() => setApprovalFilter('All')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        approvalFilter === 'All'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All Status
                    </button>
                    <button
                      onClick={() => setApprovalFilter('Pending')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                        approvalFilter === 'Pending'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      <span>⏳ Pending Review</span>
                      {pendingApprovalsCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-amber-900 text-amber-200 rounded-full text-[10px]">
                          {pendingApprovalsCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setApprovalFilter('Approved')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        approvalFilter === 'Approved'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      Approved
                    </button>
                  </div>
                </div>
              </div>

              {/* User Accounts Table Card */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-slate-600" /> User Accounts ({filteredUsers.length})
                  </h3>
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> {showForm ? 'Close Form' : 'Add User'}
                  </button>
                </div>

                {/* Create User Form */}
                {showForm && (
                  <div className="p-6 bg-slate-50/80 border-b border-slate-200 animate-fadeIn">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-emerald-600" /> Create New System Account
                    </h4>
                    <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Full Name *', field: 'name', type: 'text', placeholder: 'Dr. Rihad Hossain' },
                        { label: 'Email *', field: 'email', type: 'email', placeholder: 'doctor@clinic.com' },
                        { label: 'Password *', field: 'password', type: 'password', placeholder: 'Min 6 chars' },
                        { label: 'Phone *', field: 'phone', type: 'tel', placeholder: '+880 1700 000000' },
                      ].map(({ label, field, type, placeholder }) => (
                        <div key={field}>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                          <input
                            type={type}
                            required
                            placeholder={placeholder}
                            value={(form as any)[field]}
                            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white"
                          />
                        </div>
                      ))}

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Role *</label>
                        <select
                          value={form.role}
                          onChange={(e) => setForm({ ...form, role: e.target.value })}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:border-emerald-500 font-semibold"
                        >
                          <option value="Receptionist">Receptionist</option>
                          <option value="Doctor">Doctor</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>

                      {form.role === 'Doctor' && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Speciality *</label>
                            <input
                              placeholder="e.g. Cardiology"
                              value={form.speciality}
                              onChange={(e) => setForm({ ...form, speciality: e.target.value })}
                              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Qualifications *</label>
                            <input
                              placeholder="e.g. MBBS, FCPS"
                              value={form.qualifications}
                              onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
                              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">BMDC Reg No *</label>
                            <input
                              placeholder="e.g. A-12345"
                              value={form.bmdcRegNo}
                              onChange={(e) => setForm({ ...form, bmdcRegNo: e.target.value })}
                              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Room Number</label>
                            <input
                              placeholder="e.g. Room 05"
                              value={form.roomNumber}
                              onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white"
                            />
                          </div>
                        </>
                      )}

                      <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowForm(false)}
                          className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl disabled:opacity-50"
                        >
                          {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                        <th className="py-3 px-4 text-left">User Profile</th>
                        <th className="py-3 px-4 text-left">Email</th>
                        <th className="py-3 px-4 text-left">Phone</th>
                        <th className="py-3 px-4 text-center">Role & Access</th>
                        <th className="py-3 px-4 text-center">Approval Status</th>
                        <th className="py-3 px-4 text-center">Account Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-400 text-xs font-semibold">
                            No users found matching your search or status criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center font-black text-xs shrink-0">
                                {u.avatar ? (
                                  <img src={u.avatar} alt={u.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  u.name ? u.name.charAt(0).toUpperCase() : 'U'
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{u.name}</div>
                                {u.isApproved === false && (
                                  <span className="text-[10px] font-bold text-amber-600 animate-pulse block">
                                    ⏳ Needs Approval
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 text-xs">{u.email}</td>
                            <td className="py-3.5 px-4 text-slate-600 text-xs font-mono">{u.phone}</td>

                            {/* Role Column with Grant Admin / Role Dropdown */}
                            <td className="py-3.5 px-4 text-center">
                              {String(u._id) !== String(user?.id || user?._id) ? (
                                <select
                                  value={u.role}
                                  onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                  className={`px-2.5 py-1 rounded-xl text-xs font-black border outline-none cursor-pointer ${
                                    roleColors[u.role] || ''
                                  }`}
                                  title="Change user access level / Grant Admin privileges"
                                >
                                  <option value="Admin">👑 Admin Access</option>
                                  <option value="Doctor">👨‍⚕️ Doctor</option>
                                  <option value="Receptionist">📋 Receptionist</option>
                                  <option value="Patient">👤 Patient</option>
                                </select>
                              ) : (
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                    roleColors[u.role] || ''
                                  }`}
                                >
                                  👑 {u.role} (You)
                                </span>
                              )}
                            </td>

                            {/* Approval & Active Status */}
                            <td className="py-3.5 px-4 text-center">
                              {u.isApproved === false ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                                  Pending Review
                                </span>
                              ) : u.isActive ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  Approved
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                  Blocked
                                </span>
                              )}
                            </td>

                            {/* Actions Column */}
                            <td className="py-3.5 px-4 text-center">
                              {String(u._id) !== String(user?.id || user?._id) ? (
                                <div className="flex items-center justify-center gap-2">
                                  {u.isApproved === false && (
                                    <button
                                      onClick={() => handleApproveUser(u._id)}
                                      className="px-3 py-1.5 rounded-xl font-black text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                                      title="Approve this user account"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Approve
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleToggle(u._id)}
                                    className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-1 transition-all active:scale-95 shadow-xs cursor-pointer ${
                                      u.isActive
                                        ? 'bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200'
                                        : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200'
                                    }`}
                                    title={u.isActive ? 'Block account' : 'Unblock account'}
                                  >
                                    <Power className="w-3.5 h-3.5" />
                                    {u.isActive ? 'Block' : 'Unblock'}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 italic">
                                  🔒 Your Account
                                </span>
                              )}
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
          {/* TAB 3: DOCTORS */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'doctors' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-emerald-600" /> Registered Doctors Roster ({doctors.length})
                </h3>
              </div>

              {doctors.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                  <Stethoscope className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="font-bold text-sm text-slate-600">No Doctor profiles found</p>
                  <p className="text-xs text-slate-400 mt-1">Use the Add User form to register Doctor accounts.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {doctors.map((doc) => {
                    const docUser = doc.user;
                    const isDocActive = docUser?.isActive !== false;
                    const userId = typeof docUser === 'object' ? docUser?._id : docUser;

                    return (
                      <div
                        key={doc._id}
                        className={`bg-white rounded-2xl border p-5 shadow-xs space-y-4 transition-colors ${
                          isDocActive ? 'border-slate-200 hover:border-emerald-300' : 'border-rose-200 bg-rose-50/20'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md ${
                              isDocActive ? 'bg-linear-to-tr from-emerald-500 to-teal-400' : 'bg-slate-400'
                            }`}>
                              <Stethoscope className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900">{doc.user?.name || 'Dr. Medical'}</h4>
                              <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
                                {doc.speciality}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                              isDocActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {isDocActive ? 'Active' : 'Blocked'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-medium">Qualifications:</span>
                            <span className="font-semibold text-slate-800">{doc.qualifications}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-medium">BMDC Reg No:</span>
                            <span className="font-mono font-bold text-slate-800">{doc.bmdcRegNo}</span>
                          </div>
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
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-medium">Daily Limit:</span>
                            <span className="font-bold text-emerald-700">{doc.maxDailyPatients} Patients/Day</span>
                          </div>
                        </div>

                        {userId && (
                          <div className="pt-3 border-t border-slate-100 flex justify-end">
                            <button
                              onClick={() => handleToggle(userId)}
                              className={`w-full py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
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
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TAB 4: APPOINTMENTS */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'appointments' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" /> Queue & Appointment Monitor
                  </h3>
                  <p className="text-xs text-slate-500">Live monitoring of clinic appointments</p>
                </div>
                <button
                  onClick={() => router.push('/receptionist')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  Go to Receptionist Panel <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-500">Serial System</div>
                  <div className="text-sm font-semibold text-slate-800 mt-1">1-Indexed Per Doctor / Date</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-500">Queue Flow</div>
                  <div className="text-sm font-semibold text-slate-800 mt-1">Pending → In Progress → Completed</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-500">Live Tracking</div>
                  <div className="text-sm font-semibold text-emerald-700 mt-1">Public `/track` endpoint active</div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TAB: MEDICINE MANAGER */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'medicines' && (
            <MedicineManager />
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TAB: MEDICAL TEST MANAGER */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'tests' && (
            <MedicalTestManager />
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TAB 5: PRESCRIPTIONS DYNAMIC ARCHIVE */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-6">
              {/* Filter Bar — single row */}
              <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-52">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search patient, diagnosis, phone..."
                    value={rxSearchTerm}
                    onChange={(e) => setRxSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 bg-slate-50"
                  />
                  {rxSearchTerm && (
                    <button
                      onClick={() => setRxSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-slate-200 hidden md:block" />

                {/* Doctor Filter */}
                <div className="flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={rxDoctorFilter}
                    onChange={(e) => setRxDoctorFilter(e.target.value)}
                    className="w-44 px-2.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 bg-slate-50 text-slate-700"
                  >
                    <option value="All">All Doctors</option>
                    {doctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.user?.isActive === false ? '🔴 ' : '🟢 '}Dr. {doc.user?.name || 'Unknown'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-slate-200 hidden md:block" />

                {/* Status chips */}
                <div className="flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
                  {(['All', 'Finalized', 'Draft'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setRxStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        rxStatusFilter === st
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Clear all */}
                {(rxDoctorFilter !== 'All' || rxStatusFilter !== 'All' || rxSearchTerm) && (
                  <button
                    onClick={() => { setRxDoctorFilter('All'); setRxStatusFilter('All'); setRxSearchTerm(''); }}
                    className="ml-auto px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-200 transition-all shrink-0"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>

              {/* Prescription Records List */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" /> All Clinic Prescriptions Archive (
                    {filteredPrescriptions.length})
                  </h3>
                </div>

                {filteredPrescriptions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">No prescriptions found in system records.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredPrescriptions.map((rx) => (
                      <div
                        key={rx._id}
                        className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 hover:border-emerald-400 transition-all space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-slate-900 text-base">
                                {rx.appointment?.patientName || 'Unknown Patient'}
                              </h4>
                              <span className="text-xs font-semibold text-slate-500">
                                ({rx.appointment?.age ?? '?'} Yrs • {rx.appointment?.gender || 'N/A'})
                              </span>
                              {rx.isFinalized ? (
                                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                                  ✓ Finalized
                                </span>
                              ) : (
                                <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
                                  ✎ Draft
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-mono">
                              📅 Date: {rx.appointment?.date || 'N/A'} &nbsp;•&nbsp;
                              📞 {rx.appointment?.phone || 'N/A'}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                              <Stethoscope className="w-3.5 h-3.5" /> Dr. {rx.doctor?.user?.name || 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <span className="text-slate-400 font-bold block text-[10px] uppercase">
                              Diagnosis:
                            </span>
                            <span className="font-extrabold text-slate-900 text-sm">
                              {rx.diagnosis || 'General Consultation'}
                            </span>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <span className="text-slate-400 font-bold block text-[10px] uppercase">
                              Vitals Summary:
                            </span>
                            <span className="font-medium text-slate-700">
                              BP: {rx.vitals?.bp || 'N/A'} | Pulse: {rx.vitals?.pulse || 'N/A'}
                            </span>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <span className="text-slate-400 font-bold block text-[10px] uppercase">
                              Medicines Prescribed ({rx.medicines?.length || 0}):
                            </span>
                            <span className="font-semibold text-emerald-700 truncate block">
                              {rx.medicines && rx.medicines.length > 0
                                ? rx.medicines.map((m: any) => m.brandName).join(', ')
                                : 'None'}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => setSelectedRx(rx)}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-400" /> View Full Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TAB 6: SETTINGS */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Clinic Branding Settings (Name & Logo Edit with Fallback) */}
              <ClinicBrandingSettings />

              {/* Public Home Page Branding & Notice Banner Settings */}
              <PublicHomePageSettings />

              {/* Feature Toggle Card: Time Slot Selection */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <Clock className="w-5 h-5 text-emerald-600" /> Time Slot Selection System
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xl">
                      Controls whether patients and receptionists must select a 30-minute time slot during appointment booking. Turn off for open chamber hours.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0">
                    <button
                      onClick={() => handleToggleTimeSlot(true)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                        timeSlotEnabled
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${timeSlotEnabled ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
                      ON (Enabled)
                    </button>
                    <button
                      onClick={() => handleToggleTimeSlot(false)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                        !timeSlotEnabled
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${!timeSlotEnabled ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
                      OFF (Disabled)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="font-bold">Current Status:</span>
                  {timeSlotEnabled ? (
                    <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                      🟢 Time Slot Selection is ACTIVE (Patients pick 30-min slots)
                    </span>
                  ) : (
                    <span className="text-rose-700 font-extrabold flex items-center gap-1">
                      🔴 Time Slot Selection is DISABLED (Open serial queue mode)
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Server className="w-5 h-5 text-emerald-600" /> System Configuration & API Health
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                      <Database className="w-4 h-4 text-purple-600" /> Backend Stack
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p>
                        <span className="font-semibold">Framework:</span> Express 5.0 (Node.js)
                      </p>
                      <p>
                        <span className="font-semibold">Database:</span> MongoDB / Mongoose ODM
                      </p>
                      <p>
                        <span className="font-semibold">Auth Strategy:</span> JWT Bearer Token Header
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                      <Activity className="w-4 h-4 text-emerald-600" /> API Health Status
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p>
                        <span className="font-semibold">Status:</span>{' '}
                        <span className="text-emerald-700 font-bold">Online & Healthy</span>
                      </p>
                      <p>
                        <span className="font-semibold">Base URL:</span>{' '}
                        <code className="text-emerald-700 break-all">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}</code>
                      </p>
                      <p>
                        <span className="font-semibold">Environment:</span>{' '}
                        <code className="text-emerald-700">{process.env.NODE_ENV || 'development'}</code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TAB 7: PROFILE SETTINGS */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'profile' && <ProfileSettings />}
        </div>
      </main>

      {/* Admin Prescription Inspection Modal */}
      {selectedRx && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col animate-fadeIn">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-base">Prescription Details Record</h3>
              </div>
              <button
                onClick={() => setSelectedRx(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    {selectedRx.appointment?.patientName || selectedRx.patientName || 'Unknown Patient'}
                  </h4>
                  <p className="text-slate-600 font-semibold text-xs mt-0.5">
                    {(selectedRx.appointment?.age ?? selectedRx.patientAge ?? selectedRx.age) ? `${selectedRx.appointment?.age ?? selectedRx.patientAge ?? selectedRx.age} Yrs` : 'Age N/A'} • {selectedRx.appointment?.gender || selectedRx.patientGender || selectedRx.gender || 'N/A'}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="font-bold text-emerald-700 text-sm">
                    Doctor: {selectedRx.doctor?.user?.name || 'Assigned Doctor'}
                  </span>
                  <span className="text-xs font-bold text-slate-800 font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-sm inline-flex items-center gap-1">
                    📅 Date: {selectedRx.appointment?.date || selectedRx.date || (selectedRx.createdAt ? new Date(selectedRx.createdAt).toISOString().split('T')[0] : 'N/A')}
                  </span>
                </div>
              </div>

              <div className="bg-emerald-50 text-emerald-950 p-3 rounded-xl border border-emerald-200 font-extrabold text-sm">
                Diagnosis: {selectedRx.diagnosis}
              </div>

              {selectedRx.vitals && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-700 block">Vitals Record:</span>
                  <div className="grid grid-cols-4 gap-2 font-mono text-[11px] text-slate-600">
                    <div>BP: {selectedRx.vitals.bp || 'N/A'}</div>
                    <div>Pulse: {selectedRx.vitals.pulse || 'N/A'}</div>
                    <div>Weight: {selectedRx.vitals.weight || 'N/A'}</div>
                    <div>Temp: {selectedRx.vitals.temp || 'N/A'}</div>
                  </div>
                </div>
              )}

              <div>
                <h5 className="font-bold text-slate-800 mb-2 uppercase text-[10px]">
                  Prescribed Medicines ({selectedRx.medicines?.length || 0}):
                </h5>
                <div className="space-y-2">
                  {selectedRx.medicines?.map((m: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-900 text-sm">
                        {idx + 1}. [{m.dosageForm}] {m.brandName} {m.strength}
                      </div>
                      <div className="text-slate-500 italic">{m.generic}</div>
                      <div className="flex gap-2 text-emerald-800 font-bold font-mono">
                        <span>{m.frequency}</span> • <span>{m.timing}</span> • <span>{m.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRx.advice && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block">Advice:</span>
                  <p className="text-slate-800">{selectedRx.advice}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

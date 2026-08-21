/* eslint-disable @typescript-eslint/typedef */
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  Stethoscope, Eye, EyeOff, AlertCircle, CheckCircle2,
  Mail, Lock, User, Phone, UserPlus, Sparkles, ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Registration Form State
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'Doctor' as 'Doctor' | 'Receptionist',
    speciality: 'General Medicine',
    qualifications: 'MBBS',
    bmdcRegNo: '',
    roomNumber: 'Room 01',
  });
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Demo Credentials Quick Fill
  const demos: { label: string; icon: string; email: string; password: string; color: string }[] = [
    { label: 'Admin', icon: '👑', email: 'admin@clinic.com', password: 'password123', color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-300' },
    { label: 'Doctor', icon: '👨‍⚕️', email: 'doctor@clinic.com', password: 'password123', color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-300' },
    { label: 'Receptionist', icon: '📋', email: 'receptionist@clinic.com', password: 'password123', color: 'from-sky-500/20 to-sky-600/10 border-sky-500/30 text-sky-300' },
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Login failed. Check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    setRegLoading(true);
    try {
      const res = await api.auth.registerRequest(regForm);
      setRegSuccess(res.message || 'Registration request submitted! Admin approval is required before you can log in.');
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden selection:bg-emerald-500 selection:text-slate-950">

      {/* Ambient Lighting Mesh */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-87.5 h-87.5 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-lg relative z-10 my-8">

        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-14 h-14 bg-linear-to-tr from-emerald-500 via-teal-400 to-cyan-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-8 h-8 text-slate-950" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black text-white tracking-tight">SmartCare</h1>
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest block -mt-1">
                Medical Staff Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Glass Card */}
        <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-slate-800/90 shadow-2xl shadow-slate-950/80 overflow-hidden">

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-950/60 border-b border-slate-800/80">
            <button
              onClick={() => setActiveTab('login')}
              className={`py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'login'
                  ? 'bg-slate-900 text-emerald-400 shadow-lg border border-slate-700/60'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'register'
                  ? 'bg-slate-900 text-emerald-400 shadow-lg border border-slate-700/60'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register Staff
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">

            {/* TAB 1: LOGIN */}
            {activeTab === 'login' && (
              <>
                {/* Demo Accounts Quick-Fill Section */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Quick Fill Demo Accounts:
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Click to populate</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {demos.map((d) => (
                      <button
                        key={d.label}
                        type="button"
                        onClick={() => { setLoginEmail(d.email); setLoginPassword(d.password); }}
                        className={`px-3 py-2 rounded-xl bg-linear-to-r ${d.color} border text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5 shadow-sm`}
                      >
                        <span>{d.icon}</span>
                        <span>{d.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="doctor@clinic.com"
                        className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 text-white rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 bg-slate-950/80 border border-slate-800 text-white rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="flex items-center gap-2 p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3.5 bg-linear-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-black rounded-xl transition-all shadow-xl shadow-emerald-500/20 text-xs uppercase tracking-wider flex items-center justify-center gap-2 mt-2"
                  >
                    <span>{loginLoading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}

            {/* TAB 2: REGISTER */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* Role Selector Chips */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Account Role *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { role: 'Doctor', icon: '👨‍⚕️', label: 'Doctor' },
                      { role: 'Receptionist', icon: '📋', label: 'Receptionist' },
                    ].map(({ role, icon, label }) => (
                      <button
                        type="button"
                        key={role}
                        onClick={() => setRegForm({ ...regForm, role: role as 'Doctor' | 'Receptionist' })}
                        className={`py-2.5 rounded-xl border text-xs font-extrabold transition-all flex flex-col items-center gap-1 ${
                          regForm.role === role
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-md'
                            : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-base">{icon}</span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Full Name *</label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="Dr. Arman Ali"
                        value={regForm.name}
                        onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 text-white rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Phone *</label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        placeholder="+880 1700-000000"
                        value={regForm.phone}
                        onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 text-white rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="arman@clinic.com"
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 text-white rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Password *</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 text-white rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Additional Doctor Fields */}
                {regForm.role === 'Doctor' && (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      👨‍⚕️ Doctor Profile Details:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        placeholder="Speciality (e.g. Cardiology)"
                        value={regForm.speciality}
                        onChange={(e) => setRegForm({ ...regForm, speciality: e.target.value })}
                        className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 text-white rounded-lg text-[11px]"
                      />
                      <input
                        type="text"
                        placeholder="BMDC Reg No (e.g. A-9876)"
                        value={regForm.bmdcRegNo}
                        onChange={(e) => setRegForm({ ...regForm, bmdcRegNo: e.target.value })}
                        className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 text-white rounded-lg text-[11px]"
                      />
                    </div>
                  </div>
                )}

                {regError && (
                  <div className="flex items-center gap-2 p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                {regSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{regSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-xl shadow-emerald-600/20 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{regLoading ? 'Creating Staff Account...' : 'Register Account'}</span>
                </button>
              </form>
            )}

          </div>

          {/* Footer Back Link */}
          <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 text-center">
            <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors">
              ← Return to Public Serial Queue Home Page
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}

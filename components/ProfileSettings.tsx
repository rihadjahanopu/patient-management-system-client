'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Camera,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Building2,
  Clock,
  ShieldCheck,
  Sparkles,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  Cloud,
  Check,
  ToggleLeft,
  ToggleRight,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

export default function ProfileSettings() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Basic State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');

  // Doctor Specific State
  const [speciality, setSpeciality] = useState('General Medicine');
  const [qualifications, setQualifications] = useState('MBBS');
  const [bmdcRegNo, setBmdcRegNo] = useState('');
  const [roomNumber, setRoomNumber] = useState('Room 01');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('05:00 PM');
  const [maxDailyPatients, setMaxDailyPatients] = useState<number>(30);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Status & Loaders
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // Populate data on mount or when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');

      if (user.doctorProfile) {
        setSpeciality(user.doctorProfile.speciality || 'General Medicine');
        setQualifications(user.doctorProfile.qualifications || 'MBBS');
        setBmdcRegNo(user.doctorProfile.bmdcRegNo || '');
        setRoomNumber(user.doctorProfile.roomNumber || 'Room 01');
        setStartTime(user.doctorProfile.visitingHours?.startTime || '09:00 AM');
        setEndTime(user.doctorProfile.visitingHours?.endTime || '05:00 PM');
        setMaxDailyPatients(user.doctorProfile.maxDailyPatients || 30);
        setIsAvailable(user.doctorProfile.isAvailable !== false);
      }
    }
  }, [user]);

  // Handle Cloudinary Avatar File Change
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Image size should be less than 5MB.');
      return;
    }

    setUploadingAvatar(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const res = await api.auth.uploadAvatar(base64Data);
        setAvatar(res.avatar);
        updateUser({ avatar: res.avatar });
        setProfileSuccess('Profile picture updated & saved to Cloudinary!');
        setUploadingAvatar(false);
      };
    } catch (err: any) {
      setProfileError(err.message || 'Failed to upload image to Cloudinary.');
      setUploadingAvatar(false);
    }
  };

  // Save Profile Info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const doctorData =
        user?.role === 'Doctor'
          ? {
              speciality,
              qualifications,
              bmdcRegNo,
              roomNumber,
              visitingHours: { startTime, endTime },
              maxDailyPatients: Number(maxDailyPatients),
              isAvailable,
            }
          : undefined;

      const res = await api.auth.updateProfile({
        name,
        email,
        phone,
        avatar,
        doctorProfile: doctorData,
      });

      updateUser(res.user);
      setProfileSuccess('Profile details saved successfully!');
    } catch (err: any) {
      setProfileError(err.message || 'Failed to save profile changes.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Save Password Change
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setPassSuccess('');
    setPassError('');

    if (!currentPassword) {
      setPassError('Please enter your current password.');
      setSavingPassword(false);
      return;
    }

    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters.');
      setSavingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      setSavingPassword(false);
      return;
    }

    try {
      await api.auth.changePassword({ currentPassword, newPassword });
      setPassSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassError(err.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* ─── Top Header Card ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {/* Avatar Upload Container */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-slate-800 border-4 border-slate-700/80 shadow-2xl flex items-center justify-center relative">
              {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-4xl">
                  {name ? name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              {uploadingAvatar && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-emerald-400 text-xs font-bold gap-1">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>Cloudinary...</span>
                </div>
              )}
            </div>

            {/* Cloudinary Camera Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-1 right-1 bg-emerald-500 hover:bg-emerald-400 text-white p-2.5 rounded-full shadow-lg border-2 border-slate-900 transition-all hover:scale-110 active:scale-95 cursor-pointer"
              title="Upload new avatar to Cloudinary"
            >
              <Camera className="w-4 h-4" />
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* User Meta Summary */}
          <div className="text-center md:text-left space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {user?.role} Account
              </span>
              {avatar && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                  <Cloud className="w-3 h-3" />
                  Cloudinary Verified
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight">{name || 'User Profile'}</h1>
            <p className="text-xs md:text-sm text-slate-300 flex items-center justify-center md:justify-start gap-4">
              <span>{email}</span>
              <span>•</span>
              <span>{phone}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {profileSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium text-sm flex items-center gap-3 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{profileSuccess}</span>
        </div>
      )}

      {profileError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-medium text-sm flex items-center gap-3 animate-fade-in shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{profileError}</span>
        </div>
      )}

      {/* ─── Main Form: Account Details ─── */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Card 1: Personal Profile */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
              <p className="text-xs text-slate-500">Update your account identity and contact information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Full Name *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter full name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+8801700000000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Doctor Role Specific Settings (Only visible if role === 'Doctor') */}
        {user?.role === 'Doctor' && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Doctor Professional Profile</h2>
                  <p className="text-xs text-slate-500">Chamber, qualifications & visiting hours</p>
                </div>
              </div>

              {/* Doctor Availability Switch */}
              <button
                type="button"
                onClick={() => setIsAvailable(!isAvailable)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                  isAvailable
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                }`}
              >
                {isAvailable ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-rose-500" />}
                <span>{isAvailable ? 'Available for Appointments' : 'Currently Unavailable'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Speciality / Department *
                </label>
                <input
                  type="text"
                  value={speciality}
                  onChange={(e) => setSpeciality(e.target.value)}
                  placeholder="e.g. Cardiology, Medicine, Pediatrics"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Qualifications *
                </label>
                <input
                  type="text"
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  placeholder="e.g. MBBS, FCPS (Medicine), MD"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  BMDC Reg. No *
                </label>
                <input
                  type="text"
                  value={bmdcRegNo}
                  onChange={(e) => setBmdcRegNo(e.target.value)}
                  placeholder="A-12345"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm font-mono focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Chamber / Room Number *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="Room 102 (2nd Floor)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Visiting Start Time *
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Visiting End Time *
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="05:00 PM"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Max Daily Patients Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={maxDailyPatients}
                  onChange={(e) => setMaxDailyPatients(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Save Profile Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingProfile}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {savingProfile ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ─── Card 3: Password & Security ─── */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
            <p className="text-xs text-slate-500">Ensure your account security with a strong password</p>
          </div>
        </div>

        {passSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{passSuccess}</span>
          </div>
        )}

        {passError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{passError}</span>
          </div>
        )}

        <form onSubmit={handleSavePassword} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Current Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {savingPassword ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

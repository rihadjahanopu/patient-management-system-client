/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/typedef */
'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Upload, CheckCircle2, AlertCircle, Stethoscope, Megaphone, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { useClinicSetting } from '@/hooks/useClinicSetting';

export default function PublicHomePageSettings() {
  const { setting, refreshSetting } = useClinicSetting();
  const [publicClinicName, setPublicClinicName] = useState<string>('SmartCare');
  const [publicTagline, setPublicTagline] = useState<string>('Public OPD Serial & Live Tracking Portal');
  const [publicLogoUrl, setPublicLogoUrl] = useState<string>('');
  const [publicLogoBase64, setPublicLogoBase64] = useState<string>('');
  const [publicAnnouncement, setPublicAnnouncement] = useState<string>('');
  const [showPublicAnnouncement, setShowPublicAnnouncement] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (setting) {
      setPublicClinicName(setting.publicClinicName || setting.clinicName || 'SmartCare');
      setPublicTagline(setting.publicTagline || 'Public OPD Serial & Live Tracking Portal');
      setPublicLogoUrl(setting.publicLogoUrl || '');
      setPublicAnnouncement(setting.publicAnnouncement || '');
      setShowPublicAnnouncement(Boolean(setting.showPublicAnnouncement));
    }
  }, [setting]);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Logo image must be smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPublicLogoBase64(base64);
      setPublicLogoUrl(base64); // Live preview
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload: Record<string, any> = {
        publicClinicName: publicClinicName.trim() || 'SmartCare',
        publicTagline: publicTagline.trim() || 'Public OPD Serial & Live Tracking Portal',
        publicAnnouncement: publicAnnouncement.trim(),
        showPublicAnnouncement,
      };

      if (publicLogoBase64) {
        payload.publicLogoBase64 = publicLogoBase64;
      } else {
        payload.publicLogoUrl = publicLogoUrl;
      }

      const res: any = await api.settings.updateClinic(payload);
      if (res && res.success) {
        setSuccess('Public Home Page settings updated successfully!');
        setPublicLogoBase64('');
        await refreshSetting();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update public home page settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-600" /> Public Home Page Branding & Notice Banner
          </h3>
          <p className="text-xs text-slate-500 max-w-xl">
            Configure the public patient portal (`/`) header name, logo image, hero subtitle, and live announcement notice banner.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setShowPublicAnnouncement(true)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              showPublicAnnouncement
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" /> Notice ON
          </button>
          <button
            type="button"
            onClick={() => setShowPublicAnnouncement(false)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              !showPublicAnnouncement
                ? 'bg-slate-300 text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Notice OFF
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {success}
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" /> {error}
        </div>
      )}

      <form onSubmit={(e) => { void handleSave(e); }} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Public Portal Title / Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={publicClinicName}
                onChange={(e) => setPublicClinicName(e.target.value)}
                placeholder="e.g. SmartCare, Apollo OPD Portal"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Public Hero Subtitle / Tagline
              </label>
              <input
                type="text"
                value={publicTagline}
                onChange={(e) => setPublicTagline(e.target.value)}
                placeholder="e.g. Public OPD Serial & Live Tracking Portal"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white font-medium"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Upload Public Home Page Logo Image
              </label>
              <div className="flex items-center gap-3">
                <label className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2 shadow-sm transition-all active:scale-95">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  Choose Public Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                </label>
                {publicLogoUrl && (
                  <button
                    type="button"
                    onClick={() => { setPublicLogoUrl(''); setPublicLogoBase64(''); }}
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                If left empty, falls back to main Clinic Logo or Stethoscope Icon.
              </p>
            </div>

            {/* Public Notice Announcement */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                Live Patient Announcement Notice Banner
              </label>
              <textarea
                rows={2}
                value={publicAnnouncement}
                onChange={(e) => setPublicAnnouncement(e.target.value)}
                placeholder="e.g. Notice: OPD Chamber will remain open till 8:00 PM today. Emergency contact: +880 1700-000000"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 bg-white font-medium"
              />
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-5 rounded-2xl bg-slate-950 text-white border border-slate-800 space-y-4">
            <div className="text-[11px] uppercase tracking-wider font-extrabold text-amber-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Live Public Home Page Header Preview
            </div>

            {/* Simulated Header */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {publicLogoUrl ? (
                  <img
                    src={publicLogoUrl}
                    alt={publicClinicName}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0 shadow-md"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-white tracking-tight">
                      {publicClinicName || 'SmartCare'}
                    </span>
                    <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full uppercase">
                      Live Queue
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    {publicTagline || 'Public OPD Serial & Live Tracking Portal'}
                  </span>
                </div>
              </div>
            </div>

            {/* Announcement Banner Preview */}
            {showPublicAnnouncement && publicAnnouncement && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md animate-fadeIn">
                <Megaphone className="w-4 h-4 shrink-0 text-slate-950 animate-bounce" />
                <span className="line-clamp-2">{publicAnnouncement}</span>
              </div>
            )}

            <div className="text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-amber-300">
                Notice Status: {showPublicAnnouncement ? '🟢 Announcement Banner Visible on Home Page' : '🔴 Announcement Banner Hidden'}
              </p>
              <p>Patients on the home page will see the exact branding and live announcement configured here.</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            {saving ? 'Saving Public Page Settings...' : 'Save Public Home Page Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

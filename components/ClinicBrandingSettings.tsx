/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/typedef */
'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Upload, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { useClinicSetting } from '@/hooks/useClinicSetting';

export default function ClinicBrandingSettings() {
  const { setting, refreshSetting } = useClinicSetting();
  const [clinicName, setClinicName] = useState<string>('SmartCare Clinic');
  const [tagline, setTagline] = useState<string>('SmartCare Clinic Suite');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (setting) {
      setClinicName(setting.clinicName || 'SmartCare Clinic');
      setTagline(setting.tagline || 'SmartCare Clinic Suite');
      setLogoUrl(setting.logoUrl || '');
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
      setLogoBase64(base64);
      setLogoUrl(base64); // Live preview
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
        clinicName: clinicName.trim() || 'SmartCare Clinic',
        tagline: tagline.trim() || 'SmartCare Clinic Suite',
      };

      if (logoBase64) {
        payload.logoBase64 = logoBase64;
      } else {
        payload.logoUrl = logoUrl;
      }

      const res: any = await api.settings.updateClinic(payload);
      if (res && res.success) {
        setSuccess('Clinic branding updated successfully!');
        setLogoBase64('');
        await refreshSetting();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update clinic branding.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!window.confirm('Reset clinic name and logo to default SmartCare settings?')) return;
    setSaving(true);
    try {
      const res: any = await api.settings.updateClinic({
        clinicName: 'SmartCare Clinic',
        tagline: 'SmartCare Clinic Suite',
        logoUrl: '',
      });
      if (res && res.success) {
        setClinicName('SmartCare Clinic');
        setTagline('SmartCare Clinic Suite');
        setLogoUrl('');
        setLogoBase64('');
        setSuccess('Reset to default SmartCare branding!');
        await refreshSetting();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" /> Clinic Name & Custom Logo Settings
          </h3>
          <p className="text-xs text-slate-500 max-w-xl">
            Customize the clinic name, logo image, and tagline across the system. Default SmartCare branding is used as fallback when no logo is set.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { void handleResetToDefault(); }}
          disabled={saving}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Reset to Default
        </button>
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
                Clinic Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="e.g. SmartCare Clinic, Apollo Care"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Clinic Subtitle / Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Excellence in Healthcare"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white font-medium"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Upload Custom Clinic Logo Image
              </label>
              <div className="flex items-center gap-3">
                <label className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2 shadow-sm transition-all active:scale-95">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  Choose Logo File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => { setLogoUrl(''); setLogoBase64(''); }}
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                PNG, JPG, SVG or WEBP (Max 5MB). Square or circular icon recommended.
              </p>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3">
            <div className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-400 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" /> Sidebar Header Preview
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={clinicName}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0 shadow-md"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              )}
              <div className="truncate">
                <h4 className="font-extrabold text-slate-100 text-base leading-tight truncate flex items-center gap-1.5">
                  {clinicName || 'SmartCare Clinic'}
                  <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Admin
                  </span>
                </h4>
                <p className="text-xs text-slate-400 truncate">{tagline || 'SmartCare Clinic Suite'}</p>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">
                Fallback Status: {logoUrl ? '🎨 Custom Logo Active' : '🛡️ Default SmartCare Icon (Fallback Active)'}
              </p>
              <p>When custom logo is removed or empty, the default icon automatically renders as fallback.</p>
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
            <Building2 className="w-4 h-4" />
            {saving ? 'Saving Branding Settings...' : 'Save Clinic Branding Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/typedef */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface ClinicSettingData {
  clinicName: string;
  logoUrl?: string;
  tagline?: string;
  publicClinicName?: string;
  publicLogoUrl?: string;
  publicTagline?: string;
  publicAnnouncement?: string;
  showPublicAnnouncement?: boolean;
}

const DEFAULT_SETTING: ClinicSettingData = {
  clinicName: 'SmartCare Clinic',
  logoUrl: '',
  tagline: 'SmartCare Clinic Suite',
  publicClinicName: 'SmartCare',
  publicLogoUrl: '',
  publicTagline: 'Public OPD Serial & Live Tracking Portal',
  publicAnnouncement: '',
  showPublicAnnouncement: false,
};

const CACHE_KEY = 'clinic_setting_cache';

export function useClinicSetting() {
  const [setting, setSetting] = useState<ClinicSettingData>(DEFAULT_SETTING);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSetting = useCallback(async (): Promise<void> => {
    try {
      const res: any = await api.settings.getClinic();
      if (res && res.setting) {
        const fresh: ClinicSettingData = {
          ...res.setting,
          clinicName: res.setting.clinicName || 'SmartCare Clinic',
          logoUrl: res.setting.logoUrl || '',
          tagline: res.setting.tagline || 'SmartCare Clinic Suite',
          publicClinicName: res.setting.publicClinicName || 'SmartCare',
          publicLogoUrl: res.setting.publicLogoUrl || '',
          publicTagline: res.setting.publicTagline || 'Public OPD Serial & Live Tracking Portal',
          publicAnnouncement: res.setting.publicAnnouncement || '',
          showPublicAnnouncement: Boolean(res.setting.showPublicAnnouncement),
        };
        setSetting(fresh);
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
        }
      }
    } catch {
      // Keep cached or default if backend unreachable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          setSetting(JSON.parse(cached));
        } catch {
          // ignore
        }
      }
    }
    void fetchSetting();
  }, [fetchSetting]);

  return {
    setting,
    loading,
    refreshSetting: fetchSetting,
    clinicName: setting.clinicName || 'SmartCare Clinic',
    logoUrl: setting.logoUrl || '',
    tagline: setting.tagline || 'SmartCare Clinic Suite',
    publicClinicName: setting.publicClinicName || setting.clinicName || 'SmartCare',
    publicLogoUrl: setting.publicLogoUrl || setting.logoUrl || '',
    publicTagline: setting.publicTagline || 'Public OPD Serial & Live Tracking Portal',
    publicAnnouncement: setting.publicAnnouncement || '',
    showPublicAnnouncement: Boolean(setting.showPublicAnnouncement),
  };
}

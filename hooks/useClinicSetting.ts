/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
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
  enableTimeSlot?: boolean;
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
  enableTimeSlot: true,
};

const CACHE_KEY: string = 'clinic_setting_cache';

export function useClinicSetting() {
  const [setting, setSetting] = useState<ClinicSettingData>(DEFAULT_SETTING);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSetting: () => Promise<void> = useCallback(async (): Promise<void> => {
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
          enableTimeSlot: res.setting.enableTimeSlot !== false,
        };
        setSetting(fresh);
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
          localStorage.setItem('time_slot_enabled', fresh.enableTimeSlot ? 'true' : 'false');
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
      const cached: string | null = localStorage.getItem(CACHE_KEY);
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
    enableTimeSlot: setting.enableTimeSlot !== false,
  };
}

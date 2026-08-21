'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

export interface QueueState {
  doctorId: string;
  date: string;
  currentServingSerial: number | null;
  currentServingPatient: string | null;
  currentServingId: string | null;
  nextSerial: number | null;
  nextPatient: string | null;
  waitingCount: number;
  completedCount: number;
  totalCount: number;
  queue: any[];
  loading: boolean;
  error: string | null;
  lastUpdated: string;

  // Actions
  setDoctorAndDate: (doctorId: string, date: string) => void;
  fetchQueue: (doctorId?: string, date?: string) => Promise<void>;
  updateAppointmentStatus: (id: string, status: string) => Promise<void>;
  bookAppointment: (data: Record<string, any>) => Promise<any>;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  doctorId: '',
  date: new Date().toISOString().split('T')[0],
  currentServingSerial: null,
  currentServingPatient: null,
  currentServingId: null,
  nextSerial: null,
  nextPatient: null,
  waitingCount: 0,
  completedCount: 0,
  totalCount: 0,
  queue: [],
  loading: false,
  error: null,
  lastUpdated: '',

  setDoctorAndDate: (doctorId: string, date: string) => {
    set({ doctorId, date });
    get().fetchQueue(doctorId, date);
  },

  fetchQueue: async (targetDocId?: string, targetDate?: string) => {
    let docId = targetDocId || get().doctorId;
    const dt = targetDate || get().date;

    // Auto-resolve default doctor ID if missing
    if (!docId) {
      try {
        const docRes = await api.doctors.getAll();
        if (docRes.doctors && docRes.doctors.length > 0) {
          docId = docRes.doctors[0]._id;
          set({ doctorId: docId });
        }
      } catch (err) {
        console.warn('Could not auto-fetch doctor ID:', err);
      }
    }

    if (!docId || !dt) return;

    set({ loading: true, error: null });

    try {
      const data = await api.appointments.getQueue(docId, dt);
      const queueList = data.queue || [];

      const currentServing = queueList.find((a: any) => a.status === 'In Progress') || null;
      const pendingList = queueList.filter((a: any) => a.status === 'Pending');
      const nextUp = pendingList[0] || null;

      set({
        currentServingSerial: currentServing?.serialNumber ?? null,
        currentServingPatient: currentServing?.patientName ?? null,
        currentServingId: currentServing?._id ?? null,
        nextSerial: nextUp?.serialNumber ?? null,
        nextPatient: nextUp?.patientName ?? null,
        waitingCount: pendingList.length,
        completedCount: queueList.filter((a: any) => a.status === 'Completed').length,
        totalCount: queueList.length,
        queue: queueList,
        loading: false,
        lastUpdated: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load queue', loading: false });
    }
  },

  updateAppointmentStatus: async (id: string, status: string) => {
    try {
      await api.appointments.updateStatus(id, status);
      // Immediately refresh Zustand queue state
      await get().fetchQueue();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  bookAppointment: async (data: Record<string, any>) => {
    try {
      const res = await api.appointments.create(data);
      // Immediately refresh Zustand queue state
      await get().fetchQueue();
      return res;
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },
}));

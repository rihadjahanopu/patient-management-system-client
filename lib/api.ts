// Centralized API client for the Next.js frontend
// Reads JWT authentication token from Cookies
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  // Read token from Cookie (or fallback to localStorage)
  return Cookies.get('token') || localStorage.getItem('token');
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

async function request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;
  const token = getToken();

  let url = `${BASE_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    url = `${url}?${qs}`;
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(fetchOptions.headers || {}),
  };

  const response = await fetch(url, { ...fetchOptions, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `HTTP error ${response.status}`);
  }

  return data as T;
}

// ─── Auth ────────────────────────────────────────────────────
export const api = {
  auth: {
    login: (email: string, password: string) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me: () => request('/auth/me'),
    register: (data: Record<string, any>) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    getAllUsers: () => request('/auth/users'),
    toggleUser: (id: string) =>
      request(`/auth/users/${id}/toggle`, { method: 'PATCH' }),
    updateProfile: (data: Record<string, any>) =>
      request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      request('/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }),
    uploadAvatar: (image: string) =>
      request('/auth/avatar', { method: 'POST', body: JSON.stringify({ image }) }),
    registerRequest: (data: Record<string, any>) =>
      request('/auth/register-request', { method: 'POST', body: JSON.stringify(data) }),
    approveUser: (id: string) =>
      request(`/auth/users/${id}/approve`, { method: 'PATCH' }),
    updateUserRole: (id: string, role: string) =>
      request(`/auth/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  },

  // ─── Doctors ────────────────────────────────────────────────
  doctors: {
    getAll: () => request('/doctors'),
    getById: (id: string) => request(`/doctors/${id}`),
    updateProfile: (data: Record<string, any>) =>
      request('/doctors/profile', { method: 'PUT', body: JSON.stringify(data) }),
    updateDoctor: (id: string, data: Record<string, any>) =>
      request(`/doctors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  // ─── Appointments ────────────────────────────────────────────
  appointments: {
    create: (data: Record<string, any>) =>
      request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
    getById: (id: string) => request(`/appointments/${id}`),
    getQueue: (doctorId: string, date: string) =>
      request(`/appointments/queue/${doctorId}/${date}`),
    getTodayQueue: (doctorId: string) => request(`/appointments/today/${doctorId}`),
    updateStatus: (id: string, status: string) =>
      request(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    cancel: (id: string) =>
      request(`/appointments/${id}/cancel`, { method: 'PATCH' }),
    track: (appointmentId: string) =>
      request(`/appointments/track/${appointmentId}`),
  },

  // ─── Prescriptions ───────────────────────────────────────────
  prescriptions: {
    getAll: (params?: Record<string, string>) =>
      request('/prescriptions', { params }),
    create: (data: Record<string, any>) =>
      request('/prescriptions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, any>) =>
      request(`/prescriptions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    finalize: (id: string) =>
      request(`/prescriptions/${id}/finalize`, { method: 'PATCH' }),
    getByAppointment: (appointmentId: string) =>
      request(`/prescriptions/appointment/${appointmentId}`),
    getDoctorHistory: (params?: Record<string, string>) =>
      request('/prescriptions/doctor/history', { params }),
    delete: (id: string) =>
      request(`/prescriptions/${id}`, { method: 'DELETE' }),
  },

  // ─── Clinic Settings ──────────────────────────────────────────
  settings: {
    getClinic: () => request('/settings/clinic'),
    updateClinic: (data: Record<string, any>) =>
      request('/settings/clinic', { method: 'PUT', body: JSON.stringify(data) }),
  },

  // ─── Custom Medicines (Sync Engine) ──────────────────────────
  // These hit the backend MongoDB directly (source of truth)
  customMedicines: {
    getAll: () => request('/medicines/custom'),
    create: (data: {
      brandName: string;
      generic: string;
      dosageForm?: string;
      strength?: string;
      manufacturer?: string;
      type?: string;
    }) => request('/medicines/custom', { method: 'POST', body: JSON.stringify(data) }),
    remove: (brandName: string) =>
      request('/medicines/custom', { method: 'DELETE', body: JSON.stringify({ brandName }) }),
  },

  // ─── Medical Tests Registry (Lab Investigations) ─────────────
  medicalTests: {
    getAll: () => request('/tests'),
    create: (data: {
      testName: string;
      category?: string;
      price?: number;
      instructions?: string;
    }) => request('/tests', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, any>) =>
      request(`/tests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request(`/tests/${id}`, { method: 'DELETE' }),
  },
};

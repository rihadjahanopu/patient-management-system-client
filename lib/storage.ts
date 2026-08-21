import { Appointment, Prescription } from './types';

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-101',
    tokenNumber: '01',
    patientName: 'Rahim Uddin',
    age: 45,
    gender: 'Male',
    phone: '+880 1711-234567',
    date: new Date().toISOString().split('T')[0],
    slot: '09:00 AM - 09:30 AM',
    status: 'Completed',
    reason: 'High blood pressure checkup',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'apt-102',
    tokenNumber: '02',
    patientName: 'Nasrin Sultana',
    age: 32,
    gender: 'Female',
    phone: '+880 1819-876543',
    date: new Date().toISOString().split('T')[0],
    slot: '09:30 AM - 10:00 AM',
    status: 'Inside',
    reason: 'Persistent seasonal cough and fever',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'apt-103',
    tokenNumber: '03',
    patientName: 'Tariqul Islam',
    age: 28,
    gender: 'Male',
    phone: '+880 1912-345678',
    date: new Date().toISOString().split('T')[0],
    slot: '10:00 AM - 10:30 AM',
    status: 'Waiting',
    reason: 'Gastric discomfort & acidity',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'apt-104',
    tokenNumber: '04',
    patientName: 'Anwara Begum',
    age: 60,
    gender: 'Female',
    phone: '+880 1611-998877',
    date: new Date().toISOString().split('T')[0],
    slot: '10:30 AM - 11:00 AM',
    status: 'Waiting',
    reason: 'Joint pain & arthritis follow-up',
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'apt-105',
    tokenNumber: '05',
    patientName: 'Kabir Hasan',
    age: 38,
    gender: 'Male',
    phone: '+880 1515-443322',
    date: new Date().toISOString().split('T')[0],
    slot: '11:00 AM - 11:30 AM',
    status: 'Waiting',
    reason: 'Headache & migraine symptoms',
    createdAt: new Date(Date.now() - 900000).toISOString()
  }
];

const APPOINTMENTS_KEY = 'doctor_app_appointments';
const PRESCRIPTIONS_KEY = 'doctor_app_prescriptions';

export function getAppointments(): Appointment[] {
  if (typeof window === 'undefined') return INITIAL_APPOINTMENTS;
  try {
    const stored = localStorage.getItem(APPOINTMENTS_KEY);
    if (!stored) {
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(INITIAL_APPOINTMENTS));
      return INITIAL_APPOINTMENTS;
    }
    return JSON.parse(stored);
  } catch {
    return INITIAL_APPOINTMENTS;
  }
}

export function saveAppointments(appointments: Appointment[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
  } catch (err) {
    console.error('Failed to save appointments to localStorage', err);
  }
}

export function addAppointment(appointmentData: Omit<Appointment, 'id' | 'tokenNumber' | 'createdAt' | 'status'>): Appointment {
  const appointments = getAppointments();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === todayStr);

  const nextTokenNum = (todayAppointments.length + 1).toString().padStart(2, '0');
  
  const newAppointment: Appointment = {
    ...appointmentData,
    id: `apt-${Date.now()}`,
    tokenNumber: nextTokenNum,
    status: 'Waiting',
    createdAt: new Date().toISOString(),
  };

  const updated = [...appointments, newAppointment];
  saveAppointments(updated);
  return newAppointment;
}

export function updateAppointmentStatus(id: string, status: Appointment['status']): Appointment[] {
  const appointments = getAppointments();
  const updated = appointments.map(apt => {
    if (apt.id === id) {
      return { ...apt, status };
    }
    return apt;
  });
  saveAppointments(updated);
  return updated;
}

export function getPrescriptions(): Prescription[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(PRESCRIPTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function savePrescription(prescription: Prescription): void {
  if (typeof window === 'undefined') return;
  try {
    const prescriptions = getPrescriptions();
    const existingIndex = prescriptions.findIndex(p => p.id === prescription.id || p.appointmentId === prescription.appointmentId);
    let updated: Prescription[];
    if (existingIndex >= 0) {
      updated = [...prescriptions];
      updated[existingIndex] = prescription;
    } else {
      updated = [prescription, ...prescriptions];
    }
    localStorage.setItem(PRESCRIPTIONS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save prescription', err);
  }
}

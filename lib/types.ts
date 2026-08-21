export interface RawMedicine {
  "brand id": number;
  "brand name": string;
  "type": string;
  "slug": string;
  "dosage form": string;
  "generic": string;
  "strength": string;
  "manufacturer": string;
  "package container": string;
  "Package Size": string;
}

export interface Medicine {
  id: number;
  brandName: string;
  type: string;
  dosageForm: string;
  generic: string;
  strength: string;
  manufacturer: string;
}

export type AppointmentStatus = "Waiting" | "Inside" | "Completed" | "Cancelled";

export interface Appointment {
  id: string;
  tokenNumber: string;
  patientName: string;
  age: number | string;
  gender: "Male" | "Female" | "Other";
  phone: string;
  date: string;
  slot: string;
  status: AppointmentStatus;
  reason?: string;
  createdAt: string;
}

export interface Vitals {
  bp: string;
  pulse: string;
  weight: string;
  temp: string;
  spo2?: string;
}

export interface PrescribedMedicine {
  id: string;
  brandName: string;
  generic: string;
  dosageForm: string;
  strength: string;
  frequency: string;
  timing: string;
  duration: string;
  instructions?: string;
}

export interface MedicalTest {
  id?: string;
  _id?: string;
  testName: string;
  category: string;
  price: number;
  instructions?: string;
  isActive?: boolean;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  tokenNumber: string;
  patientName: string;
  age: number | string;
  gender: string;
  phone: string;
  date: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorRegNo: string;
  vitals: Vitals;
  complaints: string;
  clinicalNotes: string;
  diagnosis: string;
  medicines: PrescribedMedicine[];
  labTests?: string[];
  advice: string;
  followUpDate: string;
}

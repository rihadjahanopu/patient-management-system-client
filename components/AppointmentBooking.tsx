'use client';

import React, { useState } from 'react';
import { Calendar, User, Phone, Clock, FileText, CheckCircle2, Ticket, ArrowRight } from 'lucide-react';
import { Appointment } from '@/lib/types';
import { addAppointment } from '@/lib/storage';

interface AppointmentBookingProps {
  onAppointmentBooked: (newApt: Appointment) => void;
  onGoToQueue: () => void;
}

export default function AppointmentBooking({ onAppointmentBooked, onGoToQueue }: AppointmentBookingProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    phone: '',
    date: todayStr,
    slot: '10:00 AM - 10:30 AM',
    reason: '',
  });

  const [bookedToken, setBookedToken] = useState<Appointment | null>(null);

  const slots = [
    '09:00 AM - 09:30 AM',
    '09:30 AM - 10:00 AM',
    '10:00 AM - 10:30 AM',
    '10:30 AM - 11:00 AM',
    '11:00 AM - 11:30 AM',
    '11:30 AM - 12:00 PM',
    '05:00 PM - 05:30 PM',
    '05:30 PM - 06:00 PM',
    '06:00 PM - 06:30 PM',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientName || !formData.phone || !formData.age) {
      alert('Please fill in required patient details (Name, Age, Phone).');
      return;
    }

    const newApt = addAppointment({
      patientName: formData.patientName,
      age: formData.age,
      gender: formData.gender,
      phone: formData.phone,
      date: formData.date,
      slot: formData.slot,
      reason: formData.reason || 'General Health Checkup',
    });

    setBookedToken(newApt);
    onAppointmentBooked(newApt);

    // Reset form
    setFormData({
      patientName: '',
      age: '',
      gender: 'Male',
      phone: '',
      date: todayStr,
      slot: '10:00 AM - 10:30 AM',
      reason: '',
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Page Header */}
      <div className="mb-8 text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Book Doctor Appointment
        </h2>
        <p className="text-slate-600 text-sm mt-1">
          Select date and time slot to instantly generate your appointment queue token.
        </p>
      </div>

      {bookedToken ? (
        /* Confirmation Card */
        <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-6 sm:p-8 text-center max-w-xl mx-auto animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Appointment Booked Successfully!</h3>
          <p className="text-slate-500 text-sm mt-1">Your appointment token has been issued below</p>

          {/* Token Box */}
          <div className="my-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-inner border border-slate-700">
            <div className="flex items-center justify-center space-x-2 text-emerald-400 font-semibold text-sm tracking-wider uppercase">
              <Ticket className="w-4 h-4" />
              <span>Serial Token Number</span>
            </div>
            <div className="text-6xl font-black tracking-widest text-emerald-400 my-2">
              #{bookedToken.tokenNumber}
            </div>
            <div className="text-xs text-slate-300 border-t border-slate-700/80 pt-3 mt-3 flex justify-around">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Patient</span>
                <span className="font-semibold">{bookedToken.patientName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Slot</span>
                <span className="font-semibold">{bookedToken.slot}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Status</span>
                <span className="font-semibold text-emerald-400">{bookedToken.status}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
            <button
              onClick={() => setBookedToken(null)}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors text-sm"
            >
              Book Another Patient
            </button>
            <button
              onClick={onGoToQueue}
              className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors text-sm flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20"
            >
              <span>View Queue Tracker</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Booking Form */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section 1: Patient Info */}
            <div>
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center space-x-2">
                <User className="w-5 h-5 text-emerald-600" />
                <span>Patient Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Ahmed"
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="+880 1700-000000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    placeholder="e.g. 34"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm bg-white transition-all"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Date & Slot Selection */}
            <div>
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <span>Appointment Date & Time</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Primary Symptoms / Reason
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fever, Headache, Routine Consult"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Available Time Slots
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setFormData({ ...formData, slot })}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        formData.slot === slot
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-400/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center space-x-2 text-sm"
              >
                <span>Confirm & Issue Serial Token</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}

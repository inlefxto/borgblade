import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Service {
  id: string;
  name: string;
  category: string;
  duration_mins: number;
  price: number;
}

interface Staff {
  id: string;
  name: string;
  role: string;
  photo_url: string | null;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedService?: Service | null;
}

const serviceDescriptions: Record<string, string> = {
  'Haircut (Clipper)': 'Clean clipper cut styled to your preference',
  'Skinfade Haircut': 'Seamless fade from skin to length',
  'Scissors Classic Haircut': 'Precision scissor cut for a refined look',
  'Long Scissors Haircut': 'Scissor cut tailored for longer hair',
  'Haircut + Wash & Style': 'Full service including wash and finish',
  "Boy's Haircut (0-5 yrs)": 'Gentle cut for young ones',
  '+65 Haircut': 'Relaxed cut for senior clients',
  'Head Shave (Clipper)': 'Smooth clipper head shave',
  'Clean Head Shave': 'Razor clean head shave finish',
  'Hairstyling': 'Style and finish with premium products',
  'Beard Grooming': 'Shape and tidy your beard',
  'Beard Clean Shave': 'Full beard removal for a clean look',
  'Hot Towel Beard Grooming': 'Beard groom with hot towel treatment',
  'Premium Beard Clean Shave': 'Luxury shave with hot towel and aftercare',
  'Haircut & Skinfade': 'Haircut combined with a clean skin fade',
  'Haircut & Beard Trim': 'Full cut and beard tidy combo',
  'Skinfade & Beard Grooming': 'Fade and full beard grooming combo',
  'Skin Fade & Design': 'Fade with custom hair design detail',
  'Haircut, Eyebrows & Beard': 'Complete grooming package',
  'Full Service (Haircut + Facial + Eyebrows)': 'Head to toe premium grooming experience',
  'Eyebrows': 'Clean eyebrow shape and definition',
  'Eyebrows, Ears & Nose Waxing': 'Full facial waxing package',
  'Ears & Nose Waxing': 'Quick and clean waxing service',
};

const barberPhotos: Record<string, string> = {
  'Marco Borg': '/Marco.png',
  'Luca Farrugia': '/Luca.png',
  'Dylan Camilleri': '/Dylan.png',
};

const CATEGORY_LABELS: Record<string, string> = {
  haircuts: 'Haircuts',
  beard: 'Beard Grooming',
  combos: 'Combos',
  extras: 'Extras',
};

const CATEGORY_ORDER = ['haircuts', 'beard', 'combos', 'extras'];

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 9; h < 18; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  return remaining > 0 ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function BookingModal({ isOpen, onClose, preSelectedService }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);


  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  useEffect(() => {
    if (!isOpen) return;
    setSelectedStaff(null);
    setSelectedDate('');
    setSelectedTime('');
    setTimeSlots([]);
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setBookingError('');
    setErrors({});
    if (preSelectedService) {
      setSelectedService(preSelectedService);
      setStep(2);
    } else {
      setSelectedService(null);
      setStep(1);
    }
  }, [isOpen, preSelectedService]);

  useEffect(() => {
    // warm the schema cache
    supabase.from('bookings').select('id').limit(1);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLoadingData(true);
      Promise.all([
        supabase.from('services').select('id, name, duration_mins, price, category').order('category'),
        supabase.from('staff').select('*'),
      ]).then(([{ data: svcData }, { data: staffData }]) => {
        if (svcData) setServices(svcData);
        if (staffData) setStaff(staffData);
        setLoadingData(false);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === 3 && selectedStaff && selectedDate && selectedService) {
      setLoading(true);
      (async () => {
        const { data: existingBookings } = await supabase
          .from('bookings')
          .select('time_slot')
          .eq('staff_id', selectedStaff.id)
          .eq('booking_date', selectedDate)
          .neq('status', 'cancelled');

        const bookedSlots = (existingBookings || []).map(b =>
          String(b.time_slot).substring(0, 5)
        );

        const allSlots = generateTimeSlots();
        const now = new Date();
        const isToday = selectedDate === now.toLocaleDateString('en-CA');
        const slotDurationMins = 30;
        const slotsNeeded = Math.ceil(selectedService.duration_mins / slotDurationMins);

        const availableSlots = allSlots.filter(slot => {
          if (bookedSlots.includes(slot)) return false;
          if (isToday) {
            const [h, m] = slot.split(':').map(Number);
            const slotTime = new Date();
            slotTime.setHours(h, m, 0, 0);
            if (slotTime <= new Date(now.getTime() + 30 * 60 * 1000)) return false;
          }
          const slotIndex = allSlots.indexOf(slot);
          for (let i = 1; i < slotsNeeded; i++) {
            const nextSlot = allSlots[slotIndex + i];
            if (!nextSlot || bookedSlots.includes(nextSlot)) return false;
          }
          return true;
        });

        setTimeSlots(availableSlots);
        setLoading(false);
      })();
    }
  }, [step, selectedStaff, selectedDate, selectedService]);

  const handleConfirm = async () => {
    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime || !clientName || !clientEmail) return;
    setSubmitting(true);
    setBookingError('');
    console.log('Inserting:', clientName, clientEmail, selectedService, selectedStaff, selectedDate, selectedTime);
    await supabase.from('bookings').select('id').limit(1);
    const bookingRef = `BB-${Date.now()}`;
    const allSlots = generateTimeSlots();
    const slotIndex = allSlots.indexOf(selectedTime);
    const slotsNeeded = Math.ceil(selectedService.duration_mins / 30);
    const rows = Array.from({ length: slotsNeeded }, (_, i) => ({
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      service_id: selectedService.id,
      staff_id: selectedStaff.id,
      booking_date: selectedDate,
      time_slot: allSlots[slotIndex + i],
      booking_ref: bookingRef,
      status: 'confirmed',
    }));
    const { error } = await supabase.from('bookings').insert(rows);
    if (error) {
      console.error('Insert error:', JSON.stringify(error));
      setBookingError(error.message);
      setSubmitting(false);
      throw error;
    }
    const emailRes = await fetch('/api/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName,
        clientEmail,
        clientPhone,
        serviceName: selectedService.name,
        duration: formatDuration(selectedService.duration_mins),
        barberName: selectedStaff.name,
        date: selectedDate,
        time: selectedTime,
        bookingRef,
      }),
    });
    const emailData = await emailRes.json();
    if (emailData.reminderEmailId) {
      await supabase
        .from('bookings')
        .update({ reminder_email_id: emailData.reminderEmailId })
        .eq('booking_ref', bookingRef);
    }
    setStep(6);
    setSubmitting(false);
  };

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = services.filter((s) => s.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {} as Record<string, Service[]>);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const renderCalendar = () => {
    const { year, month } = calMonth;
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const blanks = firstDay === 0 ? 6 : firstDay - 1;
    const monthName = new Date(year, month, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' });

    const canPrev = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);

    return (
      <div style={{ userSelect: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button
            onClick={() => canPrev && setCalMonth(({ year: y, month: m }) => m === 0 ? { year: y - 1, month: 11 } : { year: y, month: m - 1 })}
            style={{ background: 'none', border: '1px solid #333', color: canPrev ? '#C9A84C' : '#333', width: 32, height: 32, cursor: canPrev ? 'pointer' : 'default', fontSize: 18 }}
          >‹</button>
          <span style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.1em', fontSize: '1.1rem', color: '#F2F2F2' }}>{monthName}</span>
          <button
            onClick={() => setCalMonth(({ year: y, month: m }) => m === 11 ? { year: y + 1, month: 0 } : { year: y, month: m + 1 })}
            style={{ background: 'none', border: '1px solid #333', color: '#C9A84C', width: 32, height: 32, cursor: 'pointer', fontSize: 18 }}
          >›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', color: '#888', letterSpacing: '0.05em', paddingBottom: 4 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {Array.from({ length: blanks }).map((_, i) => <div key={`b${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(year, month, day);
            const dateStr = formatDate(date);
            const dow = date.getDay();
            const isSelectable = [2, 3, 4, 5, 6].includes(dow) && date >= today;
            const isSelected = selectedDate === dateStr;
            const isPast = date < today;
            return (
              <button
                key={day}
                onClick={() => { if (isSelectable) { setSelectedDate(dateStr); setSelectedTime(''); } }}
                style={{
                  padding: '8px 4px',
                  background: isSelected ? '#C9A84C' : 'transparent',
                  color: isSelected ? '#0A0A0A' : isPast || !isSelectable ? '#333' : '#F2F2F2',
                  border: isSelected ? 'none' : '1px solid transparent',
                  cursor: isSelectable ? 'pointer' : 'default',
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? 700 : 400,
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => { if (isSelectable && !isSelected) (e.currentTarget as HTMLButtonElement).style.background = '#1e1e1e'; }}
                onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const validateDetails = () => {
    const newErrors: { name?: string; email?: string; phone?: string } = {};
    if (!clientName.trim()) newErrors.name = 'Please enter your full name';
    if (!clientEmail.trim()) newErrors.email = 'Please enter your email address';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) newErrors.email = 'Please enter a valid email address (e.g. name@example.com)';
    if (!clientPhone.trim()) newErrors.phone = 'Please enter your phone number';
    else if (clientPhone.replace(/\D/g, '').length < 8) newErrors.phone = 'Please enter a valid phone number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  if (!isOpen) return null;

  const stepLabels = ['Service', 'Barber', 'Date & Time', 'Details', 'Confirm'];

  const canNext =
    (step === 1 && !!selectedService) ||
    (step === 2 && !!selectedStaff) ||
    (step === 3 && !!selectedDate && !!selectedTime) ||
    step === 4;

  const Spinner = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
      <span style={{
        width: 28, height: 28,
        border: '2px solid #2a2a2a',
        borderTopColor: '#C9A84C',
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'spin 0.75s linear infinite',
      }} />
    </div>
  );

  return (
    <>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#111',
          border: '1px solid #222',
          width: '100%',
          maxWidth: 640,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px 0', borderBottom: '1px solid #1e1e1e', paddingBottom: 20, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', letterSpacing: '0.08em', color: '#F2F2F2', lineHeight: 1 }}>
                BORG <span style={{ color: '#C9A84C' }}>&</span> BLADE
              </p>
              <p style={{ fontSize: '0.72rem', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
                {step < 6 ? 'Book an Appointment' : 'Booking Confirmed'}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: '1px solid #333', color: '#888', width: 36, height: 36, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >×</button>
          </div>
          {step < 6 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              {stepLabels.map((label, i) => {
                const s = i + 1;
                const active = s === step;
                const done = s < step;
                return (
                  <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ height: 2, background: done || active ? '#C9A84C' : '#222', transition: 'background 0.3s' }} />
                    <span style={{ fontSize: '0.62rem', color: active ? '#C9A84C' : done ? '#888' : '#444', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {/* Step 1: Service */}
          {step === 1 && (
            <div>
              <p style={{ fontSize: '0.75rem', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Choose a Service</p>
              {loadingData ? <Spinner /> : CATEGORY_ORDER.filter((c) => grouped[c]).map((cat) => (
                <div key={cat} style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: '0.68rem', color: '#C9A84C', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>{CATEGORY_LABELS[cat]}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {grouped[cat].map((svc) => {
                      const sel = selectedService?.id === svc.id;
                      return (
                        <button
                          key={svc.id}
                          onClick={() => setSelectedService(svc)}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: sel ? 'rgba(201,168,76,0.08)' : '#181818',
                            border: sel ? '1px solid #C9A84C' : '1px solid #222',
                            padding: '14px 18px',
                            cursor: 'pointer',
                            transition: 'border-color 0.15s, background 0.15s',
                            textAlign: 'left',
                            width: '100%',
                          }}
                        >
                          <div>
                            <div style={{ color: '#F2F2F2', fontSize: '0.9rem', fontWeight: 500 }}>{svc.name}</div>
                            {serviceDescriptions[svc.name] && (
                              <div style={{ color: '#666', fontSize: '0.72rem', marginTop: 3, fontStyle: 'italic' }}>{serviceDescriptions[svc.name]}</div>
                            )}
                            <div style={{ color: '#888', fontSize: '0.72rem', marginTop: 4 }}>{formatDuration(svc.duration_mins)}</div>
                          </div>
                          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', color: '#C9A84C', flexShrink: 0, marginLeft: 16 }}>€{svc.price}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 2: Barber */}
          {step === 2 && (
            <div>
              <p style={{ fontSize: '0.75rem', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Choose a Barber</p>
              {loadingData ? <Spinner /> : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {staff.map((b) => {
                  const sel = selectedStaff?.id === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setSelectedStaff(b)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 16,
                        background: sel ? 'rgba(201,168,76,0.08)' : '#181818',
                        border: sel ? '1px solid #C9A84C' : '1px solid #222',
                        padding: '16px 20px',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, background 0.15s',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <div style={{ position: 'relative', flexShrink: 0, width: 60, height: 60 }}>
                        <img
                          src={barberPhotos[b.name] || b.photo_url || ''}
                          alt={b.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
                          }}
                          style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', border: sel ? '2px solid #C9A84C' : '2px solid #333', display: 'block' }}
                        />
                        <div
                          style={{
                            width: 60, height: 60, borderRadius: '50%',
                            background: '#1e1e1e',
                            border: sel ? '2px solid #C9A84C' : '2px solid #333',
                            position: 'absolute', top: 0, left: 0,
                            display: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#C9A84C',
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            fontFamily: 'DM Sans, sans-serif',
                          }}
                        >
                          {b.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#F2F2F2', fontSize: '0.95rem', fontWeight: 600 }}>{b.name}</div>
                        <div style={{ color: '#C9A84C', fontSize: '0.75rem', marginTop: 3, letterSpacing: '0.05em' }}>{b.role}</div>
                      </div>
                      {sel && <div style={{ marginLeft: 'auto', color: '#C9A84C', fontSize: 20 }}>✓</div>}
                    </button>
                  );
                })}
              </div>}
            </div>
          )}

          {/* Step 3: Date & Time */}
          {step === 3 && (
            <div>
              <p style={{ fontSize: '0.75rem', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Select Date & Time</p>
              <div style={{ background: '#181818', border: '1px solid #222', padding: '20px', marginBottom: 20 }}>
                {renderCalendar()}
              </div>
              {selectedDate && (
                <div>
                  <p style={{ fontSize: '0.68rem', color: '#C9A84C', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>
                    {formatDisplayDate(selectedDate)}
                  </p>
                  {loading ? (
                    <Spinner />
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      {timeSlots.map((slot) => {
                        const sel = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                            style={{
                              padding: '10px 0',
                              background: sel ? '#C9A84C' : '#181818',
                              border: sel ? 'none' : '1px solid #333',
                              color: sel ? '#0A0A0A' : '#F2F2F2',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: sel ? 700 : 400,
                              transition: 'all 0.15s',
                            }}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Details */}
          {step === 4 && (
            <div>
              <p style={{ fontSize: '0.75rem', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>Your Details</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Full Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => { setClientName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: undefined })); }}
                    placeholder="Your name"
                    style={{
                      width: '100%', padding: '12px 16px',
                      background: '#181818', border: `1px solid ${errors.name ? '#f87171' : '#333'}`,
                      color: '#F2F2F2', fontSize: '0.95rem',
                      outline: 'none', fontFamily: 'DM Sans, sans-serif',
                    }}
                  />
                  {errors.name && <p style={{ color: '#f87171', fontSize: '12px', marginTop: 6, fontFamily: 'DM Sans, sans-serif' }}>{errors.name}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Email Address</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => { setClientEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: undefined })); }}
                    placeholder="your@email.com"
                    style={{
                      width: '100%', padding: '12px 16px',
                      background: '#181818', border: `1px solid ${errors.email ? '#f87171' : '#333'}`,
                      color: '#F2F2F2', fontSize: '0.95rem',
                      outline: 'none', fontFamily: 'DM Sans, sans-serif',
                    }}
                  />
                  {errors.email && <p style={{ color: '#f87171', fontSize: '12px', marginTop: 6, fontFamily: 'DM Sans, sans-serif' }}>{errors.email}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={clientPhone}
                    onChange={(e) => { setClientPhone(e.target.value); if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined })); }}
                    style={{
                      width: '100%', padding: '12px 16px',
                      background: '#181818', border: `1px solid ${errors.phone ? '#f87171' : '#333'}`,
                      color: '#F2F2F2', fontSize: '0.95rem',
                      outline: 'none', fontFamily: 'DM Sans, sans-serif',
                    }}
                  />
                  {errors.phone && <p style={{ color: '#f87171', fontSize: '12px', marginTop: 6, fontFamily: 'DM Sans, sans-serif' }}>{errors.phone}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Confirm */}
          {step === 5 && selectedService && selectedStaff && (
            <div>
              <p style={{ fontSize: '0.75rem', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Booking Summary</p>
              <div style={{ background: '#181818', border: '1px solid #222', padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { label: 'Service', value: selectedService.name },
                    { label: 'Duration', value: formatDuration(selectedService.duration_mins) },
                    { label: 'Price', value: `€${selectedService.price}` },
                    { label: 'Barber', value: selectedStaff.name },
                    { label: 'Date', value: formatDisplayDate(selectedDate) },
                    { label: 'Time', value: selectedTime },
                    { label: 'Name', value: clientName },
                    { label: 'Email', value: clientEmail },
                    { label: 'Phone', value: clientPhone },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                      <span style={{ fontSize: '0.72rem', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>{label}</span>
                      <span style={{ fontSize: '0.9rem', color: '#F2F2F2', textAlign: 'right' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p style={{ color: '#888', fontSize: '12px', lineHeight: '1.6', margin: '0' }}>
                By confirming you agree to our cancellation policy: free cancellation up to 24 hours before your appointment. Cancellations within 24 hours must be made via your confirmation email or by phone.
              </p>
            </div>
          )}

          {/* Step 6: Success */}
          {step === 6 && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(201,168,76,0.1)', border: '2px solid #C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 28, color: '#C9A84C' }}>✓</div>
              <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', letterSpacing: '0.06em', color: '#F2F2F2', marginBottom: 24 }}>Booking Confirmed!</h2>
              <div style={{ background: '#181818', border: '1px solid #222', padding: '20px', marginBottom: 20, textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Service', value: selectedService?.name },
                    { label: 'Duration', value: selectedService ? formatDuration(selectedService.duration_mins) : '' },
                    { label: 'Price', value: `€${selectedService?.price}` },
                    { label: 'Barber', value: selectedStaff?.name },
                    { label: 'Date', value: formatDisplayDate(selectedDate) },
                    { label: 'Time', value: selectedTime },
                    { label: 'Name', value: clientName },
                    { label: 'Email', value: clientEmail },
                    { label: 'Phone', value: clientPhone },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, borderBottom: '1px solid #1e1e1e', paddingBottom: 10 }}>
                      <span style={{ fontSize: '0.7rem', color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>{label}</span>
                      <span style={{ color: '#F2F2F2', fontSize: '0.88rem', textAlign: 'right' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p style={{ color: '#C9A84C', fontSize: '0.82rem', lineHeight: 1.7, marginBottom: 8 }}>
                You will receive a confirmation shortly.
              </p>
              <p style={{ color: '#666', fontSize: '0.78rem', lineHeight: 1.7 }}>
                We look forward to seeing you!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 6 && (
          <div style={{ padding: '16px 28px', borderTop: '1px solid #1e1e1e', display: 'flex', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                style={{ background: 'transparent', border: '1px solid #333', color: '#888', padding: '12px 24px', cursor: 'pointer', fontSize: '0.82rem', letterSpacing: '0.08em', fontFamily: 'DM Sans, sans-serif', transition: 'border-color 0.2s, color 0.2s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#F2F2F2'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#F2F2F2'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#888'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#333'; }}
              >Back</button>
            ) : <div />}
            {step < 5 ? (
              <button
                onClick={() => {
                  if (!canNext) return;
                  if (step === 4 && !validateDetails()) return;
                  setStep((s) => s + 1);
                }}
                disabled={!canNext}
                style={{ background: canNext ? '#C9A84C' : '#1e1e1e', border: 'none', color: canNext ? '#0A0A0A' : '#444', padding: '12px 32px', cursor: canNext ? 'pointer' : 'default', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '0.08em', transition: 'background 0.2s' }}
              >Continue</button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                {bookingError && (
                  <p style={{ color: '#f87171', fontSize: '0.78rem', textAlign: 'right', maxWidth: 320 }}>{bookingError}</p>
                )}
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  style={{ background: submitting ? '#1e1e1e' : '#C9A84C', border: 'none', color: submitting ? '#888' : '#0A0A0A', padding: '12px 32px', cursor: submitting ? 'default' : 'pointer', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '0.08em', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: 10, minWidth: 180, justifyContent: 'center' }}
                >
                  {submitting && (
                    <span style={{ width: 14, height: 14, border: '2px solid #888', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  )}
                  {submitting ? 'Processing...' : 'Confirm Booking'}
                </button>
              </div>
            )}
          </div>
        )}
        {step === 6 && (
          <div style={{ padding: '16px 28px', borderTop: '1px solid #1e1e1e', flexShrink: 0 }}>
            <button
              onClick={onClose}
              style={{ width: '100%', background: '#C9A84C', border: 'none', color: '#0A0A0A', padding: '14px', cursor: 'pointer', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', letterSpacing: '0.1em' }}
            >Close</button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

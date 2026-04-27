import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Service {
  id: string;
  name: string;
  category: string;
  duration: string;
  price: number;
}

interface Staff {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function BookingModal({ isOpen, onClose }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setSelectedService(null);
    setSelectedStaff(null);
    setSelectedDate('');
    setSelectedTime('');
    setClientName('');
    setClientEmail('');
    setBookingRef('');
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      supabase.from('services').select('*').order('category').then(({ data }) => {
        if (data) setServices(data);
      });
      supabase.from('staff').select('*').then(({ data }) => {
        if (data) setStaff(data);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === 3 && selectedStaff && selectedDate) {
      setLoading(true);
      supabase
        .from('bookings')
        .select('booking_time')
        .eq('staff_id', selectedStaff.id)
        .eq('booking_date', selectedDate)
        .neq('status', 'cancelled')
        .then(({ data }) => {
          setBookedSlots(data ? data.map((b) => b.booking_time) : []);
          setLoading(false);
        });
    }
  }, [step, selectedStaff, selectedDate]);

  const handleConfirm = async () => {
    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime || !clientName || !clientEmail) return;
    setSubmitting(true);
    const ref = 'BB-' + Math.floor(10000 + Math.random() * 90000);
    const { error } = await supabase.from('bookings').insert({
      client_name: clientName,
      client_email: clientEmail,
      service_id: selectedService.id,
      staff_id: selectedStaff.id,
      booking_date: selectedDate,
      booking_time: selectedTime,
      status: 'pending',
    });
    if (!error) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string;
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-confirmation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'Apikey': supabaseKey,
          },
          body: JSON.stringify({
            clientName,
            clientEmail,
            serviceName: selectedService.name,
            barberName: selectedStaff.name,
            date: selectedDate,
            time: selectedTime,
            price: selectedService.price,
            duration: selectedService.duration,
            ref,
          }),
        });
      } catch (_) {}
      setBookingRef(ref);
      setStep(6);
    }
    setSubmitting(false);
  };

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = services.filter((s) => s.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {} as Record<string, Service[]>);

  const timeSlots = generateTimeSlots();

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

  if (!isOpen) return null;

  const stepLabels = ['Service', 'Barber', 'Date & Time', 'Details', 'Confirm'];

  const canNext =
    (step === 1 && !!selectedService) ||
    (step === 2 && !!selectedStaff) ||
    (step === 3 && !!selectedDate && !!selectedTime) ||
    (step === 4 && clientName.trim().length > 1 && /\S+@\S+\.\S+/.test(clientEmail));

  return (
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
              {CATEGORY_ORDER.filter((c) => grouped[c]).map((cat) => (
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
                            <div style={{ color: '#888', fontSize: '0.75rem', marginTop: 2 }}>{svc.duration}</div>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                      <img
                        src={b.avatar}
                        alt={b.name}
                        style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: sel ? '2px solid #C9A84C' : '2px solid #333', flexShrink: 0 }}
                      />
                      <div>
                        <div style={{ color: '#F2F2F2', fontSize: '0.95rem', fontWeight: 600 }}>{b.name}</div>
                        <div style={{ color: '#C9A84C', fontSize: '0.75rem', marginTop: 3, letterSpacing: '0.05em' }}>{b.role}</div>
                      </div>
                      {sel && <div style={{ marginLeft: 'auto', color: '#C9A84C', fontSize: 20 }}>✓</div>}
                    </button>
                  );
                })}
              </div>
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
                    <p style={{ color: '#888', fontSize: '0.85rem' }}>Loading available slots...</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      {timeSlots.map((slot) => {
                        const booked = bookedSlots.includes(slot);
                        const sel = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => !booked && setSelectedTime(slot)}
                            style={{
                              padding: '10px 0',
                              background: sel ? '#C9A84C' : booked ? '#111' : '#181818',
                              border: sel ? 'none' : booked ? '1px solid #1a1a1a' : '1px solid #333',
                              color: sel ? '#0A0A0A' : booked ? '#333' : '#F2F2F2',
                              cursor: booked ? 'default' : 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: sel ? 700 : 400,
                              textDecoration: booked ? 'line-through' : 'none',
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
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Your name"
                    style={{
                      width: '100%', padding: '12px 16px',
                      background: '#181818', border: '1px solid #333',
                      color: '#F2F2F2', fontSize: '0.95rem',
                      outline: 'none', fontFamily: 'DM Sans, sans-serif',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Email Address</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="your@email.com"
                    style={{
                      width: '100%', padding: '12px 16px',
                      background: '#181818', border: '1px solid #333',
                      color: '#F2F2F2', fontSize: '0.95rem',
                      outline: 'none', fontFamily: 'DM Sans, sans-serif',
                    }}
                  />
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
                    { label: 'Duration', value: selectedService.duration },
                    { label: 'Price', value: `€${selectedService.price}` },
                    { label: 'Barber', value: selectedStaff.name },
                    { label: 'Date', value: formatDisplayDate(selectedDate) },
                    { label: 'Time', value: selectedTime },
                    { label: 'Name', value: clientName },
                    { label: 'Email', value: clientEmail },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                      <span style={{ fontSize: '0.72rem', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>{label}</span>
                      <span style={{ fontSize: '0.9rem', color: '#F2F2F2', textAlign: 'right' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p style={{ color: '#888', fontSize: '0.78rem', marginTop: 16, lineHeight: 1.6 }}>
                By confirming you agree to our cancellation policy. A confirmation email will be sent to {clientEmail}.
              </p>
            </div>
          )}

          {/* Step 6: Success */}
          {step === 6 && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(201,168,76,0.1)', border: '2px solid #C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 28, color: '#C9A84C' }}>✓</div>
              <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', letterSpacing: '0.06em', color: '#F2F2F2', marginBottom: 8 }}>Booking Confirmed</h2>
              <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: 24 }}>Reference: <span style={{ color: '#C9A84C', fontWeight: 600 }}>{bookingRef}</span></p>
              <div style={{ background: '#181818', border: '1px solid #222', padding: '20px', marginBottom: 24, textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Service</span>
                    <span style={{ color: '#F2F2F2', fontSize: '0.9rem' }}>{selectedService?.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Barber</span>
                    <span style={{ color: '#F2F2F2', fontSize: '0.9rem' }}>{selectedStaff?.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Date & Time</span>
                    <span style={{ color: '#F2F2F2', fontSize: '0.9rem' }}>{formatDisplayDate(selectedDate)} at {selectedTime}</span>
                  </div>
                </div>
              </div>
              <p style={{ color: '#888', fontSize: '0.82rem', lineHeight: 1.7 }}>
                A confirmation email has been sent to <span style={{ color: '#F2F2F2' }}>{clientEmail}</span>.<br />
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
                onClick={() => canNext && setStep((s) => s + 1)}
                disabled={!canNext}
                style={{ background: canNext ? '#C9A84C' : '#1e1e1e', border: 'none', color: canNext ? '#0A0A0A' : '#444', padding: '12px 32px', cursor: canNext ? 'pointer' : 'default', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '0.08em', transition: 'background 0.2s' }}
              >Continue</button>
            ) : (
              <button
                onClick={handleConfirm}
                disabled={submitting}
                style={{ background: submitting ? '#1e1e1e' : '#C9A84C', border: 'none', color: submitting ? '#444' : '#0A0A0A', padding: '12px 32px', cursor: submitting ? 'default' : 'pointer', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '0.08em', transition: 'background 0.2s' }}
              >{submitting ? 'Confirming...' : 'Confirm Booking'}</button>
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
  );
}

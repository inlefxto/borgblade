import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface Booking {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  booking_date: string;
  time_slot: string;
  status: string;
  staff_id: string;
  service_id: string;
  services: { name: string; duration_mins: number } | null;
  staff: { name: string } | null;
}

interface Service {
  id: string;
  name: string;
  category: string;
  duration_mins: number;
}

const BARBERS = [
  { id: 'ce5de67b-1424-4d20-85c9-328cdba2f434', name: 'Marco Borg' },
  { id: '68e0e021-ed78-4845-b209-a698863fe365', name: 'Luca Farrugia' },
  { id: '1d09e6ce-30d4-496e-99af-3dff8f830820', name: 'Dylan Camilleri' },
];

const TIME_SLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','14:00','14:30','15:00',
  '15:30','16:00','16:30','17:00','17:30','18:00','18:30',
];

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).toUpperCase();
}

function todayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + n);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const r = mins % 60;
  return r > 0 ? `${h} hr ${r} min` : `${h} hr`;
}

// ── Add Booking Modal ─────────────────────────────────────────────────────────

interface AddBookingModalProps {
  barberId: string;
  barberName: string;
  selectedDate: string;
  bookedSlots: string[];
  services: Service[];
  onClose: () => void;
  onAdded: () => void;
}

function AddBookingModal({ barberId, barberName, selectedDate, bookedSlots, services, onClose, onAdded }: AddBookingModalProps) {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const available = TIME_SLOTS.filter(s => !bookedSlots.includes(s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !serviceId || !timeSlot) {
      setError('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    setError('');
    const ref = 'BB-' + Math.floor(10000 + Math.random() * 90000);
    const { error: err } = await supabase.from('bookings').insert({
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      client_email: clientEmail.trim(),
      service_id: serviceId,
      staff_id: barberId,
      booking_date: selectedDate,
      time_slot: timeSlot,
      status: 'confirmed',
      booking_ref: ref,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onAdded();
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: '#181818',
    border: '1px solid #2a2a2a', color: '#F2F2F2', fontSize: '0.88rem',
    outline: 'none', fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.65rem', color: '#C9A84C',
    letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6,
  };

  const grouped = services.reduce<Record<string, Service[]>>((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s);
    return acc;
  }, {});
  const catLabels: Record<string, string> = { haircuts: 'Haircuts', beard: 'Beard Grooming', combos: 'Combos', extras: 'Extras' };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#111', border: '1px solid #2a2a2a', width: '100%', maxWidth: 460,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #1e1e1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', letterSpacing: '0.08em', color: '#F2F2F2' }}>Add Booking</div>
            <div style={{ fontSize: '0.72rem', color: '#666', marginTop: 2 }}>{barberName} &middot; {selectedDate}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.1rem', padding: 4, lineHeight: 1 }}>&#x2715;</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Client Name *</label>
              <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Full name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+356 ..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@email.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Service *</label>
              <select
                value={serviceId}
                onChange={e => setServiceId(e.target.value)}
                style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none' }}
              >
                <option value="">Select a service</option>
                {Object.entries(grouped).map(([cat, svcs]) => (
                  <optgroup key={cat} label={catLabels[cat] || cat}>
                    {svcs.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({formatDuration(s.duration_mins)})</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Time Slot *</label>
              {available.length === 0 ? (
                <p style={{ color: '#f87171', fontSize: '0.82rem' }}>No available slots for this day.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {available.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      style={{
                        padding: '8px 4px',
                        background: timeSlot === slot ? '#C9A84C' : '#181818',
                        border: `1px solid ${timeSlot === slot ? '#C9A84C' : '#2a2a2a'}`,
                        color: timeSlot === slot ? '#0A0A0A' : '#F2F2F2',
                        fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                        transition: 'all 0.15s',
                      }}
                    >{slot}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {error && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: 14 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '11px', background: 'none', border: '1px solid #2a2a2a',
                color: '#777', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem',
              }}
            >Cancel</button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 2, padding: '11px', background: '#C9A84C', border: 'none',
                color: '#0A0A0A', cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '0.08em',
                opacity: saving ? 0.6 : 1,
              }}
            >{saving ? 'Saving...' : 'Confirm Booking'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Booking Card ──────────────────────────────────────────────────────────────

interface BookingCardProps {
  booking: Booking;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  updating: string | null;
}

function BookingCard({ booking, onComplete, onCancel, updating }: BookingCardProps) {
  const isUpdating = updating === booking.id;
  const statusStyles: Record<string, { bg: string; border: string; text: string }> = {
    confirmed: { bg: 'rgba(201,168,76,0.08)', border: '#C9A84C33', text: '#C9A84C' },
    completed: { bg: 'rgba(74,222,128,0.08)', border: '#4ade8033', text: '#4ade80' },
    cancelled:  { bg: 'rgba(248,113,113,0.08)', border: '#f8717133', text: '#f87171' },
  };
  const ss = statusStyles[booking.status] || statusStyles.confirmed;

  return (
    <div style={{
      background: booking.status === 'completed' ? 'rgba(74,222,128,0.03)' : '#0e0e0e',
      border: `1px solid ${booking.status === 'completed' ? '#4ade8018' : '#1e1e1e'}`,
      padding: '13px 14px',
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.15rem', letterSpacing: '0.06em', color: '#F2F2F2' }}>
          {booking.time_slot}
        </span>
        <span style={{
          padding: '2px 8px', fontSize: '0.63rem', letterSpacing: '0.1em',
          textTransform: 'capitalize', background: ss.bg, border: `1px solid ${ss.border}`, color: ss.text,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>{booking.status}</span>
      </div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 500, color: '#F2F2F2' }}>{booking.client_name}</div>
        {booking.client_phone && (
          <div style={{ fontSize: '0.74rem', color: '#777', marginTop: 2 }}>{booking.client_phone}</div>
        )}
      </div>

      {booking.services && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: '0.76rem', color: '#C9A84C' }}>{booking.services.name}</div>
          <div style={{ fontSize: '0.7rem', color: '#555', marginTop: 1 }}>{formatDuration(booking.services.duration_mins)}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        {booking.status !== 'completed' && (
          <button
            onClick={() => onComplete(booking.id)}
            disabled={isUpdating}
            style={{
              flex: 1, padding: '6px 0', background: 'none', border: '1px solid #4ade8022',
              color: '#4ade80', fontSize: '0.68rem', letterSpacing: '0.08em',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans, sans-serif', opacity: isUpdating ? 0.4 : 1,
            }}
            onMouseEnter={e => { if (!isUpdating) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(74,222,128,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
          >Complete</button>
        )}
        {booking.status !== 'cancelled' && (
          <button
            onClick={() => onCancel(booking.id)}
            disabled={isUpdating}
            style={{
              flex: 1, padding: '6px 0', background: 'none', border: '1px solid #f8717122',
              color: '#f87171', fontSize: '0.68rem', letterSpacing: '0.08em',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans, sans-serif', opacity: isUpdating ? 0.4 : 1,
            }}
            onMouseEnter={e => { if (!isUpdating) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
          >Cancel</button>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('bb_admin_auth') === '1');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [addModal, setAddModal] = useState<{ barberId: string; barberName: string } | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
      sessionStorage.setItem('bb_admin_auth', '1');
      setAuthed(true);
      setLoginError('');
    } else {
      setLoginError('Incorrect password.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('bb_admin_auth');
    setAuthed(false);
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('*, services(name, duration_mins), staff(name)')
      .eq('booking_date', selectedDate)
      .neq('status', 'cancelled')
      .order('time_slot');
    if (data) setBookings(data as Booking[]);
    setLoading(false);
  }, [selectedDate]);

  const fetchServices = useCallback(async () => {
    const { data } = await supabase
      .from('services')
      .select('id, name, category, duration_mins')
      .order('category')
      .order('name');
    if (data) setServices(data as Service[]);
  }, []);

  useEffect(() => {
    if (authed) {
      fetchBookings();
      fetchServices();
    }
  }, [authed, fetchBookings, fetchServices]);

  // ── Login screen ──────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0A0A0A',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'DM Sans, sans-serif',
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        `}</style>
        <div style={{ width: '100%', maxWidth: 380, padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.8rem', letterSpacing: '0.08em', color: '#F2F2F2', lineHeight: 1, marginBottom: 20 }}>
              BORG <span style={{ color: '#C9A84C' }}>&</span> BLADE
            </h1>
            <div style={{ width: 40, height: 1, background: '#C9A84C', margin: '0 auto 16px' }} />
            <p style={{ color: '#444', fontSize: '0.68rem', letterSpacing: '0.22em', textTransform: 'uppercase' }}>Admin Dashboard</p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.65rem', color: '#C9A84C', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
                style={{
                  width: '100%', padding: '12px 16px',
                  background: '#111', border: '1px solid #222',
                  color: '#F2F2F2', fontSize: '0.9rem', outline: 'none',
                  fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#C9A84C'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#222'; }}
              />
            </div>
            {loginError && (
              <p style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: 14 }}>{loginError}</p>
            )}
            <button
              type="submit"
              style={{
                width: '100%', background: '#C9A84C', border: 'none',
                color: '#0A0A0A', padding: '13px',
                fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.05rem', letterSpacing: '0.12em',
                cursor: 'pointer', transition: 'background 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E2C170'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#C9A84C'; }}
            >Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  const byBarber = BARBERS.reduce<Record<string, Booking[]>>((acc, b) => {
    acc[b.id] = bookings.filter(bk => bk.staff_id === b.id);
    return acc;
  }, {});

  const bookedSlotsByBarber = BARBERS.reduce<Record<string, string[]>>((acc, b) => {
    acc[b.id] = (byBarber[b.id] || []).map(bk => bk.time_slot);
    return acc;
  }, {});

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    await supabase.from('bookings').update({ status }).eq('id', id);
    if (status === 'cancelled') {
      setBookings(prev => prev.filter(b => b.id !== id));
    } else {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    }
    setUpdating(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @media (max-width: 900px) {
          .admin-cols { flex-direction: column !important; }
          .admin-col { width: 100% !important; }
        }
        @media (max-width: 600px) {
          .admin-header-inner { padding: 0 16px !important; }
          .admin-main { padding: 12px 16px !important; }
          .date-nav { padding: 12px 16px !important; }
          .date-label { font-size: 0.88rem !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: '#0c0c0c', borderBottom: '1px solid #1a1a1a' }}>
        <div
          className="admin-header-inner"
          style={{ maxWidth: 1360, margin: '0 auto', padding: '0 32px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.25rem', letterSpacing: '0.08em', color: '#F2F2F2' }}>
              BORG <span style={{ color: '#C9A84C' }}>&</span> BLADE
            </span>
            <span style={{ color: '#252525', fontSize: '1rem' }}>|</span>
            <span style={{ color: '#444', fontSize: '0.66rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Admin</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: '#444', fontSize: '0.72rem', marginRight: 4 }}>
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <button
              onClick={fetchBookings}
              style={{ background: 'none', border: '1px solid #1e1e1e', color: '#555', padding: '5px 14px', cursor: 'pointer', fontSize: '0.7rem', letterSpacing: '0.08em', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#F2F2F2'; e.currentTarget.style.borderColor = '#444'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#1e1e1e'; }}
            >Refresh</button>
            <button
              onClick={handleLogout}
              style={{ background: 'none', border: '1px solid #1e1e1e', color: '#555', padding: '5px 14px', cursor: 'pointer', fontSize: '0.7rem', letterSpacing: '0.08em', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = '#f8717122'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#1e1e1e'; }}
            >Sign Out</button>
          </div>
        </div>
      </div>

      {/* Date navigation */}
      <div className="date-nav" style={{ background: '#0a0a0a', borderBottom: '1px solid #161616', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
        <button
          onClick={() => setSelectedDate(d => addDays(d, -1))}
          style={{ background: 'none', border: '1px solid #1e1e1e', color: '#666', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', transition: 'all 0.15s', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#666'; }}
          aria-label="Previous day"
        >&#8249;</button>

        <div style={{ textAlign: 'center', minWidth: 280 }}>
          <div
            className="date-label"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.05rem', letterSpacing: '0.18em', color: '#F2F2F2' }}
          >
            {formatDisplayDate(selectedDate)}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#444', letterSpacing: '0.06em', marginTop: 3 }}>
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
            {selectedDate === todayStr() && (
              <span style={{ color: '#C9A84C', marginLeft: 10, letterSpacing: '0.1em' }}>TODAY</span>
            )}
          </div>
        </div>

        <button
          onClick={() => setSelectedDate(d => addDays(d, 1))}
          style={{ background: 'none', border: '1px solid #1e1e1e', color: '#666', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', transition: 'all 0.15s', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#666'; }}
          aria-label="Next day"
        >&#8250;</button>
      </div>

      {/* Three-column layout */}
      <div className="admin-main" style={{ maxWidth: 1360, margin: '0 auto', padding: '20px 32px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#333', fontSize: '0.82rem', letterSpacing: '0.12em' }}>
            Loading...
          </div>
        ) : (
          <div className="admin-cols" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            {BARBERS.map(barber => {
              const barberBookings = byBarber[barber.id] || [];
              return (
                <div
                  key={barber.id}
                  className="admin-col"
                  style={{ flex: 1, minWidth: 0, background: '#0c0c0c', border: '1px solid #181818' }}
                >
                  {/* Column header */}
                  <div style={{
                    padding: '15px 16px', borderBottom: '1px solid #181818',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '0.1em', color: '#F2F2F2' }}>
                        {barber.name}
                      </div>
                      <div style={{ fontSize: '0.66rem', color: '#444', marginTop: 2 }}>
                        {barberBookings.length} booking{barberBookings.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', background: barberBookings.length > 0 ? '#C9A84C' : '#1e1e1e',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.85rem',
                      color: barberBookings.length > 0 ? '#0A0A0A' : '#444',
                      transition: 'all 0.2s',
                    }}>
                      {barberBookings.length}
                    </div>
                  </div>

                  {/* Cards */}
                  <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {barberBookings.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '36px 16px', color: '#2a2a2a', fontSize: '0.78rem', letterSpacing: '0.05em' }}>
                        No bookings for this day
                      </div>
                    ) : (
                      barberBookings.map(booking => (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          onComplete={id => updateStatus(id, 'completed')}
                          onCancel={id => updateStatus(id, 'cancelled')}
                          updating={updating}
                        />
                      ))
                    )}
                  </div>

                  {/* Add booking button */}
                  <div style={{ padding: '10px', borderTop: '1px solid #161616' }}>
                    <button
                      onClick={() => setAddModal({ barberId: barber.id, barberName: barber.name })}
                      style={{
                        width: '100%', padding: '9px', background: 'none',
                        border: '1px dashed #222', color: '#444',
                        fontSize: '0.72rem', letterSpacing: '0.1em', cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C55'; e.currentTarget.style.color = '#C9A84C'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.color = '#444'; }}
                    >
                      <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>+</span> Add Booking
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add booking modal */}
      {addModal && (
        <AddBookingModal
          barberId={addModal.barberId}
          barberName={addModal.barberName}
          selectedDate={selectedDate}
          bookedSlots={bookedSlotsByBarber[addModal.barberId] || []}
          services={services}
          onClose={() => setAddModal(null)}
          onAdded={fetchBookings}
        />
      )}
    </div>
  );
}

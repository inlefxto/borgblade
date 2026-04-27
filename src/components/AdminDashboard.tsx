import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Booking {
  id: string;
  client_name: string;
  client_email: string;
  booking_date: string;
  booking_time: string;
  status: string;
  created_at: string;
  services: { name: string; price: number; duration: string } | null;
  staff: { name: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#C9A84C',
  completed: '#4ade80',
  cancelled: '#f87171',
};

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
      setAuthed(true);
      setError('');
    } else {
      setError('Incorrect password.');
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('*, services(name, price, duration), staff(name)')
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false });
    if (data) setBookings(data as Booking[]);
    setLoading(false);
  };

  useEffect(() => {
    if (authed) fetchBookings();
  }, [authed]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    await supabase.from('bookings').update({ status }).eq('id', id);
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    setUpdating(null);
  };

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  };

  if (!authed) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'DM Sans, sans-serif',
      }}>
        <div style={{ width: '100%', maxWidth: 400, padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', letterSpacing: '0.08em', color: '#F2F2F2' }}>
              BORG <span style={{ color: '#C9A84C' }}>&</span> BLADE
            </h1>
            <p style={{ color: '#888', fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 6 }}>Admin Dashboard</p>
          </div>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                style={{
                  width: '100%', padding: '12px 16px',
                  background: '#181818', border: '1px solid #333',
                  color: '#F2F2F2', fontSize: '0.95rem',
                  outline: 'none', fontFamily: 'DM Sans, sans-serif',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {error && <p style={{ color: '#f87171', fontSize: '0.82rem', marginBottom: 16 }}>{error}</p>}
            <button
              type="submit"
              style={{
                width: '100%', background: '#C9A84C', border: 'none', color: '#0A0A0A',
                padding: '14px', cursor: 'pointer', fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '1.1rem', letterSpacing: '0.1em',
              }}
            >Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Top bar */}
      <div style={{ background: '#111', borderBottom: '1px solid #222', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', letterSpacing: '0.08em', color: '#F2F2F2', textDecoration: 'none' }}>
            BORG <span style={{ color: '#C9A84C' }}>&</span> BLADE
          </a>
          <span style={{ color: '#333', fontSize: '1.2rem' }}>|</span>
          <span style={{ color: '#888', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admin</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={fetchBookings}
            style={{ background: 'none', border: '1px solid #333', color: '#888', padding: '8px 16px', cursor: 'pointer', fontSize: '0.78rem', letterSpacing: '0.08em', fontFamily: 'DM Sans, sans-serif' }}
          >Refresh</button>
          <button
            onClick={() => setAuthed(false)}
            style={{ background: 'none', border: '1px solid #333', color: '#888', padding: '8px 16px', cursor: 'pointer', fontSize: '0.78rem', letterSpacing: '0.08em', fontFamily: 'DM Sans, sans-serif' }}
          >Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
          {[
            { label: 'Total Bookings', value: stats.total, color: '#F2F2F2' },
            { label: 'Pending', value: stats.pending, color: '#C9A84C' },
            { label: 'Completed', value: stats.completed, color: '#4ade80' },
            { label: 'Cancelled', value: stats.cancelled, color: '#f87171' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#111', border: '1px solid #222', padding: '20px 24px' }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.72rem', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #222' }}>
          {(['all', 'pending', 'completed', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: 'none', border: 'none', padding: '10px 20px',
                color: filter === f ? '#F2F2F2' : '#666',
                fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.95rem', letterSpacing: '0.08em',
                cursor: 'pointer', textTransform: 'capitalize',
                borderBottom: filter === f ? '2px solid #C9A84C' : '2px solid transparent',
                marginBottom: -1,
                transition: 'color 0.2s',
              }}
            >{f === 'all' ? 'All Bookings' : f}</button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Loading bookings...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: '#444', fontSize: '0.9rem' }}>No bookings found.</p>
          </div>
        ) : (
          <div style={{ background: '#111', border: '1px solid #222', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #222' }}>
                    {['Date', 'Time', 'Client', 'Email', 'Service', 'Barber', 'Status', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.65rem', color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((booking, i) => (
                    <tr
                      key={booking.id}
                      style={{ borderBottom: '1px solid #1a1a1a', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
                    >
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#F2F2F2', whiteSpace: 'nowrap' }}>
                        {new Date(booking.booking_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#F2F2F2', whiteSpace: 'nowrap' }}>{booking.booking_time}</td>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#F2F2F2', whiteSpace: 'nowrap' }}>{booking.client_name}</td>
                      <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#888', whiteSpace: 'nowrap' }}>{booking.client_email}</td>
                      <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#F2F2F2' }}>
                        <div style={{ whiteSpace: 'nowrap' }}>{booking.services?.name ?? '—'}</div>
                        {booking.services && <div style={{ color: '#C9A84C', fontSize: '0.75rem', marginTop: 2 }}>€{booking.services.price} · {booking.services.duration}</div>}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#F2F2F2', whiteSpace: 'nowrap' }}>{booking.staff?.name ?? '—'}</td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px',
                          background: `${STATUS_COLORS[booking.status]}18`,
                          border: `1px solid ${STATUS_COLORS[booking.status]}44`,
                          color: STATUS_COLORS[booking.status],
                          fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'capitalize',
                        }}>{booking.status}</span>
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {booking.status !== 'completed' && (
                            <button
                              onClick={() => updateStatus(booking.id, 'completed')}
                              disabled={updating === booking.id}
                              style={{ background: 'none', border: '1px solid #4ade8044', color: '#4ade80', padding: '5px 10px', cursor: 'pointer', fontSize: '0.7rem', letterSpacing: '0.08em', fontFamily: 'DM Sans, sans-serif', opacity: updating === booking.id ? 0.5 : 1 }}
                            >Done</button>
                          )}
                          {booking.status !== 'cancelled' && (
                            <button
                              onClick={() => updateStatus(booking.id, 'cancelled')}
                              disabled={updating === booking.id}
                              style={{ background: 'none', border: '1px solid #f8717144', color: '#f87171', padding: '5px 10px', cursor: 'pointer', fontSize: '0.7rem', letterSpacing: '0.08em', fontFamily: 'DM Sans, sans-serif', opacity: updating === booking.id ? 0.5 : 1 }}
                            >Cancel</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

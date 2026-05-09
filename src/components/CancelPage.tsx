import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Booking {
  id: string;
  booking_ref: string;
  booking_date: string;
  time_slot: string;
  status: string;
  client_name: string;
  services: { name: string } | null;
  staff: { name: string } | null;
}

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function isMoreThan24HoursAway(dateStr: string, timeStr: string): boolean {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = String(timeStr).substring(0, 5).split(':').map(Number);
  const apptTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return apptTime.getTime() - Date.now() > 24 * 60 * 60 * 1000;
}

type PageState = 'loading' | 'no-ref' | 'not-found' | 'already-cancelled' | 'cancellable' | 'too-late' | 'confirm' | 'cancelled';

export default function CancelPage() {
  const [searchParams] = useSearchParams();
  const bookingRef = searchParams.get('ref');

  const [state, setState] = useState<PageState>('loading');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    if (!bookingRef) {
      setState('no-ref');
      return;
    }

    (async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*, services(name), staff(name)')
        .eq('booking_ref', bookingRef)
        .maybeSingle();

      if (!data) {
        setState('not-found');
        return;
      }

      setBooking(data);

      if (data.status === 'cancelled') {
        setState('already-cancelled');
        return;
      }

      if (!isMoreThan24HoursAway(data.booking_date, data.time_slot)) {
        setState('too-late');
        return;
      }

      setState('cancellable');
    })();
  }, [bookingRef]);

  const handleCancelConfirm = async () => {
    if (!bookingRef) return;
    setCancelling(true);
    setCancelError('');
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('booking_ref', bookingRef);
    if (error) {
      setCancelError('Something went wrong. Please try again.');
      setCancelling(false);
      return;
    }
    setState('cancelled');
    setCancelling(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0A0A0A; color: #F2F2F2; font-family: 'DM Sans', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#0A0A0A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}>
        {/* Logo */}
        <a href="/" style={{ textDecoration: 'none', marginBottom: 48 }}>
          <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', letterSpacing: '0.08em', color: '#F2F2F2', lineHeight: 1 }}>
            BORG <span style={{ color: '#C9A84C' }}>&</span> BLADE
          </p>
          <p style={{ fontSize: '0.65rem', color: '#888', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4, textAlign: 'center' }}>
            ST. JULIAN&apos;S, MALTA
          </p>
        </a>

        <div style={{
          background: '#111',
          border: '1px solid #222',
          width: '100%',
          maxWidth: 520,
          padding: '40px 36px',
          animation: 'fadeUp 0.4s ease both',
        }}>

          {/* Loading */}
          {state === 'loading' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 28, height: 28, border: '2px solid #333', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ color: '#888', fontSize: '0.85rem', letterSpacing: '0.08em' }}>Looking up your booking...</p>
            </div>
          )}

          {/* No ref in URL */}
          {state === 'no-ref' && <InvalidState message="No booking reference found. Please use the link from your confirmation email." />}

          {/* Not found */}
          {state === 'not-found' && <InvalidState message="Booking not found. Please check your confirmation email." />}

          {/* Already cancelled */}
          {state === 'already-cancelled' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(248,113,113,0.1)', border: '2px solid #f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 24, color: '#f87171' }}>✕</div>
              <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', letterSpacing: '0.06em', color: '#F2F2F2', marginBottom: 12 }}>Already Cancelled</h2>
              <p style={{ color: '#888', fontSize: '0.88rem', lineHeight: 1.7 }}>This appointment has already been cancelled.</p>
              <p style={{ color: '#666', fontSize: '0.8rem', marginTop: 8 }}>Ref: {bookingRef}</p>
            </div>
          )}

          {/* Too close to cancel */}
          {(state === 'too-late') && booking && (
            <div>
              <p style={{ fontSize: '0.68rem', color: '#C9A84C', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 20 }}>Your Appointment</p>
              <BookingDetails booking={booking} />
              <div style={{ marginTop: 28, padding: '20px', background: '#181818', border: '1px solid #333' }}>
                <p style={{ color: '#F2F2F2', fontSize: '0.88rem', lineHeight: 1.7 }}>
                  Cancellations must be made at least 24 hours in advance.
                </p>
                <p style={{ color: '#888', fontSize: '0.82rem', marginTop: 8, lineHeight: 1.7 }}>
                  Please call us directly to cancel or reschedule.
                </p>
                <p style={{ color: '#C9A84C', fontSize: '0.85rem', fontWeight: 600, marginTop: 12 }}>+356 2134 5678</p>
              </div>
            </div>
          )}

          {/* Cancellable */}
          {state === 'cancellable' && booking && (
            <div>
              <p style={{ fontSize: '0.68rem', color: '#C9A84C', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 20 }}>Cancel Appointment</p>
              <BookingDetails booking={booking} />
              <button
                onClick={() => setState('confirm')}
                style={{
                  marginTop: 28, width: '100%',
                  background: '#C9A84C', border: 'none', color: '#0A0A0A',
                  padding: '14px', cursor: 'pointer',
                  fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.05rem', letterSpacing: '0.1em',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#E2C170')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#C9A84C')}
              >
                Cancel Appointment
              </button>
            </div>
          )}

          {/* Confirm cancellation */}
          {state === 'confirm' && booking && (
            <div>
              <p style={{ fontSize: '0.68rem', color: '#C9A84C', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 20 }}>Confirm Cancellation</p>
              <p style={{ color: '#F2F2F2', fontSize: '0.95rem', marginBottom: 8, lineHeight: 1.6 }}>Are you sure you want to cancel your appointment?</p>
              <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: 28, lineHeight: 1.6 }}>
                {booking.services?.name} with {booking.staff?.name} on {formatDisplayDate(booking.booking_date)} at {String(booking.time_slot).substring(0, 5)}
              </p>
              {cancelError && (
                <p style={{ color: '#f87171', fontSize: '0.78rem', marginBottom: 16 }}>{cancelError}</p>
              )}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setState('cancellable')}
                  disabled={cancelling}
                  style={{
                    flex: 1, background: 'transparent', border: '1px solid #333', color: '#888',
                    padding: '13px', cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', letterSpacing: '0.06em',
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#F2F2F2'; e.currentTarget.style.borderColor = '#F2F2F2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#333'; }}
                >
                  Go Back
                </button>
                <button
                  onClick={handleCancelConfirm}
                  disabled={cancelling}
                  style={{
                    flex: 1, background: cancelling ? '#1e1e1e' : '#C9A84C',
                    border: 'none', color: cancelling ? '#888' : '#0A0A0A',
                    padding: '13px', cursor: cancelling ? 'default' : 'pointer',
                    fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.05rem', letterSpacing: '0.1em',
                    transition: 'background 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {cancelling && (
                    <span style={{ width: 14, height: 14, border: '2px solid #888', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  )}
                  {cancelling ? 'Cancelling...' : 'Confirm'}
                </button>
              </div>
              <p style={{ color: '#888', fontSize: '12px', lineHeight: '1.6', margin: '16px 0 0' }}>
                By confirming you agree to our cancellation policy: free cancellation up to 24 hours before your appointment. Cancellations within 24 hours must be made via your confirmation email or by phone.
              </p>
            </div>
          )}

          {/* Success */}
          {state === 'cancelled' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(201,168,76,0.1)', border: '2px solid #C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 24, color: '#C9A84C' }}>✓</div>
              <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', letterSpacing: '0.06em', color: '#F2F2F2', marginBottom: 16 }}>Appointment Cancelled</h2>
              <p style={{ color: '#888', fontSize: '0.88rem', lineHeight: 1.8, marginBottom: 8 }}>
                Your appointment has been cancelled.
              </p>
              <p style={{ color: '#666', fontSize: '0.82rem', lineHeight: 1.8 }}>
                We hope to see you again soon.
              </p>
              <a
                href="/"
                style={{
                  display: 'block', marginTop: 28,
                  background: '#C9A84C', color: '#0A0A0A',
                  padding: '13px', textDecoration: 'none',
                  fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.05rem', letterSpacing: '0.1em',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#E2C170')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#C9A84C')}
              >
                Back to Website
              </a>
            </div>
          )}
        </div>

        <p style={{ marginTop: 32, fontSize: '0.72rem', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Borg &amp; Blade &nbsp;·&nbsp; St. Julian&apos;s, Malta
        </p>
      </div>
    </>
  );
}

function BookingDetails({ booking }: { booking: Booking }) {
  return (
    <div style={{ background: '#181818', border: '1px solid #222', padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[
        { label: 'Service', value: booking.services?.name ?? '—' },
        { label: 'Barber', value: booking.staff?.name ?? '—' },
        { label: 'Date', value: formatDisplayDate(booking.booking_date) },
        { label: 'Time', value: String(booking.time_slot).substring(0, 5) },
        { label: 'Reference', value: booking.booking_ref },
      ].map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <span style={{ fontSize: '0.68rem', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>{label}</span>
          <span style={{ fontSize: '0.88rem', color: label === 'Reference' ? '#C9A84C' : '#F2F2F2', textAlign: 'right' }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function InvalidState({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(136,136,136,0.1)', border: '2px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 24, color: '#666' }}>?</div>
      <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', letterSpacing: '0.06em', color: '#F2F2F2', marginBottom: 12 }}>Not Found</h2>
      <p style={{ color: '#888', fontSize: '0.88rem', lineHeight: 1.7 }}>{message}</p>
    </div>
  );
}

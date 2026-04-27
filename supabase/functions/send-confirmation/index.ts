import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BookingPayload {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  barberName: string;
  date: string;
  time: string;
  price: number;
  duration: string;
  ref: string;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload: BookingPayload = await req.json();
    const { clientName, clientEmail, serviceName, barberName, date, time, price, duration, ref } = payload;
    const formattedDate = formatDate(date);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");

    const clientHtml = `
      <div style="font-family: 'DM Sans', Arial, sans-serif; background: #0A0A0A; color: #F2F2F2; max-width: 600px; margin: 0 auto; padding: 0;">
        <div style="background: #111; border-bottom: 2px solid #C9A84C; padding: 32px 40px; text-align: center;">
          <h1 style="font-family: Arial Black, sans-serif; font-size: 28px; letter-spacing: 6px; color: #F2F2F2; margin: 0;">BORG &amp; <span style="color: #C9A84C;">BLADE</span></h1>
          <p style="color: #888; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 8px 0 0;">Booking Confirmation</p>
        </div>
        <div style="padding: 40px;">
          <p style="color: #888; font-size: 14px; margin-bottom: 24px;">Hi ${clientName},</p>
          <p style="color: #F2F2F2; font-size: 15px; line-height: 1.7; margin-bottom: 32px;">Your appointment at Borg &amp; Blade has been confirmed. We look forward to seeing you!</p>
          <div style="background: #181818; border: 1px solid #222; padding: 24px; margin-bottom: 32px;">
            <p style="color: #C9A84C; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 16px;">Booking Details</p>
            ${[
              ['Reference', ref],
              ['Service', serviceName],
              ['Duration', duration],
              ['Price', `€${price}`],
              ['Barber', barberName],
              ['Date', formattedDate],
              ['Time', time],
            ].map(([label, value]) => `
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #222;">
                <span style="color: #888; font-size: 13px;">${label}</span>
                <span style="color: #F2F2F2; font-size: 13px; font-weight: 600;">${value}</span>
              </div>
            `).join('')}
          </div>
          <div style="background: #181818; border: 1px solid #222; padding: 20px; margin-bottom: 32px;">
            <p style="color: #C9A84C; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 12px;">Location</p>
            <p style="color: #F2F2F2; font-size: 14px; line-height: 1.7; margin: 0;">Borg &amp; Blade Barbershop<br>12, Triq San Ġorġ<br>St. Julian's, Malta</p>
          </div>
          <p style="color: #888; font-size: 13px; line-height: 1.7;">If you need to cancel or reschedule, please contact us as soon as possible.</p>
        </div>
        <div style="background: #111; border-top: 1px solid #222; padding: 24px 40px; text-align: center;">
          <p style="color: #444; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Borg &amp; Blade Barbershop · St. Julian's, Malta</p>
        </div>
      </div>
    `;

    const adminHtml = `
      <div style="font-family: Arial, sans-serif; background: #0A0A0A; color: #F2F2F2; max-width: 600px; margin: 0 auto; padding: 0;">
        <div style="background: #111; border-bottom: 2px solid #C9A84C; padding: 24px 32px;">
          <h1 style="font-size: 22px; letter-spacing: 4px; color: #F2F2F2; margin: 0;">NEW BOOKING</h1>
          <p style="color: #888; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin: 6px 0 0;">Borg &amp; Blade</p>
        </div>
        <div style="padding: 32px;">
          <div style="background: #181818; border: 1px solid #222; padding: 20px;">
            ${[
              ['Reference', ref],
              ['Client Name', clientName],
              ['Client Email', clientEmail],
              ['Service', serviceName],
              ['Duration', duration],
              ['Price', `€${price}`],
              ['Barber', barberName],
              ['Date', formattedDate],
              ['Time', time],
            ].map(([label, value]) => `
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #222;">
                <span style="color: #888; font-size: 13px;">${label}</span>
                <span style="color: #F2F2F2; font-size: 13px; font-weight: 600;">${value}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    const [clientRes, adminRes] = await Promise.all([
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Borg & Blade <onboarding@resend.dev>',
          to: [clientEmail],
          subject: `Booking Confirmed – ${serviceName} on ${formattedDate}`,
          html: clientHtml,
        }),
      }),
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Borg & Blade <onboarding@resend.dev>',
          to: ['nicholaidebono@gmail.com'],
          subject: `New Booking: ${clientName} – ${serviceName} on ${formattedDate} at ${time}`,
          html: adminHtml,
        }),
      }),
    ]);

    if (!clientRes.ok || !adminRes.ok) {
      const clientErr = await clientRes.text();
      const adminErr = await adminRes.text();
      throw new Error(`Email send failed: client=${clientErr} admin=${adminErr}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

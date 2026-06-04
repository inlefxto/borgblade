import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    clientName, clientEmail, clientPhone,
    serviceName, duration, barberName,
    date, time, bookingRef
  } = req.body;

  const cancelUrl = `https://borgblade.com/cancel?ref=${bookingRef}`;

  // ── Confirmation email HTML ──────────────────────────────────────────────
  const confirmHtml = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#ffffff;font-size:28px;letter-spacing:4px;margin:0;">BORG &amp; BLADE</h1>
      <p style="color:#C9A84C;letter-spacing:2px;font-size:12px;margin:8px 0 0;">ST. JULIAN'S, MALTA</p>
    </div>
    <div style="background:#111;border:1px solid #222;padding:32px;">
      <h2 style="color:#C9A84C;font-size:14px;letter-spacing:3px;margin:0 0 24px;">BOOKING CONFIRMED</h2>
      <p style="color:#ffffff;font-size:16px;margin:0 0 24px;">Hi ${clientName},<br/>Your appointment is confirmed.</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #222;"><td style="color:#888;font-size:12px;padding:12px 0;">SERVICE</td><td style="color:#fff;font-size:14px;padding:12px 0;text-align:right;">${serviceName}</td></tr>
        <tr style="border-bottom:1px solid #222;"><td style="color:#888;font-size:12px;padding:12px 0;">DURATION</td><td style="color:#fff;font-size:14px;padding:12px 0;text-align:right;">${duration}</td></tr>
        <tr style="border-bottom:1px solid #222;"><td style="color:#888;font-size:12px;padding:12px 0;">BARBER</td><td style="color:#fff;font-size:14px;padding:12px 0;text-align:right;">${barberName}</td></tr>
        <tr style="border-bottom:1px solid #222;"><td style="color:#888;font-size:12px;padding:12px 0;">DATE</td><td style="color:#fff;font-size:14px;padding:12px 0;text-align:right;">${date}</td></tr>
        <tr style="border-bottom:1px solid #222;"><td style="color:#888;font-size:12px;padding:12px 0;">TIME</td><td style="color:#fff;font-size:14px;padding:12px 0;text-align:right;">${time}</td></tr>
        <tr style="border-bottom:1px solid #222;"><td style="color:#888;font-size:12px;padding:12px 0;">PHONE</td><td style="color:#fff;font-size:14px;padding:12px 0;text-align:right;">${clientPhone}</td></tr>
        <tr><td style="color:#888;font-size:12px;padding:12px 0;">REFERENCE</td><td style="color:#C9A84C;font-size:14px;padding:12px 0;text-align:right;">${bookingRef}</td></tr>
      </table>
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #222;text-align:center;">
        <a href="${cancelUrl}" style="display:inline-block;padding:12px 28px;border:1px solid #555;color:#aaa;text-decoration:none;font-size:12px;letter-spacing:2px;">CANCEL APPOINTMENT</a>
        <p style="color:#555;font-size:11px;margin:12px 0 0;">Free cancellation up to 24 hours before your appointment.</p>
      </div>
      <div style="margin-top:24px;text-align:center;">
        <p style="color:#888;font-size:12px;margin:0;">SHARP CUTS. NO COMPROMISES.</p>
        <p style="color:#555;font-size:11px;margin:8px 0 0;">Tue–Sat 09:00–19:00 · St. Julian's, Malta</p>
      </div>
    </div>
  </div>
  </body></html>`;

  // ── Reminder email HTML ──────────────────────────────────────────────────
  const reminderHtml = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#ffffff;font-size:28px;letter-spacing:4px;margin:0;">BORG &amp; BLADE</h1>
      <p style="color:#C9A84C;letter-spacing:2px;font-size:12px;margin:8px 0 0;">ST. JULIAN'S, MALTA</p>
    </div>
    <div style="background:#111;border:1px solid #222;padding:32px;">
      <h2 style="color:#C9A84C;font-size:14px;letter-spacing:3px;margin:0 0 24px;">APPOINTMENT TOMORROW</h2>
      <p style="color:#ffffff;font-size:16px;margin:0 0 24px;">Hi ${clientName},<br/>Just a reminder about your appointment tomorrow.</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #222;"><td style="color:#888;font-size:12px;padding:12px 0;">SERVICE</td><td style="color:#fff;font-size:14px;padding:12px 0;text-align:right;">${serviceName}</td></tr>
        <tr style="border-bottom:1px solid #222;"><td style="color:#888;font-size:12px;padding:12px 0;">BARBER</td><td style="color:#fff;font-size:14px;padding:12px 0;text-align:right;">${barberName}</td></tr>
        <tr style="border-bottom:1px solid #222;"><td style="color:#888;font-size:12px;padding:12px 0;">DATE</td><td style="color:#fff;font-size:14px;padding:12px 0;text-align:right;">${date}</td></tr>
        <tr><td style="color:#888;font-size:12px;padding:12px 0;">TIME</td><td style="color:#fff;font-size:14px;padding:12px 0;text-align:right;">${time}</td></tr>
      </table>
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #222;text-align:center;">
        <a href="${cancelUrl}" style="display:inline-block;padding:12px 28px;border:1px solid #555;color:#aaa;text-decoration:none;font-size:12px;letter-spacing:2px;">CANCEL APPOINTMENT</a>
        <p style="color:#555;font-size:11px;margin:12px 0 0;">Cancellations must be made at least 24 hours in advance.</p>
      </div>
      <div style="margin-top:24px;text-align:center;">
        <p style="color:#888;font-size:12px;margin:0;">We look forward to seeing you!</p>
        <p style="color:#555;font-size:11px;margin:8px 0 0;">Tue–Sat 09:00–19:00 · St. Julian's, Malta</p>
      </div>
    </div>
  </div>
  </body></html>`;

  // ── Send confirmation to client ──────────────────────────────────────────
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'bookings@borgblade.com',
      to: [clientEmail],
      subject: 'Booking Confirmed — Borg & Blade',
      html: confirmHtml,
    }),
  });

  // ── Send notification to owner ───────────────────────────────────────────
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'bookings@borgblade.com',
      to: ['nicholaidebono@gmail.com'],
      subject: `New Booking — ${clientName}`,
      html: `<p><strong>${clientName}</strong> (${clientEmail})<br>Phone: ${clientPhone}<br>Service: ${serviceName}<br>Barber: ${barberName}<br>Date: ${date} at ${time}<br>Ref: ${bookingRef}</p>`,
    }),
  });

  // ── Schedule reminder email 24hrs before appointment ────────────────────
  let reminderEmailId: string | null = null;

  try {
    const [y, m, d] = date.split('-').map(Number);
    const [h, min] = time.split(':').map(Number);
    const apptTime = new Date(Date.UTC(y, m - 1, d, h, min));
    const hoursUntil = (apptTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntil > 25) {
      const reminderTime = new Date(apptTime.getTime() - 24 * 60 * 60 * 1000);
      const reminderRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'bookings@borgblade.com',
          to: [clientEmail],
          subject: `Reminder — Your appointment tomorrow at ${time}`,
          html: reminderHtml,
          scheduledAt: reminderTime.toISOString(),
        }),
      });
      const reminderData = await reminderRes.json();
      reminderEmailId = reminderData.id ?? null;
    }
  } catch (e) {
    console.error('Reminder scheduling failed:', e);
  }

  res.status(200).json({ success: true, reminderEmailId });
}

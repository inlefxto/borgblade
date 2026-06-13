import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    clientName, clientEmail, clientPhone,
    serviceName, duration, barberName,
    date, time, bookingRef
  } = req.body;

  const cancelUrl = `https://borgblade.com/cancel?ref=${bookingRef}`;

  const confirmHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
  <body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif;">
  <span style="display:none;font-size:0;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">Your appointment at Borg &amp; Blade is confirmed.</span>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f0f0;"><tr><td align="center" style="padding:40px 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
  <tr><td align="center" bgcolor="#0a0a0a" style="background-color:#0a0a0a;padding:32px 32px 24px;">
    <p style="color:#ffffff;font-size:26px;letter-spacing:6px;margin:0;font-family:Georgia,serif;font-weight:bold;line-height:1;">BORG <span style="color:#C9A84C;">&amp;</span> BLADE</p>
    <p style="color:#C9A84C;letter-spacing:3px;font-size:10px;margin:8px 0 0;text-transform:uppercase;font-family:Arial,sans-serif;">St. Julian's, Malta</p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin:12px auto 0;"><tr><td width="40" height="1" bgcolor="#C9A84C" style="background-color:#C9A84C;font-size:0;line-height:0;">&nbsp;</td></tr></table>
  </td></tr>
  <tr><td bgcolor="#111111" style="background-color:#111111;padding:32px 32px 36px;">
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;"><tr><td style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);color:#C9A84C;font-size:10px;letter-spacing:3px;padding:5px 12px;text-transform:uppercase;font-family:Arial,sans-serif;">Booking Confirmed</td></tr></table>
    <p style="color:#ffffff;font-size:16px;margin:0 0 6px;line-height:1.5;font-family:Arial,sans-serif;">Hi ${clientName},</p>
    <p style="color:#888888;font-size:13px;margin:0 0 24px;line-height:1.6;font-family:Arial,sans-serif;">Your appointment has been confirmed. We look forward to seeing you.</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;"><tr><td height="1" bgcolor="#222222" style="background-color:#222222;font-size:0;line-height:0;">&nbsp;</td></tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="color:#666666;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:11px 0;border-bottom:1px solid #1e1e1e;font-family:Arial,sans-serif;">Service</td><td style="color:#ffffff;font-size:13px;padding:11px 0;text-align:right;border-bottom:1px solid #1e1e1e;font-family:Arial,sans-serif;">${serviceName}</td></tr>
      <tr><td style="color:#666666;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:11px 0;border-bottom:1px solid #1e1e1e;font-family:Arial,sans-serif;">Duration</td><td style="color:#ffffff;font-size:13px;padding:11px 0;text-align:right;border-bottom:1px solid #1e1e1e;font-family:Arial,sans-serif;">${duration}</td></tr>
      <tr><td style="color:#666666;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:11px 0;border-bottom:1px solid #1e1e1e;font-family:Arial,sans-serif;">Barber</td><td style="color:#ffffff;font-size:13px;padding:11px 0;text-align:right;border-bottom:1px solid #1e1e1e;font-family:Arial,sans-serif;">${barberName}</td></tr>
      <tr><td style="color:#666666;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:11px 0;border-bottom:1px solid #1e1e1e;font-family:Arial,sans-serif;">Date</td><td style="color:#ffffff;font-size:13px;padding:11px 0;text-align:right;border-bottom:1px solid #1e1e1e;font-family:Arial,sans-serif;">${date}</td></tr>
      <tr><td style="color:#666666;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:11px 0;border-bottom:1px solid #1e1e1e;font-family:Arial,sans-serif;">Time</td><td style="color:#ffffff;font-size:13px;padding:11px 0;text-align:right;border-bottom:1px solid #1e1e1e;font-family:Arial,sans-serif;">${time}</td></tr>
      <tr><td style="color:#666666;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:11px 0;border-bottom:1px solid #1e1e1e;font-family:Arial,sans-serif;">Phone</td><td style="color:#ffffff;font-size:13px;padding:11px 0;text-align:right;border-bottom:1px solid #1e1e1e;font-family:Arial,sans-serif;">${clientPhone}</td></tr>
      <tr><td style="color:#666666;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:11px 0;font-family:Arial,sans-serif;">Reference</td><td style="color:#C9A84C;font-size:13px;font-weight:bold;padding:11px 0;text-align:right;font-family:Arial,sans-serif;">${bookingRef}</td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr><td height="1" bgcolor="#222222" style="background-color:#222222;font-size:0;line-height:0;">&nbsp;</td></tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
      <p style="color:#888888;font-size:12px;margin:0 0 16px;line-height:1.6;font-family:Arial,sans-serif;">Need to cancel? You can do so free of charge up to 24 hours before your appointment.</p>
      <table cellpadding="0" cellspacing="0" border="0"><tr><td style="border:1px solid #555555;"><a href="${cancelUrl}" style="display:inline-block;padding:12px 30px;color:#aaaaaa;text-decoration:none;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif;">Cancel Appointment</a></td></tr></table>
      <p style="color:#555555;font-size:10px;margin:10px 0 0;font-family:Arial,sans-serif;">Cancellations within 24 hours must be made by phone.</p>
    </td></tr></table>
  </td></tr>
  <tr><td align="center" style="padding:24px 20px;">
    <p style="color:#999999;font-size:11px;letter-spacing:1px;margin:0;font-family:Arial,sans-serif;">SHARP CUTS. NO COMPROMISES.</p>
    <p style="color:#aaaaaa;font-size:10px;margin:6px 0 0;font-family:Arial,sans-serif;">Tue–Sat &nbsp;&middot;&nbsp; 09:00–19:00 &nbsp;&middot;&nbsp; St. Julian's, Malta</p>
  </td></tr>
  </table></td></tr></table>
  </body></html>`;

  const reminderHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
  <body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif;">
  <span style="display:none;font-size:0;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">Reminder: Your appointment tomorrow at Borg &amp; Blade.</span>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f0f0;"><tr><td align="center" style="padding:40px 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
  <tr><td align="center" bgcolor="#0a0a0a" style="background-color:#0a0a0a;padding:32px 32px 24px;">
    <p style="color:#ffffff;font-size:26px;letter-spacing:6px;margin:0;font-family:Georgia,serif;font-weight:bold;line-height:1;">BORG <span style="color:#C9A84C;">&amp;</span> BLADE</p>
    <p style="color:#C9A84C;letter-spacing:3px;font-size:10px;margin:8px 0 0;text-transform:uppercase;font-family:Arial,sans-serif;">St. Julian's, Malta</p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin:12px auto 0;"><tr><td width="40" height="1" bgcolor="#C9A84C" style="background-color:#C9A84C;font-size:0;line-height:0;">&nbsp;</td></tr></table>
  </td></tr>
  <tr><td bgcolor="#111111" style="background-color:#111111;padding:32px 32px 36px;">
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;"><tr><td style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);color:#C9A84C;font-size:10px;letter-spacing:3px;padding:5px 12px;text-transform:uppercase;font-family:Arial,sans-serif;">Appointment Tomorrow</td></tr></table>
    <p style="color:#ffffff;font-size:16px;margin:0 0 6px;line-height:1.5;font-family:Arial,sans-serif;">Hi ${clientName},</p>
    <p style="color:#888888;font-size:13px;margin:0 0 24px;line-height:1.6;font-family:Arial,sans-serif;">This is a friendly reminder that you have an appointment tomorrow. We look forward to seeing you.</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;"><tr><td height="1" bgcolor="#222222" style="background-color:#222222;font-size:0;line-height:0;">&nbsp;</td></tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="color:#666666;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:11px 0;border-bottom:1px solid #1e1e1e;font-family:Arial,sans-serif;">Service</td><td style="color:#ffffff;font-size:13px;padding:11px 0;text-align:right;border-bottom:1px solid #1e1e1e;font-family:Arial,sans-serif;">${serviceName}</td></tr>
      <tr><td style="color:#666666;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:11px 0;border-bottom:1px solid #1e1e1e;font-family:Arial,sans-serif;">Barber</td><td style="color:#ffffff;font-size:13px;padding:11px 0;text-align:right;border-bottom:1px solid #1e1e1e;font-family:Arial,sans-serif;">${barberName}</td></tr>
      <tr><td style="color:#666666;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:11px 0;border-bottom:1px solid #1e1e1e;font-family:Arial,sans-serif;">Date</td><td style="color:#ffffff;font-size:13px;padding:11px 0;text-align:right;border-bottom:1px solid #1e1e1e;font-family:Arial,sans-serif;">${date}</td></tr>
      <tr><td style="color:#666666;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:11px 0;font-family:Arial,sans-serif;">Time</td><td style="color:#ffffff;font-size:13px;padding:11px 0;text-align:right;font-family:Arial,sans-serif;">${time}</td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr><td height="1" bgcolor="#222222" style="background-color:#222222;font-size:0;line-height:0;">&nbsp;</td></tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
      <p style="color:#888888;font-size:12px;margin:0 0 16px;line-height:1.6;font-family:Arial,sans-serif;">Can't make it? Cancel free of charge up to 24 hours before your appointment.</p>
      <table cellpadding="0" cellspacing="0" border="0"><tr><td style="border:1px solid #555555;"><a href="${cancelUrl}" style="display:inline-block;padding:12px 30px;color:#aaaaaa;text-decoration:none;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif;">Cancel Appointment</a></td></tr></table>
      <p style="color:#555555;font-size:10px;margin:10px 0 0;font-family:Arial,sans-serif;">Cancellations within 24 hours must be made by phone.</p>
    </td></tr></table>
  </td></tr>
  <tr><td align="center" style="padding:24px 20px;">
    <p style="color:#999999;font-size:11px;letter-spacing:1px;margin:0;font-family:Arial,sans-serif;">SHARP CUTS. NO COMPROMISES.</p>
    <p style="color:#aaaaaa;font-size:10px;margin:6px 0 0;font-family:Arial,sans-serif;">Tue–Sat &nbsp;&middot;&nbsp; 09:00–19:00 &nbsp;&middot;&nbsp; St. Julian's, Malta</p>
  </td></tr>
  </table></td></tr></table>
  </body></html>`;

  // ── Send confirmation to client ──────────────────────────────────────────
  const clientRes = await fetch('https://api.resend.com/emails', {
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
  const clientResult = await clientRes.json();
  console.log('Client email:', JSON.stringify(clientResult));

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
      html: `<div style="font-family:Arial,sans-serif;padding:20px;">
        <h3 style="color:#C9A84C;">New Booking — Borg & Blade</h3>
        <p><strong>Name:</strong> ${clientName}</p>
        <p><strong>Email:</strong> ${clientEmail}</p>
        <p><strong>Phone:</strong> ${clientPhone}</p>
        <p><strong>Service:</strong> ${serviceName}</p>
        <p><strong>Barber:</strong> ${barberName}</p>
        <p><strong>Date:</strong> ${date} at ${time}</p>
        <p><strong>Ref:</strong> ${bookingRef}</p>
      </div>`,
    }),
  });

  // ── Schedule reminder 24hrs before appointment ───────────────────────────
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
      console.log('Reminder email:', JSON.stringify(reminderData));
      reminderEmailId = reminderData.id ?? null;
    }
  } catch (e) {
    console.error('Reminder scheduling failed:', e);
  }

  res.status(200).json({ success: true, reminderEmailId });
}

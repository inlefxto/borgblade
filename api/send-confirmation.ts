import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    clientName, clientEmail, clientPhone,
    serviceName, duration, barberName,
    date, time, bookingRef
  } = req.body;

  const cancelUrl = `https://borgblade.com/cancel?ref=${bookingRef}`;

  // ── Confirmation email to client ─────────────────────────────────────────
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
      template_id: 'ff31a327-00ab-4a0c-a831-bd7cd106ae44',
      data: {
        clientName,
        serviceName,
        duration,
        barberName,
        date,
        time,
        clientPhone,
        bookingRef,
        cancelUrl,
      },
    }),
  });
  const clientResult = await clientRes.json();
  console.log('Client email:', JSON.stringify(clientResult));

  // ── Notification email to owner ──────────────────────────────────────────
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
          template_id: 'd9e68017-aa99-43ab-8ba1-e15f56adecad',
          data: {
            clientName,
            serviceName,
            barberName,
            date,
            time,
            bookingRef,
            cancelUrl,
          },
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

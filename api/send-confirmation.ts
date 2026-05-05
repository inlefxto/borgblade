import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { clientName, clientEmail, serviceName, barberName, date, time, bookingRef } = req.body;

  const variables = { clientName, serviceName, barberName, date, time, bookingRef };

  // Confirmation email to client
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'bookings@borgblade.com',
      to: [clientEmail],
      subject: 'Booking Confirmed — Borg & Blade',
      template_id: 'ff31a327-00ab-4a0c-a831-bd7cd106ae44',
      variables
    })
  });

  // Admin notification
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'bookings@borgblade.com',
      to: ['nicholaidebono@gmail.com'],
      subject: `New Booking — ${clientName}`,
      html: `<p>New booking from <strong>${clientName}</strong> (${clientEmail})<br>
             Service: ${serviceName}<br>
             Barber: ${barberName}<br>
             Date: ${date} at ${time}<br>
             Ref: ${bookingRef}</p>`
    })
  });

  res.status(200).json({ success: true });
}

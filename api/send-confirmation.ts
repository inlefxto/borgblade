import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { clientName, clientEmail, serviceName, barberName, date, time, bookingRef } = req.body;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: [clientEmail],
      subject: 'Booking Confirmed — Borg & Blade',
      html: `<h2>Booking Confirmed!</h2>
        <p>Hi ${clientName},</p>
        <p>Your appointment has been confirmed.</p>
        <ul>
          <li><strong>Service:</strong> ${serviceName}</li>
          <li><strong>Barber:</strong> ${barberName}</li>
          <li><strong>Date:</strong> ${date}</li>
          <li><strong>Time:</strong> ${time}</li>
          <li><strong>Reference:</strong> ${bookingRef}</li>
        </ul>
        <p>See you soon!</p>
        <p>Borg & Blade</p>`
    })
  });

  // Send admin notification
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: ['nicholaidebono@gmail.com'],
      subject: `New Booking — ${clientName}`,
      html: `<h2>New Booking Received</h2>
        <ul>
          <li><strong>Client:</strong> ${clientName} (${clientEmail})</li>
          <li><strong>Service:</strong> ${serviceName}</li>
          <li><strong>Barber:</strong> ${barberName}</li>
          <li><strong>Date:</strong> ${date}</li>
          <li><strong>Time:</strong> ${time}</li>
          <li><strong>Reference:</strong> ${bookingRef}</li>
        </ul>`
    })
  });

  const data = await response.json();
  res.status(200).json(data);
}

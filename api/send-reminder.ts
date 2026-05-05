import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { clientName, clientEmail, serviceName, barberName, date, time, bookingRef } = req.body;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'bookings@borgblade.com',
      to: [clientEmail],
      subject: `Reminder — Your appointment tomorrow at ${time}`,
      template_id: 'd9e68017-aa99-43ab-8ba1-e15f56adecad',
      variables: { clientName, serviceName, barberName, date, time, bookingRef }
    })
  });

  res.status(200).json({ success: true });
}

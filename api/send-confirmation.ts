import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { clientName, clientEmail, serviceName, barberName, date, time, bookingRef } = req.body;

  // Confirmation email to client using template
  const { data, error } = await resend.emails.send({
    from: 'bookings@borgblade.com',
    to: [clientEmail],
    subject: 'Booking Confirmed — Borg & Blade',
    template_id: 'ff31a327-00ab-4a0c-a831-bd7cd106ae44',
    variables: { clientName, serviceName, barberName, date, time, bookingRef }
  } as any);

  console.log('Client email result:', JSON.stringify({ data, error }));

  // Admin notification
  await resend.emails.send({
    from: 'bookings@borgblade.com',
    to: ['nicholaidebono@gmail.com'],
    subject: `New Booking — ${clientName}`,
    html: `<p><strong>${clientName}</strong> (${clientEmail})<br>
           Service: ${serviceName}<br>
           Barber: ${barberName}<br>
           Date: ${date} at ${time}<br>
           Ref: ${bookingRef}</p>`
  });

  res.status(200).json({ success: true, data, error });
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { reminderEmailId } = req.body;

  if (!reminderEmailId) return res.status(200).json({ success: true });

  try {
    await fetch(`https://api.resend.com/emails/${reminderEmailId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
    });
  } catch (e) {
    console.error('Failed to cancel reminder:', e);
  }

  res.status(200).json({ success: true });
}

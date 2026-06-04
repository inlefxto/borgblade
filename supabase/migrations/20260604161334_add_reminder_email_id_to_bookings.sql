/*
  # Add reminder_email_id to bookings

  Stores the Resend scheduled email ID so reminders can be cancelled if the booking is cancelled.

  1. Changes
    - `bookings` — new nullable `reminder_email_id` text column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'reminder_email_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN reminder_email_id text;
  END IF;
END $$;

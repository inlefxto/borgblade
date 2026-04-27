/*
  # Add missing columns to bookings table

  ## Changes to `bookings`
  - Add `client_name` (text) - mapped from customer_name
  - Add `client_email` (text) - client email address
  - Add `service_id` (uuid, nullable FK -> services)
  - Add `staff_id` (uuid, nullable FK -> staff)
  - Add `booking_date` (date) - alias for appointment_date
  - Add `booking_time` (text) - alias for appointment_time

  ## Notes
  - All new columns are nullable to avoid breaking existing rows
  - Existing columns are preserved
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'client_name') THEN
    ALTER TABLE bookings ADD COLUMN client_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'client_email') THEN
    ALTER TABLE bookings ADD COLUMN client_email text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'service_id') THEN
    ALTER TABLE bookings ADD COLUMN service_id uuid REFERENCES services(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'staff_id') THEN
    ALTER TABLE bookings ADD COLUMN staff_id uuid REFERENCES staff(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'booking_date') THEN
    ALTER TABLE bookings ADD COLUMN booking_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'booking_time') THEN
    ALTER TABLE bookings ADD COLUMN booking_time text;
  END IF;
END $$;

-- Ensure RLS policies allow anon insert and select
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Anyone can insert bookings'
  ) THEN
    CREATE POLICY "Anyone can insert bookings"
      ON bookings FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Anyone can read bookings'
  ) THEN
    CREATE POLICY "Anyone can read bookings"
      ON bookings FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Anyone can update booking status'
  ) THEN
    CREATE POLICY "Anyone can update booking status"
      ON bookings FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

/*
  # Add time_slot column to bookings table

  Adds `time_slot` (text) to match the new insert schema.
  The existing `booking_time` column is preserved for backwards compatibility.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'time_slot') THEN
    ALTER TABLE bookings ADD COLUMN time_slot text;
  END IF;
END $$;

/*
  # Add client_phone to bookings

  1. Modified Tables
    - `bookings`
      - `client_phone` (text, nullable) — stores the client's phone number collected at booking time
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'client_phone'
  ) THEN
    ALTER TABLE bookings ADD COLUMN client_phone text DEFAULT '';
  END IF;
END $$;

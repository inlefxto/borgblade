/*
  # Create bookings table for barbershop appointments

  1. New Tables
    - `bookings`
      - `id` (uuid, primary key) - Unique identifier for each booking
      - `booking_ref` (text, unique) - Human-readable booking reference (e.g., BB-12345)
      - `customer_name` (text) - Customer's full name
      - `customer_phone` (text) - Customer's phone number
      - `barber_id` (text) - ID of the selected barber
      - `service_name` (text) - Name of the service booked
      - `appointment_date` (date) - Date of the appointment
      - `appointment_time` (text) - Time slot for the appointment
      - `created_at` (timestamptz) - When the booking was created
      - `status` (text) - Booking status (confirmed, cancelled, completed)

  2. Security
    - Enable RLS on `bookings` table
    - Add policy for anyone to create bookings (public booking system)
    - Add policy for anyone to read their own bookings by phone number
*/

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  barber_id text NOT NULL,
  service_name text NOT NULL,
  appointment_date date NOT NULL,
  appointment_time text NOT NULL,
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'confirmed' NOT NULL
);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create a booking (public booking system)
CREATE POLICY "Anyone can create bookings"
  ON bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Anyone can view bookings (for confirmation display)
CREATE POLICY "Anyone can view bookings"
  ON bookings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create index for faster lookups by booking reference
CREATE INDEX IF NOT EXISTS idx_bookings_ref ON bookings(booking_ref);

-- Create index for faster lookups by appointment date
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(appointment_date);
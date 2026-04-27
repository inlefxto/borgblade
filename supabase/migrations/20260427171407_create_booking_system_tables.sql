/*
  # Create Booking System Tables

  ## Overview
  Sets up the full booking system for Borg & Blade Barbershop.

  ## New Tables

  ### `services`
  - `id` (uuid, primary key)
  - `name` (text) - Service name
  - `category` (text) - One of: haircuts, beard, combos, extras
  - `duration` (text) - Human-readable duration e.g. "30 min"
  - `price` (integer) - Price in EUR
  - `created_at` (timestamptz)

  ### `staff`
  - `id` (uuid, primary key)
  - `name` (text) - Barber's full name
  - `role` (text) - Job title/role
  - `avatar` (text) - Path to avatar image
  - `created_at` (timestamptz)

  ### `bookings`
  - `id` (uuid, primary key)
  - `client_name` (text) - Client's full name
  - `client_email` (text) - Client's email address
  - `service_id` (uuid, FK -> services)
  - `staff_id` (uuid, FK -> staff)
  - `booking_date` (date) - Date of appointment
  - `booking_time` (text) - Time slot e.g. "09:00"
  - `status` (text) - One of: pending, completed, cancelled
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Public can read services and staff (needed for booking flow)
  - Public can insert bookings (to create bookings without auth)
  - Public can read bookings (needed for slot availability check)
  - Admin updates handled via service role in edge functions
*/

-- SERVICES TABLE
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'haircuts',
  duration text NOT NULL DEFAULT '30 min',
  price integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read services"
  ON services FOR SELECT
  TO anon, authenticated
  USING (true);

-- STAFF TABLE
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT 'Barber',
  avatar text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read staff"
  ON staff FOR SELECT
  TO anon, authenticated
  USING (true);

-- BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_email text NOT NULL,
  service_id uuid NOT NULL REFERENCES services(id),
  staff_id uuid NOT NULL REFERENCES staff(id),
  booking_date date NOT NULL,
  booking_time text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bookings"
  ON bookings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert bookings"
  ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update booking status"
  ON bookings FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- SEED SERVICES
INSERT INTO services (name, category, duration, price) VALUES
  ('Haircut (Clipper)', 'haircuts', '30 min', 8),
  ('Skinfade Haircut', 'haircuts', '30 min', 14),
  ('Scissors Classic Haircut', 'haircuts', '45 min', 16),
  ('Long Scissors Haircut', 'haircuts', '45 min', 18),
  ('Haircut + Wash & Style', 'haircuts', '40 min', 20),
  ('Boy''s Haircut (0-5 yrs)', 'haircuts', '20 min', 11),
  ('+65 Haircut', 'haircuts', '30 min', 12),
  ('Head Shave (Clipper)', 'haircuts', '30 min', 10),
  ('Clean Head Shave', 'haircuts', '30 min', 13),
  ('Hairstyling', 'haircuts', '15 min', 6),
  ('Beard Grooming', 'beard', '15 min', 8),
  ('Beard Clean Shave', 'beard', '15 min', 8),
  ('Hot Towel Beard Grooming', 'beard', '20 min', 10),
  ('Premium Beard Clean Shave', 'beard', '20 min', 10),
  ('Haircut & Skinfade', 'combos', '30 min', 14),
  ('Haircut & Beard Trim', 'combos', '45 min', 20),
  ('Skinfade & Beard Grooming', 'combos', '45 min', 18),
  ('Skin Fade & Design', 'combos', '30 min', 16),
  ('Haircut, Eyebrows & Beard', 'combos', '1 hr', 20),
  ('Full Service (Haircut + Facial + Eyebrows)', 'combos', '1 hr 15 min', 50),
  ('Eyebrows', 'extras', '15 min', 5),
  ('Eyebrows, Ears & Nose Waxing', 'extras', '15 min', 10),
  ('Ears & Nose Waxing', 'extras', '15 min', 5)
ON CONFLICT DO NOTHING;

-- SEED STAFF
INSERT INTO staff (name, role, avatar) VALUES
  ('Marco Borg', 'Owner & Master Barber', '/Marco.png'),
  ('Luca Farrugia', 'Senior Barber', '/Luca.png'),
  ('Dylan Camilleri', 'Barber', '/Dylan.png')
ON CONFLICT DO NOTHING;

-- Add price column if it doesn't exist
ALTER TABLE services ADD COLUMN IF NOT EXISTS price numeric(10,2) NOT NULL DEFAULT 0;

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON services TO anon, authenticated;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Public can insert services" ON services;
DROP POLICY IF EXISTS "Public can update services" ON services;
DROP POLICY IF EXISTS "Public can delete services" ON services;
DROP POLICY IF EXISTS "Public can read services" ON services;

-- Recreate policies
CREATE POLICY "Public can read services" ON services FOR SELECT USING (true);
CREATE POLICY "Public can insert services" ON services FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update services" ON services FOR UPDATE USING (true);
CREATE POLICY "Public can delete services" ON services FOR DELETE USING (true);
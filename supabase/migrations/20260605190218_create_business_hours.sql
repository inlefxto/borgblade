CREATE TABLE IF NOT EXISTS business_hours (
  id serial PRIMARY KEY,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time time,
  close_time time,
  is_closed boolean NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX IF NOT EXISTS business_hours_day_of_week_idx ON business_hours (day_of_week);

ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_business_hours" ON business_hours FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "insert_business_hours" ON business_hours FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "update_business_hours" ON business_hours FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_business_hours" ON business_hours FOR DELETE
  TO authenticated USING (true);

-- Seed default hours (Mon–Fri 09:00–19:00, Sat 09:00–17:00, Sun closed)
INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed) VALUES
  (0, null,    null,    true),
  (1, '09:00', '19:00', false),
  (2, '09:00', '19:00', false),
  (3, '09:00', '19:00', false),
  (4, '09:00', '19:00', false),
  (5, '09:00', '19:00', false),
  (6, '09:00', '17:00', false)
ON CONFLICT (day_of_week) DO NOTHING;

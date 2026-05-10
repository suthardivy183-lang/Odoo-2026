-- ============================================================
-- TRIP RESERVATIONS (flights, hotels, trains, etc.)
-- ============================================================

CREATE TABLE IF NOT EXISTS trip_reservations (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id       UUID          NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  type          VARCHAR(20)   NOT NULL CHECK (type IN ('flight','hotel','train','car_rental','other')),
  title         VARCHAR(200)  NOT NULL,
  provider      VARCHAR(200),
  booking_ref   VARCHAR(100),
  from_location VARCHAR(200),
  to_location   VARCHAR(200),
  start_date    DATE,
  start_time    TIME,
  end_date      DATE,
  end_time      TIME,
  cost          NUMERIC(12,2) CHECK (cost >= 0),
  notes         TEXT,
  created_by    UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_reservations_trip_id ON trip_reservations(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_reservations_type    ON trip_reservations(trip_id, type);

DROP TRIGGER IF EXISTS trg_trip_reservations_updated_at ON trip_reservations;
CREATE TRIGGER trg_trip_reservations_updated_at
  BEFORE UPDATE ON trip_reservations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

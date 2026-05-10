-- ============================================================
-- LODGING AND HOTEL DISCOVERY
-- ============================================================

CREATE TABLE IF NOT EXISTS lodging_options (
  id            SERIAL        PRIMARY KEY,
  city_id       INTEGER       NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name          VARCHAR(160)  NOT NULL,
  lodging_type  VARCHAR(40)   NOT NULL DEFAULT 'hotel',
  rating        NUMERIC(2,1)  NOT NULL DEFAULT 4.0 CHECK (rating >= 0 AND rating <= 5),
  nightly_rate  NUMERIC(10,2) NOT NULL CHECK (nightly_rate >= 0),
  currency      VARCHAR(3)    NOT NULL DEFAULT 'USD',
  booking_url   VARCHAR(500),
  amenities     TEXT[]        NOT NULL DEFAULT '{}',
  image_url     VARCHAR(500),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trip_lodgings (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id           UUID          NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  stop_id           UUID          NOT NULL REFERENCES trip_stops(id) ON DELETE CASCADE,
  lodging_option_id INTEGER       REFERENCES lodging_options(id) ON DELETE SET NULL,
  custom_name       VARCHAR(160),
  check_in          DATE          NOT NULL,
  check_out         DATE          NOT NULL,
  nightly_rate      NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (nightly_rate >= 0),
  currency          VARCHAR(3)    NOT NULL DEFAULT 'USD',
  guests            INTEGER       NOT NULL DEFAULT 2 CHECK (guests > 0),
  status            VARCHAR(20)   NOT NULL DEFAULT 'saved' CHECK (status IN ('saved', 'booked')),
  notes             TEXT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT lodging_dates_check CHECK (check_out >= check_in),
  CONSTRAINT lodging_has_name CHECK (lodging_option_id IS NOT NULL OR custom_name IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_lodging_options_city_id ON lodging_options(city_id);
CREATE INDEX IF NOT EXISTS idx_trip_lodgings_trip_id ON trip_lodgings(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_lodgings_stop_id ON trip_lodgings(stop_id);

INSERT INTO lodging_options (city_id, name, lodging_type, rating, nightly_rate, currency, booking_url, amenities, image_url)
SELECT c.id,
       c.name || ' Central Hotel',
       'hotel',
       4.4,
       ROUND((c.cost_index * 1.35)::numeric, 2),
       'USD',
       'https://www.booking.com/searchresults.html?ss=' || REPLACE(c.name || ' ' || c.country, ' ', '+'),
       ARRAY['Free Wi-Fi', 'Breakfast', 'Central location'],
       c.image_url
FROM cities c
WHERE NOT EXISTS (
  SELECT 1 FROM lodging_options lo WHERE lo.city_id = c.id AND lo.name = c.name || ' Central Hotel'
);

INSERT INTO lodging_options (city_id, name, lodging_type, rating, nightly_rate, currency, booking_url, amenities, image_url)
SELECT c.id,
       c.name || ' Boutique Stay',
       'boutique',
       4.7,
       ROUND((c.cost_index * 1.75)::numeric, 2),
       'USD',
       'https://www.booking.com/searchresults.html?ss=' || REPLACE(c.name || ' boutique hotel', ' ', '+'),
       ARRAY['Local design', 'Walkable area', 'Concierge'],
       c.image_url
FROM cities c
WHERE NOT EXISTS (
  SELECT 1 FROM lodging_options lo WHERE lo.city_id = c.id AND lo.name = c.name || ' Boutique Stay'
);

DROP TRIGGER IF EXISTS trg_trip_lodgings_updated_at ON trip_lodgings;
CREATE TRIGGER trg_trip_lodgings_updated_at
  BEFORE UPDATE ON trip_lodgings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

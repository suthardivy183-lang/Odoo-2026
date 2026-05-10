-- ============================================================
-- Traveloop Database Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE activity_type AS ENUM (
  'sightseeing', 'food', 'adventure', 'culture',
  'shopping', 'nightlife', 'nature', 'wellness'
);

CREATE TYPE checklist_category AS ENUM (
  'clothing', 'documents', 'electronics',
  'toiletries', 'medicines', 'other'
);

CREATE TYPE trip_status AS ENUM ('draft', 'active', 'completed');

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  profile_photo VARCHAR(500),
  language_pref VARCHAR(10)  NOT NULL DEFAULT 'en',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- CITIES  (seeded — no user FK)
-- ============================================================

CREATE TABLE cities (
  id               SERIAL      PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  country          VARCHAR(100) NOT NULL,
  region           VARCHAR(100) NOT NULL,
  description      TEXT         NOT NULL,
  cost_index       NUMERIC(8,2) NOT NULL CHECK (cost_index > 0),
  popularity_score INTEGER      NOT NULL DEFAULT 0 CHECK (popularity_score BETWEEN 0 AND 100),
  image_url        VARCHAR(500),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cities_name    ON cities(name);
CREATE INDEX idx_cities_country ON cities(country);
CREATE INDEX idx_cities_region  ON cities(region);
CREATE INDEX idx_cities_popularity ON cities(popularity_score DESC);

-- ============================================================
-- ACTIVITIES  (seeded — belongs to a city)
-- ============================================================

CREATE TABLE activities (
  id             SERIAL          PRIMARY KEY,
  city_id        INTEGER         NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name           VARCHAR(150)    NOT NULL,
  description    TEXT            NOT NULL,
  type           activity_type   NOT NULL,
  duration_hours NUMERIC(4,1)    NOT NULL CHECK (duration_hours > 0),
  cost           NUMERIC(10,2)   NOT NULL DEFAULT 0 CHECK (cost >= 0),
  image_url      VARCHAR(500),
  created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activities_city_id ON activities(city_id);
CREATE INDEX idx_activities_type    ON activities(type);
CREATE INDEX idx_activities_cost    ON activities(cost);

-- ============================================================
-- TRIPS
-- ============================================================

CREATE TABLE trips (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(150) NOT NULL,
  description  TEXT,
  start_date   DATE         NOT NULL,
  end_date     DATE         NOT NULL,
  cover_photo  VARCHAR(500),
  is_public    BOOLEAN      NOT NULL DEFAULT FALSE,
  public_slug  VARCHAR(100) UNIQUE,
  total_budget NUMERIC(12,2) CHECK (total_budget >= 0),
  status       trip_status  NOT NULL DEFAULT 'draft',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT trips_dates_check CHECK (end_date >= start_date)
);

CREATE INDEX idx_trips_user_id    ON trips(user_id);
CREATE INDEX idx_trips_is_public  ON trips(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_trips_public_slug ON trips(public_slug) WHERE public_slug IS NOT NULL;
CREATE INDEX idx_trips_status     ON trips(status);
CREATE INDEX idx_trips_start_date ON trips(start_date);

-- ============================================================
-- TRIP STOPS  (cities within a trip, ordered)
-- ============================================================

CREATE TABLE trip_stops (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id        UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  city_id        INTEGER     NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  stop_order     INTEGER     NOT NULL CHECK (stop_order >= 0),
  arrival_date   DATE        NOT NULL,
  departure_date DATE        NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT stop_dates_check CHECK (departure_date >= arrival_date),
  CONSTRAINT unique_stop_order UNIQUE (trip_id, stop_order)
);

CREATE INDEX idx_trip_stops_trip_id  ON trip_stops(trip_id);
CREATE INDEX idx_trip_stops_city_id  ON trip_stops(city_id);
CREATE INDEX idx_trip_stops_order    ON trip_stops(trip_id, stop_order);

-- ============================================================
-- STOP ACTIVITIES  (activities added to a stop)
-- ============================================================

CREATE TABLE stop_activities (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  stop_id        UUID         NOT NULL REFERENCES trip_stops(id) ON DELETE CASCADE,
  activity_id    INTEGER      NOT NULL REFERENCES activities(id) ON DELETE RESTRICT,
  scheduled_date DATE,
  scheduled_time TIME,
  custom_cost    NUMERIC(10,2) CHECK (custom_cost >= 0),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_stop_activity UNIQUE (stop_id, activity_id)
);

CREATE INDEX idx_stop_activities_stop_id     ON stop_activities(stop_id);
CREATE INDEX idx_stop_activities_activity_id ON stop_activities(activity_id);

-- ============================================================
-- TRIP BUDGET
-- ============================================================

CREATE TABLE trip_budgets (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id             UUID         NOT NULL UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
  transport_cost      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (transport_cost >= 0),
  accommodation_cost  NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (accommodation_cost >= 0),
  meals_cost          NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (meals_cost >= 0),
  miscellaneous_cost  NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (miscellaneous_cost >= 0),
  currency            VARCHAR(3)    NOT NULL DEFAULT 'USD',
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trip_budgets_trip_id ON trip_budgets(trip_id);

-- ============================================================
-- TRIP CHECKLIST  (packing list per trip)
-- ============================================================

CREATE TABLE trip_checklist (
  id         UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id    UUID                NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  item_name  VARCHAR(150)        NOT NULL,
  category   checklist_category  NOT NULL DEFAULT 'other',
  is_packed  BOOLEAN             NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checklist_trip_id  ON trip_checklist(trip_id);
CREATE INDEX idx_checklist_category ON trip_checklist(trip_id, category);

-- ============================================================
-- TRIP NOTES / JOURNAL
-- ============================================================

CREATE TABLE trip_notes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id    UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  stop_id    UUID        REFERENCES trip_stops(id) ON DELETE SET NULL,
  title      VARCHAR(200),
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trip_notes_trip_id ON trip_notes(trip_id);
CREATE INDEX idx_trip_notes_stop_id ON trip_notes(stop_id);
CREATE INDEX idx_trip_notes_created ON trip_notes(trip_id, created_at DESC);

-- ============================================================
-- AUTO-UPDATE updated_at via trigger
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_trip_stops_updated_at
  BEFORE UPDATE ON trip_stops
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_trip_budgets_updated_at
  BEFORE UPDATE ON trip_budgets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_trip_checklist_updated_at
  BEFORE UPDATE ON trip_checklist
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_trip_notes_updated_at
  BEFORE UPDATE ON trip_notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

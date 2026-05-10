-- ============================================================
-- TRIP EXPENSES AND SPLITS
-- ============================================================

CREATE TABLE IF NOT EXISTS trip_expenses (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id       UUID          NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title         VARCHAR(160)  NOT NULL,
  category      VARCHAR(40)   NOT NULL DEFAULT 'miscellaneous',
  amount        NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency      VARCHAR(3)    NOT NULL DEFAULT 'USD',
  paid_by       UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_by    UUID          REFERENCES users(id) ON DELETE SET NULL,
  expense_date  DATE          NOT NULL DEFAULT CURRENT_DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trip_expense_splits (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id  UUID          NOT NULL REFERENCES trip_expenses(id) ON DELETE CASCADE,
  user_id     UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  share_amount NUMERIC(12,2) NOT NULL CHECK (share_amount >= 0),

  CONSTRAINT unique_expense_split_user UNIQUE (expense_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_expenses_trip_id ON trip_expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_paid_by ON trip_expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_trip_expense_splits_expense_id ON trip_expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_trip_expense_splits_user_id ON trip_expense_splits(user_id);

DROP TRIGGER IF EXISTS trg_trip_expenses_updated_at ON trip_expenses;
CREATE TRIGGER trg_trip_expenses_updated_at
  BEFORE UPDATE ON trip_expenses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

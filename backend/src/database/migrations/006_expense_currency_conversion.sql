-- ============================================================
-- EXPENSE CURRENCY CONVERSION
-- ============================================================

ALTER TABLE trip_expenses
  ADD COLUMN IF NOT EXISTS exchange_rate_to_budget NUMERIC(14,6) NOT NULL DEFAULT 1 CHECK (exchange_rate_to_budget > 0),
  ADD COLUMN IF NOT EXISTS converted_amount NUMERIC(12,2);

UPDATE trip_expenses
SET converted_amount = ROUND(amount * exchange_rate_to_budget, 2)
WHERE converted_amount IS NULL;

ALTER TABLE trip_expenses
  ALTER COLUMN converted_amount SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'trip_expenses_converted_amount_check'
  ) THEN
    ALTER TABLE trip_expenses
      ADD CONSTRAINT trip_expenses_converted_amount_check CHECK (converted_amount > 0);
  END IF;
END $$;

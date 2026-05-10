import pool from '../database/pool';
import { UpdateBudgetInput } from '../validators/budget.validator';
import { requireTripAccess } from './tripAccess.service';

const makeErr = (msg: string, status: number) => {
  const e = new Error(msg) as Error & { status: number };
  e.status = status;
  return e;
};

const verifyTripOwner = async (tripId: string, userId: string) => {
  await requireTripAccess(tripId, userId);
};

export const getTripBudget = async (tripId: string, userId: string) => {
  await verifyTripOwner(tripId, userId);

  const { rows } = await pool.query(
    `SELECT tb.id,
            tb.trip_id,
            tb.transport_cost,
            COALESCE(lod.lodging_total, tb.accommodation_cost) AS accommodation_cost,
            tb.meals_cost,
            tb.miscellaneous_cost,
            tb.currency,
            tb.created_at,
            tb.updated_at,
            t.total_budget,
            (tb.transport_cost + COALESCE(lod.lodging_total, tb.accommodation_cost) + tb.meals_cost + tb.miscellaneous_cost) AS breakdown_total,
            COALESCE(act.activities_total, 0)    AS activities_total,
            COALESCE(exp.expenses_total, 0)      AS expenses_total,
            COALESCE(lod.lodging_total, 0)       AS lodging_total,
            COALESCE(res.reservations_total, 0)  AS reservations_total
     FROM trip_budgets tb
     JOIN trips t ON t.id = tb.trip_id
     LEFT JOIN (
       SELECT ts.trip_id, SUM(COALESCE(sa.custom_cost, a.cost)) AS activities_total
       FROM trip_stops ts
       JOIN stop_activities sa ON sa.stop_id = ts.id
       JOIN activities a ON a.id = sa.activity_id
       GROUP BY ts.trip_id
     ) act ON act.trip_id = t.id
     LEFT JOIN (
       SELECT trip_id, SUM(converted_amount) AS expenses_total
       FROM trip_expenses
       GROUP BY trip_id
     ) exp ON exp.trip_id = t.id
     LEFT JOIN (
       SELECT trip_id,
              SUM(GREATEST(1, check_out - check_in) * nightly_rate) AS lodging_total
       FROM trip_lodgings
       GROUP BY trip_id
     ) lod ON lod.trip_id = t.id
     LEFT JOIN (
       SELECT trip_id, SUM(cost) AS reservations_total
       FROM trip_reservations
       WHERE cost IS NOT NULL
       GROUP BY trip_id
     ) res ON res.trip_id = t.id
     WHERE tb.trip_id = $1
     GROUP BY tb.id, t.total_budget, act.activities_total, exp.expenses_total, lod.lodging_total, res.reservations_total`,
    [tripId]
  );
  if (!rows[0]) throw makeErr('Budget not found', 404);
  return rows[0];
};

export const updateTripBudget = async (
  tripId: string, userId: string, input: UpdateBudgetInput
) => {
  await verifyTripOwner(tripId, userId);

  const setClauses: string[] = [];
  const values: unknown[]    = [];
  let idx = 1;

  if (input.transport_cost !== undefined) {
    setClauses.push(`transport_cost = $${idx++}`);
    values.push(input.transport_cost);
  }
  if (input.accommodation_cost !== undefined) {
    setClauses.push(`accommodation_cost = $${idx++}`);
    values.push(input.accommodation_cost);
  }
  if (input.meals_cost !== undefined) {
    setClauses.push(`meals_cost = $${idx++}`);
    values.push(input.meals_cost);
  }
  if (input.miscellaneous_cost !== undefined) {
    setClauses.push(`miscellaneous_cost = $${idx++}`);
    values.push(input.miscellaneous_cost);
  }
  if (input.currency !== undefined) {
    setClauses.push(`currency = $${idx++}`);
    values.push(input.currency);
  }

  setClauses.push(`updated_at = NOW()`);
  values.push(tripId);

  const { rows } = await pool.query(
    `UPDATE trip_budgets SET ${setClauses.join(', ')}
     WHERE trip_id = $${idx}
     RETURNING *`,
    values
  );
  if (!rows[0]) throw makeErr('Budget not found', 404);
  return rows[0];
};

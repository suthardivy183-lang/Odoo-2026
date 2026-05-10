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
    `SELECT tb.*,
            t.total_budget,
            (tb.transport_cost + tb.accommodation_cost + tb.meals_cost + tb.miscellaneous_cost) AS breakdown_total,
            COALESCE(SUM(COALESCE(sa.custom_cost, a.cost)), 0) AS activities_total
     FROM trip_budgets tb
     JOIN trips t ON t.id = tb.trip_id
     LEFT JOIN trip_stops ts ON ts.trip_id = t.id
     LEFT JOIN stop_activities sa ON sa.stop_id = ts.id
     LEFT JOIN activities a ON a.id = sa.activity_id
     WHERE tb.trip_id = $1
     GROUP BY tb.id, t.total_budget`,
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

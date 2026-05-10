import pool from '../database/pool';
import { CreateChecklistInput, UpdateChecklistInput } from '../validators/checklist.validator';

const makeErr = (msg: string, status: number) => {
  const e = new Error(msg) as Error & { status: number };
  e.status = status;
  return e;
};

const verifyTripOwner = async (tripId: string, userId: string) => {
  const { rows } = await pool.query(
    `SELECT id FROM trips WHERE id = $1 AND user_id = $2`,
    [tripId, userId]
  );
  if (!rows[0]) throw makeErr('Trip not found', 404);
};

export const getChecklist = async (tripId: string, userId: string) => {
  await verifyTripOwner(tripId, userId);

  const { rows } = await pool.query(
    `SELECT * FROM trip_checklist
     WHERE trip_id = $1
     ORDER BY category, created_at ASC`,
    [tripId]
  );
  return rows;
};

export const addChecklistItem = async (
  tripId: string, userId: string, input: CreateChecklistInput
) => {
  await verifyTripOwner(tripId, userId);

  const { rows } = await pool.query(
    `INSERT INTO trip_checklist (trip_id, item_name, category, is_packed)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [tripId, input.item_name, input.category, input.is_packed]
  );
  return rows[0];
};

export const updateChecklistItem = async (
  tripId: string, itemId: string, userId: string, input: UpdateChecklistInput
) => {
  await verifyTripOwner(tripId, userId);

  const setClauses: string[] = [];
  const values: unknown[]    = [];
  let idx = 1;

  if (input.item_name !== undefined) {
    setClauses.push(`item_name = $${idx++}`);
    values.push(input.item_name);
  }
  if (input.category !== undefined) {
    setClauses.push(`category = $${idx++}`);
    values.push(input.category);
  }
  if (input.is_packed !== undefined) {
    setClauses.push(`is_packed = $${idx++}`);
    values.push(input.is_packed);
  }
  setClauses.push(`updated_at = NOW()`);
  values.push(itemId, tripId);

  const { rows } = await pool.query(
    `UPDATE trip_checklist SET ${setClauses.join(', ')}
     WHERE id = $${idx} AND trip_id = $${idx + 1}
     RETURNING *`,
    values
  );
  if (!rows[0]) throw makeErr('Checklist item not found', 404);
  return rows[0];
};

export const toggleChecklistItem = async (
  tripId: string, itemId: string, userId: string
) => {
  await verifyTripOwner(tripId, userId);

  const { rows } = await pool.query(
    `UPDATE trip_checklist SET is_packed = NOT is_packed, updated_at = NOW()
     WHERE id = $1 AND trip_id = $2
     RETURNING *`,
    [itemId, tripId]
  );
  if (!rows[0]) throw makeErr('Checklist item not found', 404);
  return rows[0];
};

export const deleteChecklistItem = async (
  tripId: string, itemId: string, userId: string
) => {
  await verifyTripOwner(tripId, userId);

  const { rowCount } = await pool.query(
    `DELETE FROM trip_checklist WHERE id = $1 AND trip_id = $2`,
    [itemId, tripId]
  );
  if (!rowCount) throw makeErr('Checklist item not found', 404);
};

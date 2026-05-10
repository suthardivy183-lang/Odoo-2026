import pool from '../database/pool';
import { CreateNoteInput, UpdateNoteInput } from '../validators/notes.validator';

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

export const getNotes = async (tripId: string, userId: string, stopId?: string) => {
  await verifyTripOwner(tripId, userId);

  const conditions = [`n.trip_id = $1`];
  const values: unknown[] = [tripId];

  if (stopId) {
    conditions.push(`n.stop_id = $2`);
    values.push(stopId);
  }

  const { rows } = await pool.query(
    `SELECT n.*, ts.city_id,
            c.name AS stop_city_name
     FROM trip_notes n
     LEFT JOIN trip_stops ts ON ts.id = n.stop_id
     LEFT JOIN cities c ON c.id = ts.city_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY n.created_at DESC`,
    values
  );
  return rows;
};

export const createNote = async (
  tripId: string, userId: string, input: CreateNoteInput
) => {
  await verifyTripOwner(tripId, userId);

  // If stop_id provided, verify it belongs to this trip
  if (input.stop_id) {
    const { rows } = await pool.query(
      `SELECT id FROM trip_stops WHERE id = $1 AND trip_id = $2`,
      [input.stop_id, tripId]
    );
    if (!rows[0]) throw makeErr('Stop not found on this trip', 404);
  }

  const { rows } = await pool.query(
    `INSERT INTO trip_notes (trip_id, stop_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [tripId, input.stop_id ?? null, input.content]
  );
  return rows[0];
};

export const updateNote = async (
  tripId: string, noteId: string, userId: string, input: UpdateNoteInput
) => {
  await verifyTripOwner(tripId, userId);

  const setClauses: string[] = [];
  const values: unknown[]    = [];
  let idx = 1;

  if (input.content !== undefined) {
    setClauses.push(`content = $${idx++}`);
    values.push(input.content);
  }
  if ('stop_id' in input) {
    setClauses.push(`stop_id = $${idx++}`);
    values.push(input.stop_id);
  }
  setClauses.push(`updated_at = NOW()`);
  values.push(noteId, tripId);

  const { rows } = await pool.query(
    `UPDATE trip_notes SET ${setClauses.join(', ')}
     WHERE id = $${idx} AND trip_id = $${idx + 1}
     RETURNING *`,
    values
  );
  if (!rows[0]) throw makeErr('Note not found', 404);
  return rows[0];
};

export const deleteNote = async (
  tripId: string, noteId: string, userId: string
) => {
  await verifyTripOwner(tripId, userId);

  const { rowCount } = await pool.query(
    `DELETE FROM trip_notes WHERE id = $1 AND trip_id = $2`,
    [noteId, tripId]
  );
  if (!rowCount) throw makeErr('Note not found', 404);
};

import pool from '../database/pool';
import { AddStopInput, UpdateStopInput, ReorderInput } from '../validators/stop.validator';
import { requireTripAccess } from './tripAccess.service';

const notFound = (msg = 'Stop not found') => {
  const e = new Error(msg) as Error & { status: number };
  e.status = 404;
  return e;
};

const verifyTripOwner = async (tripId: string, userId: string) => {
  return requireTripAccess(tripId, userId);
};

export const addStop = async (tripId: string, userId: string, input: AddStopInput) => {
  const trip = await verifyTripOwner(tripId, userId);

  // Validate stop dates are within trip range
  if (input.arrival_date < trip.start_date.toISOString().slice(0, 10)) {
    const e = new Error('Stop arrival_date is before trip start_date') as Error & { status: number };
    e.status = 400;
    throw e;
  }
  if (input.departure_date > trip.end_date.toISOString().slice(0, 10)) {
    const e = new Error('Stop departure_date is after trip end_date') as Error & { status: number };
    e.status = 400;
    throw e;
  }

  // Auto-assign stop_order if not provided (append at end)
  let stopOrder = input.stop_order;
  if (stopOrder === undefined) {
    const { rows } = await pool.query(
      `SELECT COALESCE(MAX(stop_order) + 1, 0) AS next_order FROM trip_stops WHERE trip_id = $1`,
      [tripId]
    );
    stopOrder = rows[0].next_order;
  }

  const { rows } = await pool.query(
    `INSERT INTO trip_stops (trip_id, city_id, stop_order, arrival_date, departure_date, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [tripId, input.city_id, stopOrder, input.arrival_date, input.departure_date, input.notes ?? null]
  );

  // Return stop with city info
  const stop = rows[0];
  const cityRes = await pool.query(
    `SELECT id, name, country, region, cost_index, image_url FROM cities WHERE id = $1`,
    [stop.city_id]
  );
  return { ...stop, city: cityRes.rows[0] };
};

export const getStops = async (tripId: string, userId: string) => {
  await verifyTripOwner(tripId, userId);

  const { rows } = await pool.query(
    `SELECT ts.*,
            c.name AS city_name, c.country, c.region, c.cost_index, c.image_url,
            COUNT(sa.id)::int AS activity_count
     FROM trip_stops ts
     JOIN cities c ON c.id = ts.city_id
     LEFT JOIN stop_activities sa ON sa.stop_id = ts.id
     WHERE ts.trip_id = $1
     GROUP BY ts.id, c.id
     ORDER BY ts.stop_order ASC`,
    [tripId]
  );
  return rows;
};

export const updateStop = async (
  tripId: string, stopId: string, userId: string, input: UpdateStopInput
) => {
  await verifyTripOwner(tripId, userId);

  const { rows } = await pool.query(
    `UPDATE trip_stops SET
       arrival_date   = COALESCE($1, arrival_date),
       departure_date = COALESCE($2, departure_date),
       notes          = COALESCE($3, notes)
     WHERE id = $4 AND trip_id = $5
     RETURNING *`,
    [input.arrival_date ?? null, input.departure_date ?? null, input.notes ?? null, stopId, tripId]
  );
  if (!rows[0]) throw notFound();
  return rows[0];
};

export const deleteStop = async (tripId: string, stopId: string, userId: string) => {
  await verifyTripOwner(tripId, userId);
  const { rowCount } = await pool.query(
    `DELETE FROM trip_stops WHERE id = $1 AND trip_id = $2`,
    [stopId, tripId]
  );
  if (!rowCount) throw notFound();
};

export const reorderStops = async (tripId: string, userId: string, input: ReorderInput) => {
  await verifyTripOwner(tripId, userId);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Shift all to a high temp range to avoid unique constraint conflicts during swap
    await client.query(
      `UPDATE trip_stops SET stop_order = stop_order + 10000 WHERE trip_id = $1`,
      [tripId]
    );
    for (const { id, stop_order } of input.stops) {
      await client.query(
        `UPDATE trip_stops SET stop_order = $1 WHERE id = $2 AND trip_id = $3`,
        [stop_order, id, tripId]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return getStops(tripId, userId);
};

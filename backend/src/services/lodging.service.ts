import pool from '../database/pool';
import { CreateLodgingInput, UpdateLodgingInput } from '../validators/lodging.validator';
import { makeAccessErr, requireTripAccess } from './tripAccess.service';

const toDateOnly = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
};

const getTripStop = async (tripId: string, stopId: string) => {
  const { rows } = await pool.query(
    `SELECT ts.id, ts.trip_id, ts.city_id, ts.arrival_date, ts.departure_date,
            c.name AS city_name, c.country
     FROM trip_stops ts
     JOIN cities c ON c.id = ts.city_id
     WHERE ts.id = $1 AND ts.trip_id = $2`,
    [stopId, tripId]
  );

  return rows[0] || null;
};

export const syncLodgingBudget = async (tripId: string) => {
  const { rows } = await pool.query(
    `WITH lodging_total AS (
       SELECT COALESCE(SUM(GREATEST(1, check_out - check_in) * nightly_rate), 0) AS total
       FROM trip_lodgings
       WHERE trip_id = $1
     )
     UPDATE trip_budgets
     SET accommodation_cost = lodging_total.total,
         updated_at = NOW()
     FROM lodging_total
     WHERE trip_budgets.trip_id = $1
     RETURNING trip_budgets.*`,
    [tripId]
  );

  return rows[0] || null;
};

export const getTripLodging = async (tripId: string, userId: string) => {
  await requireTripAccess(tripId, userId);

  const [{ rows: options }, { rows: lodgings }] = await Promise.all([
    pool.query(
      `SELECT lo.*, c.name AS city_name, c.country
       FROM lodging_options lo
       JOIN cities c ON c.id = lo.city_id
       WHERE lo.city_id IN (
         SELECT city_id FROM trip_stops WHERE trip_id = $1
       )
       ORDER BY c.name ASC, lo.rating DESC, lo.nightly_rate ASC`,
      [tripId]
    ),
    pool.query(
      `SELECT tl.*,
              ts.city_id, c.name AS city_name, c.country,
              COALESCE(lo.name, tl.custom_name) AS name,
              lo.lodging_type, lo.rating, lo.booking_url, lo.amenities, lo.image_url
       FROM trip_lodgings tl
       JOIN trip_stops ts ON ts.id = tl.stop_id
       JOIN cities c ON c.id = ts.city_id
       LEFT JOIN lodging_options lo ON lo.id = tl.lodging_option_id
       WHERE tl.trip_id = $1
       ORDER BY tl.check_in ASC, c.name ASC, tl.created_at DESC`,
      [tripId]
    ),
  ]);

  const total = lodgings.reduce((sum, lodging) => {
    const checkIn = new Date(lodging.check_in);
    const checkOut = new Date(lodging.check_out);
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (24 * 60 * 60 * 1000)));
    return sum + nights * Number(lodging.nightly_rate || 0);
  }, 0);

  return {
    options,
    lodgings,
    total: Number(total.toFixed(2)),
  };
};

export const createTripLodging = async (tripId: string, userId: string, input: CreateLodgingInput) => {
  await requireTripAccess(tripId, userId);

  const stop = await getTripStop(tripId, input.stop_id);
  if (!stop) throw makeAccessErr('Stop not found', 404);

  let option = null;
  if (input.lodging_option_id) {
    const { rows } = await pool.query(
      `SELECT * FROM lodging_options WHERE id = $1 AND city_id = $2`,
      [input.lodging_option_id, stop.city_id]
    );
    option = rows[0];
    if (!option) throw makeAccessErr('Lodging option is not available for this stop city', 400);
  }

  if (input.check_in < toDateOnly(stop.arrival_date) || input.check_out > toDateOnly(stop.departure_date)) {
    throw makeAccessErr('Lodging dates must stay within the stop dates', 400);
  }

  const { rows } = await pool.query(
    `INSERT INTO trip_lodgings
      (trip_id, stop_id, lodging_option_id, custom_name, check_in, check_out, nightly_rate, currency, guests, status, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      tripId,
      input.stop_id,
      input.lodging_option_id ?? null,
      input.custom_name ?? null,
      input.check_in,
      input.check_out,
      input.nightly_rate ?? Number(option?.nightly_rate || 0),
      (input.currency ?? option?.currency ?? 'USD').toUpperCase(),
      input.guests ?? 2,
      input.status ?? 'saved',
      input.notes ?? null,
    ]
  );

  return rows[0];
};

export const updateTripLodging = async (
  tripId: string,
  lodgingId: string,
  userId: string,
  input: UpdateLodgingInput
) => {
  await requireTripAccess(tripId, userId);

  const { rows } = await pool.query(
    `UPDATE trip_lodgings
     SET status = COALESCE($1, status),
         notes = COALESCE($2, notes)
     WHERE id = $3 AND trip_id = $4
     RETURNING *`,
    [input.status ?? null, input.notes ?? null, lodgingId, tripId]
  );

  if (!rows[0]) throw makeAccessErr('Lodging not found', 404);
  return rows[0];
};

export const deleteTripLodging = async (tripId: string, lodgingId: string, userId: string) => {
  await requireTripAccess(tripId, userId);

  const { rowCount } = await pool.query(
    `DELETE FROM trip_lodgings WHERE id = $1 AND trip_id = $2`,
    [lodgingId, tripId]
  );

  if (!rowCount) throw makeAccessErr('Lodging not found', 404);
};

import pool from '../database/pool';
import { requireTripAccess } from './tripAccess.service';
import { CreateReservationInput, UpdateReservationInput } from '../validators/reservation.validator';

const notFound = () => {
  const e = new Error('Reservation not found') as Error & { status: number };
  e.status = 404;
  return e;
};

export const listReservations = async (tripId: string, userId: string) => {
  await requireTripAccess(tripId, userId);
  const { rows } = await pool.query(
    `SELECT r.*, u.name AS created_by_name
     FROM trip_reservations r
     LEFT JOIN users u ON u.id = r.created_by
     WHERE r.trip_id = $1
     ORDER BY r.start_date ASC NULLS LAST, r.start_time ASC NULLS LAST, r.created_at ASC`,
    [tripId]
  );
  return rows;
};

export const createReservation = async (tripId: string, userId: string, input: CreateReservationInput) => {
  await requireTripAccess(tripId, userId);
  const { rows } = await pool.query(
    `INSERT INTO trip_reservations
       (trip_id, type, title, provider, booking_ref, from_location, to_location,
        start_date, start_time, end_date, end_time, cost, notes, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      tripId,
      input.type,
      input.title,
      input.provider      ?? null,
      input.booking_ref   ?? null,
      input.from_location ?? null,
      input.to_location   ?? null,
      input.start_date    ?? null,
      input.start_time    ?? null,
      input.end_date      ?? null,
      input.end_time      ?? null,
      input.cost          ?? null,
      input.notes         ?? null,
      userId,
    ]
  );
  return rows[0];
};

export const updateReservation = async (
  tripId: string, reservationId: string, userId: string, input: UpdateReservationInput
) => {
  await requireTripAccess(tripId, userId);
  const { rows } = await pool.query(
    `UPDATE trip_reservations SET
       type          = COALESCE($1, type),
       title         = COALESCE($2, title),
       provider      = COALESCE($3, provider),
       booking_ref   = COALESCE($4, booking_ref),
       from_location = COALESCE($5, from_location),
       to_location   = COALESCE($6, to_location),
       start_date    = COALESCE($7, start_date),
       start_time    = COALESCE($8, start_time),
       end_date      = COALESCE($9, end_date),
       end_time      = COALESCE($10, end_time),
       cost          = COALESCE($11, cost),
       notes         = COALESCE($12, notes)
     WHERE id = $13 AND trip_id = $14
     RETURNING *`,
    [
      input.type          ?? null,
      input.title         ?? null,
      input.provider      ?? null,
      input.booking_ref   ?? null,
      input.from_location ?? null,
      input.to_location   ?? null,
      input.start_date    ?? null,
      input.start_time    ?? null,
      input.end_date      ?? null,
      input.end_time      ?? null,
      input.cost          ?? null,
      input.notes         ?? null,
      reservationId,
      tripId,
    ]
  );
  if (!rows[0]) throw notFound();
  return rows[0];
};

export const deleteReservation = async (tripId: string, reservationId: string, userId: string) => {
  await requireTripAccess(tripId, userId);
  const { rowCount } = await pool.query(
    `DELETE FROM trip_reservations WHERE id = $1 AND trip_id = $2`,
    [reservationId, tripId]
  );
  if (!rowCount) throw notFound();
};

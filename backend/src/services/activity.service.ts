import pool from '../database/pool';
import {
  ActivityQueryInput,
  AddStopActivityInput,
  UpdateStopActivityInput,
} from '../validators/activity.validator';
import { requireTripAccess } from './tripAccess.service';

const makeErr = (msg: string, status: number) => {
  const e = new Error(msg) as Error & { status: number };
  e.status = status;
  return e;
};

// ── Public: browse activities ────────────────────────────────────────────────

export const searchActivities = async (params: ActivityQueryInput) => {
  const conditions: string[] = [];
  const values: unknown[]    = [];
  let idx = 1;

  if (params.city_id) {
    conditions.push(`a.city_id = $${idx++}`);
    values.push(params.city_id);
  }
  if (params.type) {
    conditions.push(`a.type = $${idx++}`);
    values.push(params.type);
  }
  if (params.min_cost !== undefined) {
    conditions.push(`a.cost >= $${idx++}`);
    values.push(params.min_cost);
  }
  if (params.max_cost !== undefined) {
    conditions.push(`a.cost <= $${idx++}`);
    values.push(params.max_cost);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT a.*, c.name AS city_name, c.country
     FROM activities a
     JOIN cities c ON c.id = a.city_id
     ${where}
     ORDER BY a.type, a.cost ASC`,
    values
  );
  return rows;
};

export const getActivityById = async (id: number) => {
  const { rows } = await pool.query(
    `SELECT a.*, c.name AS city_name, c.country, c.region
     FROM activities a
     JOIN cities c ON c.id = a.city_id
     WHERE a.id = $1`,
    [id]
  );
  if (!rows[0]) throw makeErr('Activity not found', 404);
  return rows[0];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const verifyStopOwnership = async (tripId: string, stopId: string, userId: string) => {
  await requireTripAccess(tripId, userId);
  const { rows } = await pool.query(
    `SELECT ts.id, ts.city_id
     FROM trip_stops ts
     WHERE ts.id = $1 AND ts.trip_id = $2`,
    [stopId, tripId]
  );
  if (!rows[0]) throw makeErr('Stop not found', 404);
  return rows[0];
};

// ── Stop activities ──────────────────────────────────────────────────────────

export const addStopActivity = async (
  tripId: string, stopId: string, userId: string, input: AddStopActivityInput
) => {
  const stop = await verifyStopOwnership(tripId, stopId, userId);

  // Ensure activity belongs to the stop's city
  const actRes = await pool.query(
    `SELECT id, city_id, name, cost FROM activities WHERE id = $1`,
    [input.activity_id]
  );
  if (!actRes.rows[0]) throw makeErr('Activity not found', 404);
  if (actRes.rows[0].city_id !== stop.city_id) {
    throw makeErr('Activity does not belong to this stop\'s city', 400);
  }

  const { rows } = await pool.query(
    `INSERT INTO stop_activities (stop_id, activity_id, scheduled_date, scheduled_time, custom_cost)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      stopId,
      input.activity_id,
      input.scheduled_date ?? null,
      input.scheduled_time ?? null,
      input.custom_cost    ?? null,
    ]
  );

  // Return with full activity details
  const full = await pool.query(
    `SELECT sa.*,
            a.name, a.description, a.type, a.duration_hours,
            a.cost AS base_cost, a.image_url,
            c.name AS city_name
     FROM stop_activities sa
     JOIN activities a ON a.id = sa.activity_id
     JOIN cities     c ON c.id = a.city_id
     WHERE sa.id = $1`,
    [rows[0].id]
  );
  return full.rows[0];
};

export const getStopActivities = async (
  tripId: string, stopId: string, userId: string
) => {
  await verifyStopOwnership(tripId, stopId, userId);

  const { rows } = await pool.query(
    `SELECT sa.*,
            a.name, a.description, a.type, a.duration_hours,
            a.cost AS base_cost, a.image_url,
            c.name AS city_name,
            COALESCE(sa.custom_cost, a.cost) AS effective_cost
     FROM stop_activities sa
     JOIN activities a ON a.id = sa.activity_id
     JOIN cities     c ON c.id = a.city_id
     WHERE sa.stop_id = $1
     ORDER BY sa.scheduled_date, sa.scheduled_time`,
    [stopId]
  );
  return rows;
};

export const updateStopActivity = async (
  tripId: string, stopId: string, activityId: string,
  userId: string, input: UpdateStopActivityInput
) => {
  await verifyStopOwnership(tripId, stopId, userId);

  const { rows } = await pool.query(
    `UPDATE stop_activities SET
       scheduled_date = COALESCE($1, scheduled_date),
       scheduled_time = COALESCE($2, scheduled_time),
       custom_cost    = COALESCE($3, custom_cost)
     WHERE id = $4 AND stop_id = $5
     RETURNING *`,
    [
      input.scheduled_date ?? null,
      input.scheduled_time ?? null,
      input.custom_cost    ?? null,
      activityId,
      stopId,
    ]
  );
  if (!rows[0]) throw makeErr('Activity not found on this stop', 404);
  return rows[0];
};

export const deleteStopActivity = async (
  tripId: string, stopId: string, activityId: string, userId: string
) => {
  await verifyStopOwnership(tripId, stopId, userId);
  const { rowCount } = await pool.query(
    `DELETE FROM stop_activities WHERE id = $1 AND stop_id = $2`,
    [activityId, stopId]
  );
  if (!rowCount) throw makeErr('Activity not found on this stop', 404);
};

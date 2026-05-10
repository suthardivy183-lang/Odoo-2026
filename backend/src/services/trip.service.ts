import pool from '../database/pool';
import { CreateTripInput, UpdateTripInput } from '../validators/trip.validator';
import { requireTripAccess, requireTripOwner } from './tripAccess.service';

const makeSlug = (name: string): string => {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}-${rand}`;
};

const notFound = (msg = 'Trip not found') => {
  const e = new Error(msg) as Error & { status: number };
  e.status = 404;
  return e;
};

export const createTrip = async (userId: string, input: CreateTripInput) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO trips (user_id, name, description, start_date, end_date,
                          total_budget, status, is_public, public_slug)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        userId,
        input.name,
        input.description ?? null,
        input.start_date,
        input.end_date,
        input.total_budget ?? null,
        input.status,
        input.is_public,
        input.is_public ? makeSlug(input.name) : null,
      ]
    );

    const trip = rows[0];

    // Auto-create an empty budget row so budget endpoints always have a row to update
    await client.query(
      `INSERT INTO trip_budgets (trip_id) VALUES ($1)`,
      [trip.id]
    );

    await client.query('COMMIT');
    return trip;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const getTrips = async (userId: string) => {
  const { rows } = await pool.query(
    `SELECT t.*,
            CASE WHEN t.user_id = $1 THEN 'owner' ELSE tm.role END AS access_role,
            owner.name AS owner_name,
            COUNT(DISTINCT ts.id)::int AS stop_count,
            COALESCE(tb.transport_cost + tb.accommodation_cost +
                     tb.meals_cost + tb.miscellaneous_cost, 0)
            + COALESCE((
                SELECT SUM(COALESCE(sa.custom_cost, a.cost))
                FROM trip_stops ts2
                JOIN stop_activities sa ON sa.stop_id = ts2.id
                JOIN activities      a  ON a.id = sa.activity_id
                WHERE ts2.trip_id = t.id
              ), 0) AS estimated_cost
     FROM trips t
     LEFT JOIN trip_members tm ON tm.trip_id = t.id AND tm.user_id = $1
     JOIN users owner ON owner.id = t.user_id
     LEFT JOIN trip_stops   ts ON ts.trip_id = t.id
     LEFT JOIN trip_budgets tb ON tb.trip_id = t.id
     WHERE t.user_id = $1 OR tm.user_id = $1
     GROUP BY t.id, tm.role, owner.name, tb.transport_cost, tb.accommodation_cost,
              tb.meals_cost, tb.miscellaneous_cost
     ORDER BY t.created_at DESC`,
    [userId]
  );
  return rows;
};

export const getTripById = async (id: string, userId: string) => {
  const { rows } = await pool.query(
    `SELECT t.*,
            CASE WHEN t.user_id = $2 THEN 'owner' ELSE tm.role END AS access_role,
            owner.name AS owner_name,
            COUNT(DISTINCT ts.id)::int AS stop_count,
            COALESCE(tb.transport_cost + tb.accommodation_cost +
                     tb.meals_cost + tb.miscellaneous_cost, 0)
            + COALESCE((
                SELECT SUM(COALESCE(sa.custom_cost, a.cost))
                FROM trip_stops ts2
                JOIN stop_activities sa ON sa.stop_id = ts2.id
                JOIN activities      a  ON a.id = sa.activity_id
                WHERE ts2.trip_id = t.id
              ), 0) AS estimated_cost
     FROM trips t
     LEFT JOIN trip_members tm ON tm.trip_id = t.id AND tm.user_id = $2
     JOIN users owner ON owner.id = t.user_id
     LEFT JOIN trip_stops   ts ON ts.trip_id = t.id
     LEFT JOIN trip_budgets tb ON tb.trip_id = t.id
     WHERE t.id = $1 AND (t.user_id = $2 OR tm.user_id = $2)
     GROUP BY t.id, tm.role, owner.name, tb.transport_cost, tb.accommodation_cost,
              tb.meals_cost, tb.miscellaneous_cost`,
    [id, userId]
  );
  if (!rows[0]) throw notFound();
  return rows[0];
};

export const updateTrip = async (id: string, userId: string, input: UpdateTripInput) => {
  if (input.is_public === undefined) {
    await requireTripAccess(id, userId);
  } else {
    await requireTripOwner(id, userId);
  }

  const existing = await pool.query(
    `SELECT id, is_public, public_slug FROM trips WHERE id = $1`,
    [id]
  );

  // Generate slug when making public for the first time
  let public_slug = existing.rows[0].public_slug;
  if (input.is_public === true && !public_slug) {
    public_slug = makeSlug(input.name ?? 'trip');
  }
  if (input.is_public === false) {
    public_slug = null;
  }

  const { rows } = await pool.query(
    `UPDATE trips SET
       name         = COALESCE($1, name),
       description  = COALESCE($2, description),
       start_date   = COALESCE($3, start_date),
       end_date     = COALESCE($4, end_date),
       total_budget = COALESCE($5, total_budget),
       status       = COALESCE($6, status),
       is_public    = COALESCE($7, is_public),
       public_slug  = $8
     WHERE id = $9
     RETURNING *`,
    [
      input.name         ?? null,
      input.description  ?? null,
      input.start_date   ?? null,
      input.end_date     ?? null,
      input.total_budget ?? null,
      input.status       ?? null,
      input.is_public    ?? null,
      public_slug,
      id,
    ]
  );
  return rows[0];
};

export const getPublicTrip = async (slug: string) => {
  const { rows } = await pool.query(
    `SELECT t.id, t.name, t.description, t.start_date, t.end_date,
            t.cover_photo, t.total_budget, t.status, t.public_slug,
            u.name AS owner_name
     FROM trips t
     JOIN users u ON u.id = t.user_id
     WHERE t.public_slug = $1 AND t.is_public = TRUE`,
    [slug]
  );
  if (!rows[0]) throw notFound('Trip not found or not public');

  const trip = rows[0];

  // Attach stops with their activities
  const { rows: stops } = await pool.query(
    `SELECT ts.*,
            c.name AS city_name, c.country, c.region, c.image_url,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', sa.id,
                  'activity_id', sa.activity_id,
                  'name', a.name,
                  'type', a.type,
                  'duration_hours', a.duration_hours,
                  'scheduled_date', sa.scheduled_date,
                  'scheduled_time', sa.scheduled_time,
                  'effective_cost', COALESCE(sa.custom_cost, a.cost)
                ) ORDER BY sa.scheduled_date, sa.scheduled_time
              ) FILTER (WHERE sa.id IS NOT NULL),
              '[]'
            ) AS activities
     FROM trip_stops ts
     JOIN cities c ON c.id = ts.city_id
     LEFT JOIN stop_activities sa ON sa.stop_id = ts.id
     LEFT JOIN activities a ON a.id = sa.activity_id
     WHERE ts.trip_id = $1
     GROUP BY ts.id, c.id
     ORDER BY ts.stop_order ASC`,
    [trip.id]
  );

  return { ...trip, stops };
};

export const deleteTrip = async (id: string, userId: string) => {
  await requireTripOwner(id, userId);
  const { rowCount } = await pool.query(
    `DELETE FROM trips WHERE id = $1`,
    [id]
  );
  if (!rowCount) throw notFound();
};

export const copyPublicTrip = async (slug: string, userId: string) => {
  const { rows } = await pool.query(
    `SELECT t.id, t.name, t.description, t.start_date, t.end_date, t.total_budget
     FROM trips t
     WHERE t.public_slug = $1 AND t.is_public = TRUE`,
    [slug]
  );
  if (!rows[0]) throw notFound('Trip not found or not public');
  const src = rows[0];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const newTrip = await client.query(
      `INSERT INTO trips (user_id, name, description, start_date, end_date, total_budget, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft')
       RETURNING id, name, start_date, end_date`,
      [userId, `Copy of ${src.name}`, src.description, src.start_date, src.end_date, src.total_budget]
    );
    const newTripId = newTrip.rows[0].id;

    // Copy budget row
    await client.query(
      `INSERT INTO trip_budgets (trip_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [newTripId]
    );

    const { rows: stops } = await client.query(
      `SELECT ts.id, ts.city_id, ts.arrival_date, ts.departure_date, ts.notes, ts.stop_order
       FROM trip_stops ts WHERE ts.trip_id = $1 ORDER BY ts.stop_order`,
      [src.id]
    );

    for (const stop of stops) {
      const newStop = await client.query(
        `INSERT INTO trip_stops (trip_id, city_id, arrival_date, departure_date, notes, stop_order)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [newTripId, stop.city_id, stop.arrival_date, stop.departure_date, stop.notes, stop.stop_order]
      );
      const newStopId = newStop.rows[0].id;

      const { rows: acts } = await client.query(
        `SELECT activity_id, scheduled_date, scheduled_time, custom_cost FROM stop_activities WHERE stop_id = $1`,
        [stop.id]
      );
      for (const act of acts) {
        await client.query(
          `INSERT INTO stop_activities (stop_id, activity_id, scheduled_date, scheduled_time, custom_cost)
           VALUES ($1, $2, $3, $4, $5)`,
          [newStopId, act.activity_id, act.scheduled_date, act.scheduled_time, act.custom_cost]
        );
      }
    }

    await client.query('COMMIT');
    return newTrip.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

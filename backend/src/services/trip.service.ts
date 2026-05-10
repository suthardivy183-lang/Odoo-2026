import pool from '../database/pool';
import { CreateTripInput, UpdateTripInput } from '../validators/trip.validator';

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
                          total_budget, is_public, public_slug)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        userId,
        input.name,
        input.description ?? null,
        input.start_date,
        input.end_date,
        input.total_budget,
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
            COUNT(ts.id)::int AS stop_count,
            COALESCE(tb.transport_cost + tb.accommodation_cost +
                     tb.meals_cost + tb.miscellaneous_cost, 0) AS estimated_cost
     FROM trips t
     LEFT JOIN trip_stops   ts ON ts.trip_id = t.id
     LEFT JOIN trip_budgets tb ON tb.trip_id = t.id
     WHERE t.user_id = $1
     GROUP BY t.id, tb.transport_cost, tb.accommodation_cost,
              tb.meals_cost, tb.miscellaneous_cost
     ORDER BY t.created_at DESC`,
    [userId]
  );
  return rows;
};

export const getTripById = async (id: string, userId: string) => {
  const { rows } = await pool.query(
    `SELECT t.*,
            COUNT(ts.id)::int AS stop_count,
            COALESCE(tb.transport_cost + tb.accommodation_cost +
                     tb.meals_cost + tb.miscellaneous_cost, 0) AS estimated_cost
     FROM trips t
     LEFT JOIN trip_stops   ts ON ts.trip_id = t.id
     LEFT JOIN trip_budgets tb ON tb.trip_id = t.id
     WHERE t.id = $1 AND t.user_id = $2
     GROUP BY t.id, tb.transport_cost, tb.accommodation_cost,
              tb.meals_cost, tb.miscellaneous_cost`,
    [id, userId]
  );
  if (!rows[0]) throw notFound();
  return rows[0];
};

export const updateTrip = async (id: string, userId: string, input: UpdateTripInput) => {
  const existing = await pool.query(
    `SELECT id, is_public, public_slug FROM trips WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  if (!existing.rows[0]) throw notFound();

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
       is_public    = COALESCE($6, is_public),
       public_slug  = $7
     WHERE id = $8 AND user_id = $9
     RETURNING *`,
    [
      input.name         ?? null,
      input.description  ?? null,
      input.start_date   ?? null,
      input.end_date     ?? null,
      input.total_budget ?? null,
      input.is_public    ?? null,
      public_slug,
      id,
      userId,
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
  const { rowCount } = await pool.query(
    `DELETE FROM trips WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  if (!rowCount) throw notFound();
};

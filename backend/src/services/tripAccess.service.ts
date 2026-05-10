import pool from '../database/pool';

export const makeAccessErr = (msg: string, status: number) => {
  const e = new Error(msg) as Error & { status: number };
  e.status = status;
  return e;
};

export const getTripAccess = async (tripId: string, userId: string) => {
  const { rows } = await pool.query(
    `SELECT t.id, t.user_id, t.start_date, t.end_date,
            CASE
              WHEN t.user_id = $2 THEN 'owner'
              WHEN tm.user_id IS NOT NULL THEN tm.role
              ELSE NULL
            END AS access_role
     FROM trips t
     LEFT JOIN trip_members tm ON tm.trip_id = t.id AND tm.user_id = $2
     WHERE t.id = $1`,
    [tripId, userId]
  );

  return rows[0] || null;
};

export const requireTripAccess = async (tripId: string, userId: string) => {
  const trip = await getTripAccess(tripId, userId);
  if (!trip?.access_role) throw makeAccessErr('Trip not found', 404);
  return trip;
};

export const requireTripOwner = async (tripId: string, userId: string) => {
  const trip = await getTripAccess(tripId, userId);
  if (!trip?.access_role) throw makeAccessErr('Trip not found', 404);
  if (trip.access_role !== 'owner') throw makeAccessErr('Only the trip owner can do this', 403);
  return trip;
};

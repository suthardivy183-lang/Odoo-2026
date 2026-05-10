import pool from '../database/pool';
import { requireTripOwner, makeAccessErr } from './tripAccess.service';

export const getTripMembers = async (tripId: string, userId: string) => {
  await requireTripOwner(tripId, userId);

  const { rows } = await pool.query(
    `SELECT 'owner' AS role, u.id AS user_id, u.name, u.email, t.created_at
     FROM trips t
     JOIN users u ON u.id = t.user_id
     WHERE t.id = $1
     UNION ALL
     SELECT tm.role, u.id AS user_id, u.name, u.email, tm.created_at
     FROM trip_members tm
     JOIN users u ON u.id = tm.user_id
     WHERE tm.trip_id = $1
     ORDER BY created_at ASC`,
    [tripId]
  );

  return rows;
};

export const inviteTripMember = async (tripId: string, ownerId: string, email: string) => {
  await requireTripOwner(tripId, ownerId);

  const userRes = await pool.query(
    `SELECT id, name, email FROM users WHERE email = $1`,
    [email]
  );
  const user = userRes.rows[0];
  if (!user) throw makeAccessErr('No registered user found with that email', 404);
  if (user.id === ownerId) throw makeAccessErr('You already own this trip', 400);

  const { rows } = await pool.query(
    `INSERT INTO trip_members (trip_id, user_id, invited_by)
     VALUES ($1, $2, $3)
     ON CONFLICT (trip_id, user_id) DO UPDATE SET role = EXCLUDED.role
     RETURNING id, user_id, role, created_at`,
    [tripId, user.id, ownerId]
  );

  return { ...rows[0], name: user.name, email: user.email };
};

export const removeTripMember = async (tripId: string, ownerId: string, memberUserId: string) => {
  await requireTripOwner(tripId, ownerId);

  const { rowCount } = await pool.query(
    `DELETE FROM trip_members WHERE trip_id = $1 AND user_id = $2`,
    [tripId, memberUserId]
  );
  if (!rowCount) throw makeAccessErr('Trip member not found', 404);
};

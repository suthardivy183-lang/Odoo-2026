import pool from '../database/pool';
import { AddStopInput, UpdateStopInput, ReorderInput } from '../validators/stop.validator';
import { requireTripAccess } from './tripAccess.service';

type StopWithCoords = {
  id: string;
  stop_order: number;
  city_name: string;
  country: string;
  arrival_date: Date | string;
  departure_date: Date | string;
  latitude: string | number | null;
  longitude: string | number | null;
};

type TripDateRange = {
  start_date: Date | string;
  end_date: Date | string;
};

const notFound = (msg = 'Stop not found') => {
  const e = new Error(msg) as Error & { status: number };
  e.status = 404;
  return e;
};

const makeErr = (msg: string, status: number) => {
  const e = new Error(msg) as Error & { status: number };
  e.status = status;
  return e;
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const distanceKm = (a: StopWithCoords, b: StopWithCoords) => {
  const lat1 = Number(a.latitude);
  const lon1 = Number(a.longitude);
  const lat2 = Number(b.latitude);
  const lon2 = Number(b.longitude);
  const earthRadiusKm = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
};

const routeDistanceKm = (stops: StopWithCoords[]) => {
  return stops.slice(1).reduce((total, stop, index) => total + distanceKm(stops[index], stop), 0);
};

const routeLegs = (stops: StopWithCoords[]) => {
  return stops.slice(1).map((stop, index) => ({
    from_stop_id: stops[index].id,
    to_stop_id: stop.id,
    from: stops[index].city_name,
    to: stop.city_name,
    distance_km: Number(distanceKm(stops[index], stop).toFixed(1)),
  }));
};

const nearestNeighborRoute = (start: StopWithCoords, stops: StopWithCoords[]) => {
  const route = [start];
  const remaining = stops.filter(stop => stop.id !== start.id);

  while (remaining.length > 0) {
    const current = route[route.length - 1];
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    remaining.forEach((candidate, index) => {
      const d = distanceKm(current, candidate);
      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = index;
      }
    });

    route.push(remaining.splice(bestIndex, 1)[0]);
  }

  return route;
};

const improveWithTwoOpt = (route: StopWithCoords[]) => {
  let best = [...route];
  let bestDistance = routeDistanceKm(best);
  let improved = true;

  while (improved) {
    improved = false;

    for (let i = 1; i < best.length - 2; i += 1) {
      for (let j = i + 1; j < best.length - 1; j += 1) {
        const candidate = [
          ...best.slice(0, i),
          ...best.slice(i, j + 1).reverse(),
          ...best.slice(j + 1),
        ];
        const candidateDistance = routeDistanceKm(candidate);

        if (candidateDistance < bestDistance) {
          best = candidate;
          bestDistance = candidateDistance;
          improved = true;
        }
      }
    }
  }

  return best;
};

const toUtcDate = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const toSqlDate = (date: Date) => date.toISOString().slice(0, 10);

const inclusiveDays = (start: Date | string, end: Date | string) => {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((toUtcDate(end).getTime() - toUtcDate(start).getTime()) / msPerDay) + 1;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
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
    `SELECT id, name, country, region, cost_index, image_url, latitude, longitude FROM cities WHERE id = $1`,
    [stop.city_id]
  );
  return { ...stop, city: cityRes.rows[0] };
};

export const getStops = async (tripId: string, userId: string) => {
  await verifyTripOwner(tripId, userId);

  const { rows } = await pool.query(
    `SELECT ts.*,
            c.name AS city_name, c.country, c.region, c.cost_index, c.image_url, c.latitude, c.longitude,
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

export const optimizeStops = async (tripId: string, userId: string) => {
  const trip = await verifyTripOwner(tripId, userId) as TripDateRange;

  const { rows } = await pool.query<StopWithCoords>(
    `SELECT ts.id, ts.stop_order, ts.arrival_date, ts.departure_date,
            c.name AS city_name, c.country, c.latitude, c.longitude
     FROM trip_stops ts
     JOIN cities c ON c.id = ts.city_id
     WHERE ts.trip_id = $1
     ORDER BY ts.stop_order ASC`,
    [tripId]
  );

  if (rows.length < 3) {
    throw makeErr('Add at least three stops to optimize the route', 400);
  }

  const missingCoords = rows.filter(stop => !Number.isFinite(Number(stop.latitude)) || !Number.isFinite(Number(stop.longitude)));
  if (missingCoords.length > 0) {
    throw makeErr('All stops need map coordinates before route optimization', 400);
  }

  const currentDistanceKm = routeDistanceKm(rows);
  const optimizedRoute = rows
    .map(start => nearestNeighborRoute(start, rows))
    .map(improveWithTwoOpt)
    .sort((a, b) => routeDistanceKm(a) - routeDistanceKm(b))[0];
  const optimizedDistanceKm = routeDistanceKm(optimizedRoute);

  const tripDays = inclusiveDays(trip.start_date, trip.end_date);
  const stopDurations = new Map(rows.map(stop => [
    stop.id,
    inclusiveDays(stop.arrival_date, stop.departure_date),
  ]));
  const requiredDays = optimizedRoute.reduce((total, stop) => total + (stopDurations.get(stop.id) || 1), 0);
  const scheduleAdjusted = requiredDays <= tripDays;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE trip_stops SET stop_order = stop_order + 10000 WHERE trip_id = $1`,
      [tripId]
    );

    let cursor = toUtcDate(trip.start_date);
    for (const [index, stop] of optimizedRoute.entries()) {
      const durationDays = stopDurations.get(stop.id) || 1;
      const arrivalDate = cursor;
      const departureDate = addDays(arrivalDate, durationDays - 1);

      if (scheduleAdjusted) {
        await client.query(
          `UPDATE trip_stops
           SET stop_order = $1, arrival_date = $2, departure_date = $3
           WHERE id = $4 AND trip_id = $5`,
          [index, toSqlDate(arrivalDate), toSqlDate(departureDate), stop.id, tripId]
        );
        cursor = addDays(departureDate, 1);
      } else {
        await client.query(
          `UPDATE trip_stops SET stop_order = $1 WHERE id = $2 AND trip_id = $3`,
          [index, stop.id, tripId]
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const stops = await getStops(tripId, userId);

  return {
    stops,
    before_km: Number(currentDistanceKm.toFixed(1)),
    after_km: Number(optimizedDistanceKm.toFixed(1)),
    saved_km: Number(Math.max(0, currentDistanceKm - optimizedDistanceKm).toFixed(1)),
    legs: routeLegs(optimizedRoute),
    schedule_adjusted: scheduleAdjusted,
    schedule_message: scheduleAdjusted
      ? 'Stop dates were rearranged from the trip start date while preserving each stop duration.'
      : 'Route order was optimized, but dates were left unchanged because stop durations exceed the trip date range.',
  };
};

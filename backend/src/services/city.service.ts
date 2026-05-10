import pool from '../database/pool';

export const searchCities = async (params: {
  q?: string;
  country?: string;
  region?: string;
}) => {
  const conditions: string[] = [];
  const values: unknown[]    = [];
  let idx = 1;

  if (params.q) {
    conditions.push(`name ILIKE $${idx++}`);
    values.push(`%${params.q}%`);
  }
  if (params.country) {
    conditions.push(`LOWER(country) = LOWER($${idx++})`);
    values.push(params.country);
  }
  if (params.region) {
    conditions.push(`LOWER(region) = LOWER($${idx++})`);
    values.push(params.region);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT id, name, country, region, description, cost_index, popularity_score, image_url
     FROM cities ${where}
     ORDER BY popularity_score DESC, name ASC`,
    values
  );
  return rows;
};

export const getCityById = async (id: number) => {
  const cityRes = await pool.query(
    `SELECT id, name, country, region, description, cost_index, popularity_score, image_url
     FROM cities WHERE id = $1`,
    [id]
  );

  const city = cityRes.rows[0];
  if (!city) {
    const e = new Error('City not found') as Error & { status: number };
    e.status = 404;
    throw e;
  }

  const { rows: activities } = await pool.query(
    `SELECT id, name, description, type, duration_hours, cost, image_url
     FROM activities WHERE city_id = $1 ORDER BY type, name`,
    [id]
  );

  return { ...city, activities };
};

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../database/pool';
import { RegisterInput, LoginInput, UpdateProfileInput, ChangePasswordInput } from '../validators/auth.validator';

const SALT_ROUNDS = 12;

const signToken = (id: string, email: string): string =>
  jwt.sign({ id, email }, process.env.JWT_SECRET || 'secret', {
    expiresIn: (process.env.JWT_EXPIRE || '7d') as any,
  });

export const registerUser = async (input: RegisterInput) => {
  const { name, email, password } = input;

  const existing = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );
  if (existing.rowCount && existing.rowCount > 0) {
    const err = new Error('Email already in use') as Error & { status: number };
    err.status = 409;
    throw err;
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, profile_photo, language_pref, created_at`,
    [name, email, password_hash]
  );

  const user = result.rows[0];
  const token = signToken(user.id, user.email);
  return { user, token };
};

export const loginUser = async (input: LoginInput) => {
  const { email, password } = input;

  const result = await pool.query(
    `SELECT id, name, email, password_hash, profile_photo, language_pref, created_at
     FROM users WHERE email = $1`,
    [email]
  );

  const user = result.rows[0];
  if (!user) {
    const err = new Error('Invalid email or password') as Error & { status: number };
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid email or password') as Error & { status: number };
    err.status = 401;
    throw err;
  }

  const { password_hash: _, ...safeUser } = user;
  const token = signToken(safeUser.id, safeUser.email);
  return { user: safeUser, token };
};

export const updateProfile = async (id: string, input: UpdateProfileInput) => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (input.name)          { fields.push(`name = $${idx++}`);          values.push(input.name); }
  if (input.email)         { fields.push(`email = $${idx++}`);         values.push(input.email); }
  if (input.language_pref) { fields.push(`language_pref = $${idx++}`); values.push(input.language_pref); }

  if (input.email) {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1 AND id <> $2', [input.email, id]);
    if (existing.rowCount && existing.rowCount > 0) {
      const err = new Error('Email already in use') as Error & { status: number };
      err.status = 409;
      throw err;
    }
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
     RETURNING id, name, email, profile_photo, language_pref, created_at`,
    values
  );
  return result.rows[0];
};

export const changePassword = async (id: string, input: ChangePasswordInput) => {
  const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [id]);
  const user = result.rows[0];
  if (!user) {
    const err = new Error('User not found') as Error & { status: number };
    err.status = 404;
    throw err;
  }
  const valid = await bcrypt.compare(input.current_password, user.password_hash);
  if (!valid) {
    const err = new Error('Current password is incorrect') as Error & { status: number };
    err.status = 400;
    throw err;
  }
  const password_hash = await bcrypt.hash(input.new_password, SALT_ROUNDS);
  await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [password_hash, id]);
};

export const deleteAccount = async (id: string) => {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
};

export const getMe = async (id: string) => {
  const result = await pool.query(
    `SELECT id, name, email, profile_photo, language_pref, created_at
     FROM users WHERE id = $1`,
    [id]
  );

  const user = result.rows[0];
  if (!user) {
    const err = new Error('User not found') as Error & { status: number };
    err.status = 404;
    throw err;
  }

  return user;
};

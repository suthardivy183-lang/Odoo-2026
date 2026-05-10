import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../database/pool';
import { RegisterInput, LoginInput } from '../validators/auth.validator';

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

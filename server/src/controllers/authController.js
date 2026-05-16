/**
 * Авторизация: вход, регистрация, профиль текущего пользователя.
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_EXPIRES_IN, JWT_SECRET } from '../config.js';
import { pool } from '../db/database.js';

const LOGIN_MIN = 3;
const LOGIN_MAX = 100;
const PASSWORD_MIN = 6;
const BCRYPT_ROUNDS = 10;

function validateLogin(login) {
  const value = login?.trim();
  if (!value || typeof login !== 'string') {
    return { ok: false, message: 'Укажите логин' };
  }
  if (value.length < LOGIN_MIN || value.length > LOGIN_MAX) {
    return { ok: false, message: `Логин: от ${LOGIN_MIN} до ${LOGIN_MAX} символов` };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    return { ok: false, message: 'Логин: только латиница, цифры и _' };
  }
  return { ok: true, value };
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { ok: false, message: 'Укажите пароль' };
  }
  if (password.length < PASSWORD_MIN) {
    return { ok: false, message: `Пароль: минимум ${PASSWORD_MIN} символов` };
  }
  return { ok: true, value: password };
}

function issueToken(user) {
  return jwt.sign(
    { sub: user.id, login: user.login, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

function toPublicUser(row) {
  return { id: row.id, login: row.login, role: row.role };
}

export async function login(req, res) {
  const loginCheck = validateLogin(req.body?.login);
  const passwordCheck = validatePassword(req.body?.password);

  if (!loginCheck.ok) {
    return res.status(400).json({ message: loginCheck.message });
  }
  if (!passwordCheck.ok) {
    return res.status(400).json({ message: passwordCheck.message });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, login, password_hash, role
       FROM employees
       WHERE login = $1`,
      [loginCheck.value],
    );
    const user = rows[0];

    const passwordMatch = user
      ? await bcrypt.compare(passwordCheck.value, user.password_hash)
      : false;

    if (!user || !passwordMatch) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    return res.json({
      token: issueToken(user),
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error('[auth] login', error);
    return res.status(500).json({ message: 'Ошибка авторизации' });
  }
}

export async function register(req, res) {
  const loginCheck = validateLogin(req.body?.login);
  const passwordCheck = validatePassword(req.body?.password);

  if (!loginCheck.ok) {
    return res.status(400).json({ message: loginCheck.message });
  }
  if (!passwordCheck.ok) {
    return res.status(400).json({ message: passwordCheck.message });
  }

  try {
    const passwordHash = await bcrypt.hash(passwordCheck.value, BCRYPT_ROUNDS);
    const { rows } = await pool.query(
      `INSERT INTO employees (login, password_hash, role)
       VALUES ($1, $2, 'storekeeper')
       RETURNING id, login, role`,
      [loginCheck.value, passwordHash],
    );
    const user = rows[0];

    return res.status(201).json({
      token: issueToken(user),
      user: toPublicUser(user),
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Такой логин уже занят' });
    }
    console.error('[auth] register', error);
    return res.status(500).json({ message: 'Ошибка регистрации' });
  }
}

export async function me(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, login, role FROM employees WHERE id = $1`,
      [req.user.sub],
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }
    return res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error('[auth] me', error);
    return res.status(500).json({ message: 'Ошибка получения профиля' });
  }
}

import { createHmac, timingSafeEqual } from 'node:crypto';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const SECRET = process.env.AUTH_SECRET || 'leaflet-dev-secret-change-me';
export const COOKIE_NAME = 'leaflet_session';

function sign(payload: string): string {
  const hmac = createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${hmac}`;
}

function verify(token: string): string | null {
  const idx = token.lastIndexOf('.');
  if (idx === -1) return null;
  const payload = token.slice(0, idx);
  const signature = token.slice(idx + 1);
  const expected = createHmac('sha256', SECRET).update(payload).digest('hex');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  try {
    if (timingSafeEqual(sigBuf, expBuf)) return payload;
  } catch {
    return null;
  }
  return null;
}

export function createSessionToken(userId: number): string {
  return sign(String(userId));
}

export function verifySessionToken(token: string | undefined | null): number | null {
  if (!token) return null;
  const payload = verify(token);
  if (!payload) return null;
  const userId = parseInt(payload, 10);
  return Number.isNaN(userId) ? null : userId;
}

export type User = typeof users.$inferSelect;

export function getUserById(userId: number): User | null {
  const result = db.select().from(users).where(eq(users.id, userId)).all();
  return result[0] ?? null;
}

export function getUserFromToken(token: string | undefined | null): User | null {
  const userId = verifySessionToken(token);
  if (!userId) return null;
  return getUserById(userId);
}

export function findOrCreateUser(username: string): User {
  const existing = db.select().from(users).where(eq(users.username, username)).all();
  if (existing[0]) return existing[0];

  const created = db.insert(users).values({ username }).returning().all();
  return created[0];
}

import type { APIContext } from 'astro';
import { COOKIE_NAME, getUserFromToken, type User } from './auth';

export function getUserFromContext(context: APIContext): User | null {
  const token = context.cookies.get(COOKIE_NAME)?.value;
  return getUserFromToken(token);
}

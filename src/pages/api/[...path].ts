import type { APIRoute } from 'astro';
import { app } from '../../lib/api';

export const ALL: APIRoute = ({ request }) => {
  return app.fetch(request);
};

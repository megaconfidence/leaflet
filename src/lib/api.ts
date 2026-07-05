import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db';
import {
  COOKIE_NAME,
  createSessionToken,
  getUserFromToken,
  findOrCreateUser,
  type User,
} from './auth';

export const app = new Hono<{ Variables: { user: User | null } }>();

app.use('*', async (c, next) => {
  const token = getCookie(c, COOKIE_NAME);
  c.set('user', getUserFromToken(token));
  await next();
});

const requireAuth = async (c: Parameters<Parameters<typeof app.use>[1]>[0], next: () => Promise<void>) => {
  const user = c.get('user');
  if (!user) return c.redirect('/login?error=auth_required');
  await next();
};

app.post('/api/login', async (c) => {
  const body = await c.req.parseBody();
  const username = String(body.username || '').trim();
  if (!username) return c.redirect('/login?error=username_required');
  if (username.length > 50) return c.redirect('/login?error=username_too_long');

  const user = findOrCreateUser(username);
  const token = createSessionToken(user.id);
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return c.redirect('/dashboard');
});

app.post('/api/logout', (c) => {
  deleteCookie(c, COOKIE_NAME, { path: '/' });
  return c.redirect('/');
});

app.use('/api/posts', requireAuth);
app.use('/api/posts/*', requireAuth);

app.post('/api/posts', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  const title = String(body.title || '').trim();
  const content = String(body.content || '').trim();

  if (!title || !content) return c.redirect('/dashboard/new?error=missing_fields');

  const post = db
    .insert(schema.posts)
    .values({ title, content, authorId: user.id, status: 'draft' })
    .returning()
    .all()[0];

  return c.redirect(`/dashboard/edit/${post.id}`);
});

app.post('/api/posts/:id', async (c) => {
  const user = c.get('user')!;
  const postId = Number(c.req.param('id'));
  const existing = db.select().from(schema.posts).where(eq(schema.posts.id, postId)).all();
  if (!existing[0] || existing[0].authorId !== user.id) {
    return c.redirect('/dashboard?error=not_found');
  }

  const body = await c.req.parseBody();
  const title = String(body.title || '').trim();
  const content = String(body.content || '').trim();

  if (!title || !content) return c.redirect(`/dashboard/edit/${postId}?error=missing_fields`);

  db.update(schema.posts)
    .set({ title, content, updatedAt: new Date() })
    .where(eq(schema.posts.id, postId))
    .run();

  return c.redirect(`/dashboard/edit/${postId}?success=saved`);
});

app.post('/api/posts/:id/publish', async (c) => {
  const user = c.get('user')!;
  const postId = Number(c.req.param('id'));
  const existing = db.select().from(schema.posts).where(eq(schema.posts.id, postId)).all();
  if (!existing[0] || existing[0].authorId !== user.id) {
    return c.redirect('/dashboard?error=not_found');
  }

  db.update(schema.posts)
    .set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.posts.id, postId))
    .run();

  return c.redirect(`/dashboard/edit/${postId}?success=published`);
});

app.post('/api/posts/:id/unpublish', async (c) => {
  const user = c.get('user')!;
  const postId = Number(c.req.param('id'));
  const existing = db.select().from(schema.posts).where(eq(schema.posts.id, postId)).all();
  if (!existing[0] || existing[0].authorId !== user.id) {
    return c.redirect('/dashboard?error=not_found');
  }

  db.update(schema.posts)
    .set({ status: 'draft', updatedAt: new Date() })
    .where(eq(schema.posts.id, postId))
    .run();

  return c.redirect(`/dashboard/edit/${postId}?success=unpublished`);
});

app.post('/api/posts/:id/delete', async (c) => {
  const user = c.get('user')!;
  const postId = Number(c.req.param('id'));
  const existing = db.select().from(schema.posts).where(eq(schema.posts.id, postId)).all();
  if (!existing[0] || existing[0].authorId !== user.id) {
    return c.redirect('/dashboard?error=not_found');
  }

  db.delete(schema.reactions).where(eq(schema.reactions.postId, postId)).run();
  db.delete(schema.comments).where(eq(schema.comments.postId, postId)).run();
  db.delete(schema.posts).where(eq(schema.posts.id, postId)).run();

  return c.redirect('/dashboard?success=deleted');
});

app.post('/api/posts/:id/comments', async (c) => {
  const user = c.get('user')!;
  const postId = Number(c.req.param('id'));
  const post = db.select().from(schema.posts).where(eq(schema.posts.id, postId)).all();
  if (!post[0] || post[0].status !== 'published') {
    return c.redirect('/?error=post_not_found');
  }

  const body = await c.req.parseBody();
  const content = String(body.content || '').trim();
  if (!content) return c.redirect(`/posts/${postId}?error=comment_empty`);

  db.insert(schema.comments).values({ postId, authorId: user.id, content }).run();

  return c.redirect(`/posts/${postId}#comments`);
});

export const ALLOWED_REACTIONS = ['❤️', '👍', '🎉', '😂', '🤔', '🚀'] as const;

app.post('/api/posts/:id/reactions', async (c) => {
  const user = c.get('user')!;
  const postId = Number(c.req.param('id'));
  const post = db.select().from(schema.posts).where(eq(schema.posts.id, postId)).all();
  if (!post[0] || post[0].status !== 'published') {
    return c.redirect('/?error=post_not_found');
  }

  const body = await c.req.parseBody();
  const emoji = String(body.emoji || '');
  if (!ALLOWED_REACTIONS.includes(emoji as typeof ALLOWED_REACTIONS[number])) {
    return c.redirect(`/posts/${postId}?error=invalid_reaction`);
  }

  const existing = db
    .select()
    .from(schema.reactions)
    .where(eq(schema.reactions.postId, postId))
    .where(eq(schema.reactions.authorId, user.id))
    .all()[0];

  if (existing) {
    if (existing.emoji === emoji) {
      db.delete(schema.reactions).where(eq(schema.reactions.id, existing.id)).run();
    } else {
      db.update(schema.reactions).set({ emoji }).where(eq(schema.reactions.id, existing.id)).run();
    }
  } else {
    db.insert(schema.reactions).values({ postId, authorId: user.id, emoji }).run();
  }

  return c.redirect(`/posts/${postId}#reactions`);
});

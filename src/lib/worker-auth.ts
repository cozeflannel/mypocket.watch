import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import type { Worker, Company } from '@/types/database';

const WORKER_SESSION_COOKIE = 'pw_worker_session';
const TOKEN_EXPIRY_HOURS = 72; // Magic link valid for 72 hours
const SESSION_EXPIRY_HOURS = 24 * 30; // Session valid for 30 days

/**
 * Generate a magic link token for a worker.
 * Called by admin to send worker a portal link.
 */
export async function generateWorkerToken(workerId: string, companyId: string): Promise<string> {
  const supabase = await createClient();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  // Store token in worker's metadata
  const { data: worker } = await supabase
    .from('workers')
    .select('metadata')
    .eq('id', workerId)
    .single();

  const metadata = (worker?.metadata || {}) as Record<string, unknown>;
  metadata.portal_token = token;
  metadata.portal_token_expires = expiresAt;

  await supabase
    .from('workers')
    .update({ metadata })
    .eq('id', workerId)
    .eq('company_id', companyId);

  return token;
}

/**
 * Validate a magic link token and create a session.
 * Returns worker data if valid.
 */
export async function validateWorkerToken(token: string): Promise<{ worker: Worker; company: Company } | null> {
  const supabase = await createClient();

  // Find worker with this token
  const { data: workers } = await supabase
    .from('workers')
    .select('*')
    .eq('is_active', true);

  if (!workers) return null;

  const worker = workers.find((w: Worker) => {
    const meta = w.metadata as Record<string, unknown>;
    return meta?.portal_token === token;
  });

  if (!worker) return null;

  const meta = worker.metadata as Record<string, unknown>;
  const expires = meta.portal_token_expires as string;
  if (new Date(expires) < new Date()) return null;

  // Get company
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', worker.company_id)
    .single();

  if (!company) return null;

  // Create session token
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const sessionExpires = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  // Save session token to worker metadata
  const newMeta = { ...meta };
  newMeta.session_token = sessionToken;
  newMeta.session_expires = sessionExpires;
  // Clear the one-time portal token
  delete newMeta.portal_token;
  delete newMeta.portal_token_expires;

  await supabase
    .from('workers')
    .update({ metadata: newMeta })
    .eq('id', worker.id);

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(WORKER_SESSION_COOKIE, `${worker.id}:${sessionToken}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_EXPIRY_HOURS * 60 * 60,
  });

  return { worker: worker as Worker, company: company as Company };
}

/**
 * Get the current worker session from cookie.
 */
export async function getWorkerSession(): Promise<{ worker: Worker; company: Company } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(WORKER_SESSION_COOKIE);

  if (!sessionCookie?.value) return null;

  const [workerId, sessionToken] = sessionCookie.value.split(':');
  if (!workerId || !sessionToken) return null;

  const supabase = await createClient();

  const { data: worker } = await supabase
    .from('workers')
    .select('*')
    .eq('id', workerId)
    .eq('is_active', true)
    .single();

  if (!worker) return null;

  const meta = worker.metadata as Record<string, unknown>;
  if (meta?.session_token !== sessionToken) return null;

  const sessionExpires = meta.session_expires as string;
  if (!sessionExpires || new Date(sessionExpires) < new Date()) return null;

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', worker.company_id)
    .single();

  if (!company) return null;

  return { worker: worker as Worker, company: company as Company };
}

/**
 * Clear worker session.
 */
export async function clearWorkerSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(WORKER_SESSION_COOKIE);
}

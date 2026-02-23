import { NextResponse } from 'next/server';
import { getWorkerSession } from '@/lib/worker-auth';
import { google } from 'googleapis';

/**
 * GET /api/auth/google/worker
 * Initiates Google OAuth for a worker (not admin).
 * Worker must have an active portal session.
 */
export async function GET() {
  const session = await getWorkerSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  );

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'email',
    'profile',
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: JSON.stringify({
      companyId: session.company.id,
      workerId: session.worker.id,
      source: 'worker_portal',
    }),
    prompt: 'consent',
  });

  return NextResponse.redirect(url);
}

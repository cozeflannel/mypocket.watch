import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, isAuthError } from '@/lib/auth-helpers';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    `${request.nextUrl.origin}/api/auth/google/callback`
  );

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'email',
    'profile'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // crucial for refresh token
    scope: scopes,
    state: JSON.stringify({ companyId: ctx.company.id, workerId: ctx.adminUser.id }),
    prompt: 'consent' // force new refresh token
  });

  return NextResponse.redirect(url);
}

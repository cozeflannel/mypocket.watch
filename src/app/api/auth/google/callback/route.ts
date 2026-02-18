import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, isAuthError } from '@/lib/auth-helpers';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
  }

  const supabase = await createClient();
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  );

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Get user profile to store email
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data: userProfile } = await oauth2.userinfo.get();

  const { error } = await supabase.from('connected_accounts').upsert({
    company_id: JSON.parse(url.searchParams.get('state')!).companyId,
    worker_id: JSON.parse(url.searchParams.get('state')!).workerId,
    provider: 'google',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expiry_date,
    email: userProfile.email,
  }, {
    onConflict: 'worker_id, provider'
  });

  if (error) {
    console.error('Failed to save Google tokens:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.redirect(new URL('/calendar', request.url));
}

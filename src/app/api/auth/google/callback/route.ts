import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateRaw = url.searchParams.get('state');

  if (!code || !stateRaw) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  let state: { companyId: string; workerId: string };
  try {
    state = JSON.parse(stateRaw);
  } catch {
    return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user email
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userProfile } = await oauth2.userinfo.get();

    const supabase = await createClient();

    const { error } = await supabase.from('connected_accounts').upsert(
      {
        company_id: state.companyId,
        worker_id: state.workerId,
        provider: 'google',
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token!,
        expires_at: tokens.expiry_date,
        email: userProfile.email,
      },
      { onConflict: 'worker_id,provider' }
    );

    if (error) {
      console.error('Failed to save Google tokens:', error);
      return NextResponse.redirect(
        new URL('/integrations?error=db_error', request.url)
      );
    }

    return NextResponse.redirect(new URL('/integrations?gcal=connected', request.url));
  } catch (err) {
    console.error('Google OAuth error:', err);
    return NextResponse.redirect(
      new URL('/integrations?error=oauth_failed', request.url)
    );
  }
}

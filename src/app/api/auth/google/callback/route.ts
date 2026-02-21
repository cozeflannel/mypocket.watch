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

  let state: { companyId: string; workerId: string; source?: string };
  try {
    state = JSON.parse(stateRaw);
  } catch {
    return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
  }

  const isWorkerPortal = state.source === 'worker_portal';

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
      const errorRedirect = isWorkerPortal ? '/worker/portal?error=db_error' : '/integrations?error=db_error';
      return NextResponse.redirect(new URL(errorRedirect, request.url));
    }

    const successRedirect = isWorkerPortal ? '/worker/portal?gcal=connected' : '/integrations?gcal=connected';
    return NextResponse.redirect(new URL(successRedirect, request.url));
  } catch (err) {
    console.error('Google OAuth error:', err);
    const errorRedirect = isWorkerPortal ? '/worker/portal?error=oauth_failed' : '/integrations?error=oauth_failed';
    return NextResponse.redirect(new URL(errorRedirect, request.url));
  }
}

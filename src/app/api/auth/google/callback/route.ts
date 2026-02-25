import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
  }

  if (!stateParam) {
    return NextResponse.json({ error: 'Missing state parameter' }, { status: 400 });
  }

  let state: { companyId: string; workerId: string };
  try {
    state = JSON.parse(stateParam);
  } catch {
    return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
  }

  // Use the request origin so www vs non-www never causes a mismatch
  const redirectUri = `${url.origin}/api/auth/google/callback`;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    redirectUri
  );

  let tokens;
  try {
    const result = await oauth2Client.getToken(code);
    tokens = result.tokens;
  } catch (err) {
    console.error('Google token exchange failed:', err);
    return NextResponse.redirect(new URL('/integrations?error=google_auth_failed', request.url));
  }

  oauth2Client.setCredentials(tokens);

  let userProfile;
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    userProfile = data;
  } catch (err) {
    console.error('Failed to fetch Google user profile:', err);
    return NextResponse.redirect(new URL('/integrations?error=google_profile_failed', request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.from('connected_accounts').upsert({
    company_id: state.companyId,
    worker_id: state.workerId,
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
    return NextResponse.redirect(new URL('/integrations?error=db_error', request.url));
  }

  return NextResponse.redirect(new URL('/integrations?connected=google', request.url));
}

# Google OAuth Setup Guide

## Issue
When clicking "Continue with Google" on login/signup, users can select their Google account but then get `ERR_CONNECTION_REFUSED` when redirected back to localhost.

## Root Cause
Google OAuth is not properly configured in Supabase. The redirect callback needs to be set up correctly.

## Fix Steps

### 1. Configure Google OAuth in Supabase Dashboard

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/wemxpvyusyovuqcqfupl
2. Navigate to **Authentication → Providers**
3. Find **Google** in the list
4. Enable Google authentication
5. You'll need to create a Google OAuth application:

### 2. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add these **Authorized redirect URIs**:
   - `https://wemxpvyusyovuqcqfupl.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)
7. Copy the **Client ID** and **Client Secret**

### 3. Configure in Supabase

1. Back in Supabase dashboard, Google provider settings:
2. Paste **Client ID** and **Client Secret**
3. Enable **Google** provider
4. Save

### 4. Update Environment Variables (Optional)

If you want to use Google Calendar integration (separate from auth), you already have these in `.env.local`:

```env
# Google Calendar (different from Supabase Google Auth)
GOOGLE_CALENDAR_CLIENT_ID=your-calendar-client-id
GOOGLE_CALENDAR_CLIENT_SECRET=your-calendar-client-secret
```

**Note:** Supabase Google Auth and Google Calendar API use different OAuth credentials.

### 5. Test

1. Restart your dev server: `npm run dev`
2. Go to http://localhost:3000
3. Click "Get Started" or "Sign In"
4. Click "Continue with Google"
5. Should redirect properly now

## Additional Notes

- **Development:** Make sure `http://localhost:3000/auth/callback` is in Google OAuth redirect URIs
- **Production:** Add your production URL's callback: `https://yourdomain.com/auth/callback`
- **Supabase handles the OAuth flow** - your app just needs the callback route at `/auth/callback`

## Troubleshooting

### Still getting ERR_CONNECTION_REFUSED?
- Check that Supabase Google provider is **enabled**
- Verify redirect URIs match exactly (no trailing slashes)
- Clear browser cache and cookies
- Check Supabase logs in dashboard

### Google API Console Errors?
- Make sure OAuth consent screen is configured
- Verify app is in "Testing" or "Published" state
- Add test users if in "Testing" mode

## Security Best Practices

✅ **Do:**
- Use different OAuth credentials for dev vs production
- Keep Client Secret in Supabase dashboard only (not in your code)
- Restrict OAuth redirect URIs to only your domains

❌ **Don't:**
- Commit Google credentials to git (already in .gitignore)
- Use production credentials in development
- Add wildcard redirect URIs

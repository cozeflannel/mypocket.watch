# OAuth Signup - Company Setup Flow

## Issue

When users sign up with Google OAuth (new users, not existing), they bypass the normal signup form which collects:
- Company Name
- Full Name

## Current Behavior

- Google OAuth redirects to `/auth/callback`
- Callback exchanges code for session
- User gets redirected to `/live-status`
- **Problem:** No company or admin_user record exists yet

## Solution Options

### Option 1: Onboarding Page (Recommended)

1. After OAuth callback, check if admin_user exists for this auth user
2. If not, redirect to `/auth/onboarding`
3. Onboarding page collects:
   - Company Name
   - Full Name (pre-filled from Google profile if available)
4. Creates company and admin_user records
5. Redirects to `/live-status`

**Implementation:**
- Create `/src/app/auth/onboarding/page.tsx`
- Update `/src/app/auth/callback/route.ts` to check for admin_user
- Add redirect logic

### Option 2: Modal/Popup

Show a modal on `/live-status` if company is missing

### Option 3: Prompt on First Action

Allow user to browse but prompt for company info on first action (e.g., adding a worker)

## Recommended: Option 1

Most professional UX - clear onboarding flow.

## Code Changes Needed

### 1. Update `src/app/auth/callback/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/live-status';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Check if user has company setup
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('id, company_id')
          .eq('auth_uid', user.id)
          .single();
        
        // If no admin_user record, redirect to onboarding
        if (!adminUser) {
          return NextResponse.redirect(`${origin}/auth/onboarding`);
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login`);
}
```

### 2. Create `src/app/auth/onboarding/page.tsx`

Similar to signup page but:
- Skip email/password fields
- Pre-fill email and name from OAuth profile
- Only collect Company Name
- Create company and admin_user records
- Redirect to dashboard

## Timeline

**Priority:** Medium (blocks Google OAuth signup for new users)

**Effort:** 1-2 hours

**Status:** TODO

## Workaround for Now

Users signing up with Google:
1. Click "Continue with Google"
2. Will see an error or be redirected to login
3. Must use email/password signup instead

OR: Manually create company/admin_user records in database for OAuth users

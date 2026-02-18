# MyPocketWatch - Fixes & Features TODO

## 🚨 Critical Bugs

### 1. Google OAuth ERR_CONNECTION_REFUSED
**Issue:** After selecting Google account, gets connection refused error
**Root Cause:** Using Supabase's `signInWithOAuth` with Google provider, but Google OAuth might not be enabled in Supabase dashboard
**Fix Required:**
- Configure Google OAuth provider in Supabase dashboard (https://supabase.com/dashboard/project/{project-id}/auth/providers)
- Add authorized redirect URIs: `http://localhost:3000/auth/callback` and production URL
- Ensure NEXT_PUBLIC_APP_URL is set correctly

### 2. Add Worker Infinite Loading
**Issue:** Worker addition keeps loading, no error or success
**Root Cause:** `src/app/(dashboard)/staff/worker/page.tsx` line 57-67
- Not using the API endpoint (`/api/workers`)
- No proper error handling
- `setSaving(false)` and `loadWorkers()` called without checking success
**Fix Required:**
- Use fetch to call `/api/workers` POST endpoint
- Add try/catch with error state
- Show success/error toast

### 3. Dark Mode Doesn't Persist
**Issue:** Dark mode toggle works but reverts when navigating pages
**Root Cause:** `src/components/layout/Header.tsx` line 21-26
- Only toggles DOM class, no localStorage persistence
**Fix Required:**
- Save preference to localStorage
- Load preference on mount
- Apply on initial render to avoid flash

### 4. No Sign Out Option
**Issue:** Once logged in, no way to sign out
**Root Cause:** Header component has no logout button
**Fix Required:**
- Add user menu/dropdown to Header
- Add sign out button that calls `supabase.auth.signOut()`
- Redirect to login page after sign out

## 🔧 Missing Features

### 5. No Forgot Password Flow
**Issue:** Users who forget password can't recover account
**Fix Required:**
- Add "Forgot Password?" link on login page
- Create `/auth/reset-password` page
- Implement Supabase password reset flow
- Create `/auth/update-password` callback page

### 6. No Show/Hide Password Toggle
**Issue:** Can't see password while typing
**Fix Required:**
- Add eye icon button to password inputs
- Toggle between `type="password"` and `type="text"`
- Apply to: login, signup, reset password pages

### 7. No Admin Profile/Account Page
**Issue:** No place to view/edit admin info
**Fix Required:**
- Create `/profile` or `/account` page
- Display: name, email, phone, company info
- Edit capabilities: name, phone, password change
- Create API endpoint `/api/profile` for updates

### 8. No Landing Page
**Issue:** Root `/` redirects to login - unprofessional
**Root Cause:** `src/app/page.tsx` immediately redirects
**Fix Required:**
- Create proper marketing landing page at `/`
- Hero section with problem/solution narrative
- Unique value proposition
- Clear CTA (Get Started / Sign Up)
- Story-driven copy (admin struggles → solution)
- Modern, clean design
- Move login to `/auth/login` (already exists)
- Update middleware to allow unauthenticated access to `/`

## 🔒 Security Considerations

### Payment Info Storage
**Requirement:** Do NOT store banking/card info
**Implementation:**
- Use payment processor (Stripe, etc.) for any future payment features
- Only store payment intent IDs or customer IDs
- Never store card numbers, CVV, or bank account details

## 🔍 Endpoint Review

**Need to audit:**
- `/api/workers/*` - Check auth validation
- `/api/payroll/*` - Ensure company isolation
- `/api/time-entries/*` - Verify worker can only see own entries
- All endpoints - Ensure proper authorization checks

## ✅ Implementation Order

1. **Quick Wins (< 30 min)**
   - Add password toggle
   - Fix dark mode persistence
   - Add sign out button

2. **Critical Bugs (1-2 hours)**
   - Fix worker addition
   - Fix Google OAuth (needs Supabase config)
   - Add forgot password flow

3. **New Features (2-4 hours)**
   - Create landing page
   - Create admin profile page
   - Endpoint security audit

## 📝 Notes

- Modern stack: Next.js 16, React 19, Supabase, Tailwind
- Using App Router with server/client components
- Dark mode via Tailwind's `dark:` class
- Component structure: `src/components/ui/*` for reusable UI

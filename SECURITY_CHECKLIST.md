# Security Checklist - My Pocket Watch

## ✅ COMPLETED

### 1. OAuth Configuration
- ✅ Google OAuth Client ID and Secret configured
- ✅ Redirect URIs set for localhost and production domains
- ✅ Supabase Google provider enabled
- ✅ Site URL and redirect URLs configured in Supabase

### 2. Row Level Security (RLS)
- ✅ RLS enabled on all tables (already in 001_initial_schema.sql)
- ✅ Company-level isolation policies implemented
- ✅ Helper function `get_user_company_id()` created
- ✅ Policies prevent cross-company data access

### 3. Authentication
- ✅ Supabase Auth handles session management
- ✅ Password toggle on login/signup pages
- ✅ Forgot password flow implemented
- ✅ Sign out functionality in header

### 4. UI Features
- ✅ Landing page implemented
- ✅ Dark mode with persistence
- ✅ Admin profile page
- ✅ Worker management with proper API calls

## ⚠️ HIGH PRIORITY (Before Production)

### 1. Google OAuth Signup Flow
**Status:** Partially implemented
**Issue:** New users signing up with Google bypass company setup
**Solution:** Implement onboarding page (see OAUTH_SIGNUP_TODO.md)
**Priority:** HIGH
**Effort:** 1-2 hours

### 2. Input Validation
**Status:** Needs implementation
**Issues:**
- API endpoints accept raw input without validation
- No schema validation (recommend Zod)
- SQL injection risk (mitigated by Supabase, but still best practice)

**Actions:**
- [ ] Install Zod: `npm install zod`
- [ ] Create validation schemas in `/src/lib/validation-schemas.ts`
- [ ] Add validation to all API routes
- [ ] Sanitize user input

**Priority:** HIGH
**Effort:** 2-3 hours

### 3. Rate Limiting
**Status:** Not implemented
**Issues:**
- No rate limiting on API endpoints
- Vulnerable to brute force attacks
- Could lead to high costs

**Actions:**
- [ ] Implement rate limiting middleware
- [ ] Add per-IP rate limits
- [ ] Add per-user rate limits for authenticated endpoints
- [ ] Consider using Upstash Rate Limit or similar

**Priority:** HIGH
**Effort:** 2-3 hours

### 4. Error Handling
**Status:** Inconsistent
**Issues:**
- Some endpoints expose internal errors
- Database errors leak implementation details
- No centralized error handling

**Actions:**
- [ ] Create centralized error handler
- [ ] Return generic errors to clients
- [ ] Log detailed errors server-side only
- [ ] Use proper HTTP status codes

**Priority:** MEDIUM
**Effort:** 2-3 hours

## ⚠️ MEDIUM PRIORITY

### 5. CSRF Protection
**Status:** Needs review
**Note:** Next.js has some built-in protections, but verify for your use case

**Actions:**
- [ ] Review CSRF token implementation
- [ ] Ensure state parameters in OAuth flow
- [ ] Add CSRF tokens to forms if needed

**Priority:** MEDIUM
**Effort:** 1-2 hours

### 6. Environment Variables
**Status:** In place, needs verification
**Actions:**
- [ ] Verify all secrets are in environment variables (not hardcoded)
- [ ] Check Vercel environment variables are set
- [ ] Ensure `.env.local` is in `.gitignore`
- [ ] Document required environment variables in README

**Priority:** MEDIUM
**Effort:** 30 minutes

### 7. API Endpoint Audit
**Status:** Needs review
**Actions:**
- [ ] Review all `/api` routes for company_id filtering
- [ ] Ensure no endpoints bypass RLS by using service role unnecessarily
- [ ] Add authorization checks (role-based access)
- [ ] Document API security patterns

**Priority:** MEDIUM
**Effort:** 2-3 hours

### 8. Session Security
**Status:** Using Supabase defaults
**Actions:**
- [ ] Review session timeout settings
- [ ] Implement "remember me" functionality if needed
- [ ] Add session invalidation on password change
- [ ] Consider adding logout from all devices

**Priority:** MEDIUM
**Effort:** 1-2 hours

## 🔄 LOW PRIORITY (Post-Launch)

### 9. Logging & Monitoring
- [ ] Set up structured logging
- [ ] Monitor failed authentication attempts
- [ ] Track unusual API usage patterns
- [ ] Set up alerts for security events

### 10. Penetration Testing
- [ ] Run automated security scans
- [ ] Manual penetration testing
- [ ] Review OWASP Top 10 vulnerabilities

### 11. Compliance
- [ ] Review GDPR requirements (if applicable)
- [ ] Add privacy policy
- [ ] Add terms of service
- [ ] Implement data export/deletion

### 12. Payment Security
**Note:** You mentioned NOT storing card/bank info ✅
- [ ] Use Stripe or similar (when adding billing)
- [ ] Only store customer IDs and subscription status
- [ ] Never handle raw card data
- [ ] Use webhooks for payment events

## 📝 DOCUMENTATION NEEDED

- [ ] Security best practices for developers
- [ ] Incident response plan
- [ ] Data handling procedures
- [ ] API documentation with security notes

## 🔒 SECURITY HEADERS

Add to `next.config.js`:
```javascript
{
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'origin-when-cross-origin' }
      ]
    }
  ]
}
```

## ⏰ ESTIMATED TIMELINE

**Before Production Launch:**
- OAuth signup flow: 1-2 hours
- Input validation: 2-3 hours
- Rate limiting: 2-3 hours
- Error handling: 2-3 hours
- **Total: 8-11 hours**

**Post-Launch (within 1-2 weeks):**
- CSRF review: 1-2 hours
- Environment variable audit: 30 minutes
- API endpoint review: 2-3 hours
- Session security: 1-2 hours
- **Total: 5-8 hours**

## 🎯 CURRENT STATUS

**Production Readiness:** 70%

**Critical Blockers:**
1. OAuth signup flow (new Google users can't complete signup)
2. Input validation (security risk)
3. Rate limiting (cost & security risk)

**Timeline to Production:**
- If you implement high-priority items: **8-11 hours of work**
- If you want to launch with workarounds: **Can launch now** (disable Google signup, accept risks)

**Recommendation:**
Launch with email/password only, implement Google OAuth signup flow post-launch.

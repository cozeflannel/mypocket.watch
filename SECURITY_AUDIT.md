# Security Audit & Best Practices

## 🔒 Payment Information Policy

**CRITICAL: DO NOT STORE PAYMENT INFORMATION**

### What NOT to Store
- ❌ Credit/debit card numbers
- ❌ CVV/CVC codes
- ❌ Bank account numbers
- ❌ Routing numbers
- ❌ Any PCI-DSS sensitive data

### What You CAN Store (if using payment processor)
- ✅ Payment processor customer IDs (e.g., Stripe customer ID)
- ✅ Payment intent IDs
- ✅ Subscription status
- ✅ Last 4 digits of card (provided by processor)
- ✅ Payment history metadata

### Recommended Approach
If you add payment features in the future:

1. **Use a PCI-compliant payment processor:**
   - Stripe (recommended)
   - PayPal
   - Square

2. **Never handle raw card data:**
   - Use payment processor's hosted forms
   - Use tokenization (processor converts card → token)
   - Store only the token/customer ID

3. **Example with Stripe:**
   ```javascript
   // Good: Store only Stripe's customer ID
   companies table:
     stripe_customer_id: string
     subscription_status: string
     subscription_plan: string
   
   // Bad: NEVER do this
   payment_cards table:
     card_number: string  // ❌ NO!
     cvv: string          // ❌ NO!
   ```

---

## 🔍 API Endpoint Security Audit

### Authentication Validation

All API endpoints use `getAuthContext()` from `/lib/auth-helpers.ts` which:
- ✅ Validates Supabase session
- ✅ Retrieves authenticated user
- ✅ Retrieves associated company
- ✅ Returns error if unauthorized

### Endpoint-by-Endpoint Review

#### ✅ SECURE: `/api/workers/*`
```typescript
// GET /api/workers - List workers
// ✅ Filters by ctx.company.id
// ✅ Users can only see their company's workers

// POST /api/workers - Create worker
// ✅ Forces company_id from ctx.company.id
// ✅ Cannot create workers for other companies

// GET /api/workers/[id]
// NEEDS REVIEW: Should verify worker belongs to company
```

**Fix needed for GET /api/workers/[id]:**
```typescript
const { data: worker } = await supabase
  .from('workers')
  .select('*')
  .eq('id', id)
  .eq('company_id', ctx.company.id)  // Add this!
  .single();
```

#### ⚠️ NEEDS REVIEW: `/api/time-entries/*`
```typescript
// POST /api/time-entries - Clock in/out
// ✅ Validates worker belongs to company
// ✅ Prevents cross-company time entries

// GET /api/time-entries
// NEEDS REVIEW: Add company_id filter
```

**Recommended fix:**
```typescript
const { data } = await supabase
  .from('time_entries')
  .select('*, workers!inner(*)')
  .eq('workers.company_id', ctx.company.id)
  .order('clock_in', { ascending: false });
```

#### ⚠️ NEEDS REVIEW: `/api/payroll/*`
```typescript
// GET /api/payroll - List payroll periods
// NEEDS REVIEW: Filter by company

// POST /api/payroll - Create payroll
// NEEDS REVIEW: Ensure all workers belong to company
```

**Recommended fixes:**
1. Add `company_id` column to `payroll_periods` table
2. Filter all queries by `ctx.company.id`
3. Validate workers in period belong to company

#### ✅ SECURE: `/api/profile`
```typescript
// GET /api/profile - Get own profile
// ✅ Only returns ctx.adminUser and ctx.company
// ✅ Cannot access other users' profiles

// PATCH /api/profile - Update profile
// ✅ Only updates ctx.adminUser.id
// ✅ Only updates ctx.company.id
```

#### ⚠️ NEEDS REVIEW: `/api/schedules/*`
```typescript
// GET /api/schedules
// NEEDS REVIEW: Filter by company

// POST /api/schedules
// NEEDS REVIEW: Validate workers belong to company
```

---

## 🛡️ Recommended Security Improvements

### 1. Row Level Security (RLS) in Supabase

Add RLS policies to enforce company isolation at the database level:

```sql
-- Workers table RLS
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their company's workers"
ON workers
FOR ALL
USING (
  company_id IN (
    SELECT company_id 
    FROM admin_users 
    WHERE auth_uid = auth.uid()
  )
);

-- Time entries table RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their company's time entries"
ON time_entries
FOR ALL
USING (
  worker_id IN (
    SELECT id 
    FROM workers 
    WHERE company_id IN (
      SELECT company_id 
      FROM admin_users 
      WHERE auth_uid = auth.uid()
    )
  )
);
```

### 2. Rate Limiting

Add rate limiting to prevent abuse:

```typescript
// Use middleware or edge functions
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: /* your redis instance */,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});
```

### 3. Input Validation

Add Zod schemas for all API inputs:

```typescript
import { z } from 'zod';

const CreateWorkerSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  email: z.string().email().optional(),
  hourly_rate: z.number().positive().optional(),
});

// In handler:
const validated = CreateWorkerSchema.parse(body);
```

### 4. Audit Logging

Already implemented in `/lib/audit.ts` ✅

Ensure all sensitive operations are logged:
- ✅ Worker creation/updates
- ✅ Time entry modifications
- ⚠️ Add: Payroll generation
- ⚠️ Add: Schedule changes
- ⚠️ Add: Profile updates (partially done)

### 5. Environment Variables

Review `.env.local`:
- ✅ API keys not committed to git
- ✅ Using `.env.local.example` for template
- ⚠️ Consider using Supabase Vault for secrets in production

---

## 🚨 Critical Action Items

### Immediate (Before Production)
1. [ ] Add RLS policies to all tables
2. [ ] Fix worker/time-entry cross-company access
3. [ ] Add company_id to payroll_periods table
4. [ ] Add input validation (Zod schemas)
5. [ ] Review all SELECT queries for company_id filters

### High Priority
1. [ ] Add rate limiting
2. [ ] Set up monitoring/alerting
3. [ ] Penetration testing
4. [ ] Security headers (HSTS, CSP, etc.)

### Medium Priority
1. [ ] Add 2FA for admin users
2. [ ] IP allowlisting for sensitive operations
3. [ ] Automated security scanning (Snyk, Dependabot)

---

## 📋 Compliance Notes

### Data Protection
- User data is stored in Supabase (EU or US region - check your project)
- Consider GDPR compliance if serving EU users
- Implement data export/deletion on request

### Labor Law Compliance
- Time tracking data may be subject to labor laws
- Ensure audit trail is immutable
- Consider data retention policies (7 years typical)

### Financial Data
- If storing payroll data, ensure secure backups
- Consider encryption at rest for sensitive financial info
- Follow local tax data retention requirements

---

## 🔗 Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PCI DSS Compliance](https://www.pcisecuritystandards.org/)
- [Stripe Security Best Practices](https://stripe.com/docs/security/guide)

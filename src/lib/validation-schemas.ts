/**
 * Validation Schemas using Zod
 * 
 * Install: npm install zod
 * 
 * Usage in API routes:
 * ```typescript
 * import { workerCreateSchema } from '@/lib/validation-schemas';
 * 
 * export async function POST(request: Request) {
 *   const body = await request.json();
 *   const result = workerCreateSchema.safeParse(body);
 *   
 *   if (!result.success) {
 *     return NextResponse.json(
 *       { error: 'Validation failed', details: result.error.issues },
 *       { status: 400 }
 *     );
 *   }
 *   
 *   const validData = result.data;
 *   // Use validData safely...
 * }
 * ```
 */

import { z } from 'zod';

// ============================================================
// COMMON VALIDATORS
// ============================================================

const uuidSchema = z.string().uuid();
const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/).optional().or(z.literal(''));
const emailSchema = z.string().email().optional().or(z.literal(''));
const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

// ============================================================
// WORKER SCHEMAS
// ============================================================

export const workerCreateSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  phone: phoneSchema,
  email: emailSchema,
  hourly_rate: z.number().min(0).max(999.99).optional().nullable(),
  position: z.string().max(100).optional().nullable(),
  hire_date: z.string().date().optional().nullable(),
  preferred_communication: z.enum(['sms', 'whatsapp', 'telegram', 'messenger']).default('sms'),
});

export const workerUpdateSchema = workerCreateSchema.partial().extend({
  id: uuidSchema,
  is_active: z.boolean().optional(),
});

// ============================================================
// TIME ENTRY SCHEMAS
// ============================================================

export const timeEntryCreateSchema = z.object({
  worker_id: uuidSchema,
  clock_in: z.string().datetime(),
  clock_out: z.string().datetime().optional().nullable(),
  lunch_out: z.string().datetime().optional().nullable(),
  lunch_in: z.string().datetime().optional().nullable(),
  break_minutes: z.number().int().min(0).max(480).default(0),
  entry_type: z.enum(['regular', 'overtime', 'holiday', 'pto']).default('regular'),
  source: z.enum(['manual', 'sms', 'whatsapp', 'telegram', 'messenger', 'admin']).default('manual'),
  notes: z.string().max(500).optional().nullable(),
});

export const timeEntryUpdateSchema = timeEntryCreateSchema.partial().extend({
  id: uuidSchema,
});

// ============================================================
// SCHEDULE SCHEMAS
// ============================================================

export const scheduleCreateSchema = z.object({
  worker_id: uuidSchema,
  date: z.string().date(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:MM format
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  break_minutes: z.number().int().min(0).max(480).default(0),
  notes: z.string().max(500).optional().nullable(),
});

export const scheduleUpdateSchema = scheduleCreateSchema.partial().extend({
  id: uuidSchema,
});

// ============================================================
// COMPANY SCHEMAS
// ============================================================

export const companyUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  timezone: z.string().optional(),
  pay_period_type: z.enum(['weekly', 'biweekly', 'semimonthly', 'monthly']).optional(),
  overtime_threshold_daily: z.number().min(0).max(24).optional(),
  overtime_threshold_weekly: z.number().min(0).max(168).optional(),
  overtime_multiplier: z.number().min(1).max(3).optional(),
  business_phone: phoneSchema,
  business_email: emailSchema,
});

// ============================================================
// PROFILE SCHEMAS
// ============================================================

export const profileUpdateSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  phone: phoneSchema,
  company_name: z.string().min(1).max(200).optional(),
});

// ============================================================
// AUTH SCHEMAS
// ============================================================

export const signupSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200),
  fullName: z.string().min(1, 'Full name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const passwordUpdateSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// ============================================================
// PAYROLL SCHEMAS
// ============================================================

export const payrollPeriodCreateSchema = z.object({
  start_date: z.string().date(),
  end_date: z.string().date(),
}).refine(
  (data) => new Date(data.start_date) < new Date(data.end_date),
  { message: 'End date must be after start date', path: ['end_date'] }
);

export const payrollPeriodUpdateSchema = z.object({
  id: uuidSchema,
  status: z.enum(['open', 'processing', 'closed']).optional(),
});

// ============================================================
// PAGINATION & FILTERING
// ============================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export const dateRangeSchema = z.object({
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Validate and parse request body
 * Returns parsed data or throws with validation errors
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  const body = await request.json();
  return schema.parse(body);
}

/**
 * Safe validation that returns result object
 */
export async function safeValidateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: z.ZodError }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    return result;
  } catch (error) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: 'custom',
          message: 'Invalid JSON body',
          path: [],
        },
      ]),
    };
  }
}

/**
 * Validate URL search params
 */
export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  const params = Object.fromEntries(searchParams.entries());
  return schema.parse(params);
}

// ============================================================
// TYPE EXPORTS
// ============================================================

export type WorkerCreate = z.infer<typeof workerCreateSchema>;
export type WorkerUpdate = z.infer<typeof workerUpdateSchema>;
export type TimeEntryCreate = z.infer<typeof timeEntryCreateSchema>;
export type TimeEntryUpdate = z.infer<typeof timeEntryUpdateSchema>;
export type ScheduleCreate = z.infer<typeof scheduleCreateSchema>;
export type ScheduleUpdate = z.infer<typeof scheduleUpdateSchema>;
export type CompanyUpdate = z.infer<typeof companyUpdateSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type Signup = z.infer<typeof signupSchema>;
export type Login = z.infer<typeof loginSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;

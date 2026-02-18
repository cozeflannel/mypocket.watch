import { createClient } from '@supabase/supabase-js';

// Service-role client for webhook routes and background jobs
// This bypasses RLS — always filter by company_id manually!
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

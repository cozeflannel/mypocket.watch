import { createClient as createAdminClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function logAuditAction(params: {
  companyId: string;
  adminUserId: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  await supabase.from('audit_logs').insert({
    company_id: params.companyId,
    admin_user_id: params.adminUserId,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId || null,
    old_values: params.oldValues || null,
    new_values: params.newValues || null,
    ip_address: params.ipAddress || null,
  });
}

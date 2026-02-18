import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { AdminUser, Company } from '@/types/database';

export interface AuthContext {
  adminUser: AdminUser;
  company: Company;
  supabase: Awaited<ReturnType<typeof createClient>>;
}

export async function getAuthContext(): Promise<AuthContext | NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('auth_uid', user.id)
    .eq('is_active', true)
    .single();

  if (!adminUser) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 403 });
  }

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', adminUser.company_id)
    .single();

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  return { adminUser: adminUser as AdminUser, company: company as Company, supabase };
}

export function isAuthError(result: AuthContext | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}

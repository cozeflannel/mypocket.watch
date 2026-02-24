import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, isAuthError } from '@/lib/auth-helpers';
import { logAuditAction } from '@/lib/audit';

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  // Get admin user info
  const { data: adminUser, error: adminError } = await ctx.supabase
    .from('admin_users')
    .select('*')
    .eq('id', ctx.adminUser.id)
    .single();

  if (adminError) {
    return NextResponse.json({ error: adminError.message }, { status: 500 });
  }

  // Get company info
  const { data: company, error: companyError } = await ctx.supabase
    .from('companies')
    .select('*')
    .eq('id', ctx.company.id)
    .single();

  if (companyError) {
    return NextResponse.json({ error: companyError.message }, { status: 500 });
  }

  return NextResponse.json({ adminUser, company });
}

export async function PATCH(request: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const body = await request.json();
  const { full_name, phone, company_name, job_site_lat, job_site_lng, geofence_radius } = body;

  const updates: { full_name?: string; phone?: string } = {};
  if (full_name !== undefined) updates.full_name = full_name;
  if (phone !== undefined) updates.phone = phone;

  // Update admin user
  if (Object.keys(updates).length > 0) {
    const { error: userError } = await ctx.supabase
      .from('admin_users')
      .update(updates)
      .eq('id', ctx.adminUser.id);

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    await logAuditAction({
      companyId: ctx.company.id,
      adminUserId: ctx.adminUser.id,
      action: 'update',
      resourceType: 'admin_user',
      resourceId: ctx.adminUser.id,
      newValues: updates,
    });
  }

  // Update company settings if provided
  const companyUpdates: {
    name?: string;
    job_site_lat?: number | null;
    job_site_lng?: number | null;
    geofence_radius?: number | null;
  } = {};

  if (company_name !== undefined) {
    companyUpdates.name = company_name;
  }
  if (job_site_lat !== undefined) {
    companyUpdates.job_site_lat = job_site_lat === '' || job_site_lat === null ? null : parseFloat(job_site_lat);
  }
  if (job_site_lng !== undefined) {
    companyUpdates.job_site_lng = job_site_lng === '' || job_site_lng === null ? null : parseFloat(job_site_lng);
  }
  if (geofence_radius !== undefined) {
    companyUpdates.geofence_radius = geofence_radius === '' || geofence_radius === null ? null : parseInt(geofence_radius);
  }

  if (Object.keys(companyUpdates).length > 0) {
    const { error: companyError } = await ctx.supabase
      .from('companies')
      .update(companyUpdates)
      .eq('id', ctx.company.id);

    if (companyError) {
      return NextResponse.json({ error: companyError.message }, { status: 500 });
    }

    await logAuditAction({
      companyId: ctx.company.id,
      adminUserId: ctx.adminUser.id,
      action: 'update',
      resourceType: 'company',
      resourceId: ctx.company.id,
      newValues: companyUpdates,
    });
  }

  return NextResponse.json({ success: true });
}

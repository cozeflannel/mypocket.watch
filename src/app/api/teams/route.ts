import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, isAuthError } from '@/lib/auth-helpers';

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from('team_hierarchy')
    .select(`
      *,
      lead:workers!team_hierarchy_lead_worker_id_fkey(id, first_name, last_name, color, position),
      member:workers!team_hierarchy_team_member_id_fkey(id, first_name, last_name, color, position)
    `)
    .eq('company_id', ctx.company.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group by lead
  const teamsMap = new Map<string, { lead: unknown; members: unknown[] }>();
  for (const row of data || []) {
    const leadId = row.lead_worker_id;
    if (!teamsMap.has(leadId)) {
      teamsMap.set(leadId, { lead: row.lead, members: [] });
    }
    teamsMap.get(leadId)!.members.push(row.member);
  }

  return NextResponse.json(Array.from(teamsMap.values()));
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const body = await request.json();
  const { lead_worker_id, team_member_id } = body;

  if (!lead_worker_id || !team_member_id) {
    return NextResponse.json({ error: 'lead_worker_id and team_member_id are required' }, { status: 400 });
  }

  if (lead_worker_id === team_member_id) {
    return NextResponse.json({ error: 'A worker cannot be their own team lead' }, { status: 400 });
  }

  const { data, error } = await ctx.supabase
    .from('team_hierarchy')
    .insert({
      company_id: ctx.company.id,
      lead_worker_id,
      team_member_id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This team assignment already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get('lead_id');
  const memberId = searchParams.get('member_id');

  if (!leadId || !memberId) {
    return NextResponse.json({ error: 'lead_id and member_id query params required' }, { status: 400 });
  }

  const { error } = await ctx.supabase
    .from('team_hierarchy')
    .delete()
    .eq('company_id', ctx.company.id)
    .eq('lead_worker_id', leadId)
    .eq('team_member_id', memberId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

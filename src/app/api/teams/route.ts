import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, isAuthError } from '@/lib/auth-helpers';

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from('team_hierarchy')
    .select(`
      *,
      manager:workers!team_hierarchy_manager_id_fkey(id, first_name, last_name, color, position)
    `)
    .eq('company_id', ctx.company.id)
    .order('level')
    .order('sort_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const body = await request.json();
  const { name, level, parent_id, manager_id, sort_order } = body;

  if (!name) {
    return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
  }

  const { data, error } = await ctx.supabase
    .from('team_hierarchy')
    .insert({
      company_id: ctx.company.id,
      name,
      level: level ?? 0,
      sort_order: sort_order ?? 0,
      parent_id: parent_id || null,
      manager_id: manager_id || null,
    })
    .select(`
      *,
      manager:workers!team_hierarchy_manager_id_fkey(id, first_name, last_name, color, position)
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Team id is required' }, { status: 400 });
  }

  const { error } = await ctx.supabase
    .from('team_hierarchy')
    .delete()
    .eq('company_id', ctx.company.id)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

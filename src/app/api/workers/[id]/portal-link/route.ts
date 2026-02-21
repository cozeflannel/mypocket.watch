import { NextResponse } from 'next/server';
import { getAuthContext, isAuthError } from '@/lib/auth-helpers';
import { generateWorkerToken } from '@/lib/worker-auth';

/**
 * POST /api/workers/:id/portal-link
 * Admin generates a magic link for a worker to access their portal.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { id: workerId } = await params;

  // Verify worker belongs to this company
  const { data: worker } = await ctx.supabase
    .from('workers')
    .select('id, first_name, last_name, phone, email')
    .eq('id', workerId)
    .eq('company_id', ctx.company.id)
    .single();

  if (!worker) {
    return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
  }

  const token = await generateWorkerToken(workerId, ctx.company.id);
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/worker/portal?token=${token}`;

  return NextResponse.json({
    url: portalUrl,
    worker: { id: worker.id, name: `${worker.first_name} ${worker.last_name}` },
  });
}

import { NextResponse } from 'next/server';
import { getWorkerSession } from '@/lib/worker-auth';

/**
 * GET /api/worker/session
 * Returns current worker session info (used by the portal client-side).
 */
export async function GET() {
  const session = await getWorkerSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { worker, company } = session;

  // Check Google Calendar connection
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: connection } = await supabase
    .from('connected_accounts')
    .select('id, email, created_at')
    .eq('worker_id', worker.id)
    .eq('provider', 'google')
    .single();

  return NextResponse.json({
    worker: {
      id: worker.id,
      first_name: worker.first_name,
      last_name: worker.last_name,
      email: worker.email,
      phone: worker.phone,
      position: worker.position,
    },
    company: {
      id: company.id,
      name: company.name,
    },
    googleCalendar: connection
      ? { connected: true, email: connection.email, connectedAt: connection.created_at }
      : { connected: false },
  });
}

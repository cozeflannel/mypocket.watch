import { NextResponse } from 'next/server';
import { getWorkerSession } from '@/lib/worker-auth';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/worker/disconnect-google
 * Disconnects worker's Google Calendar.
 */
export async function POST() {
  const session = await getWorkerSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const supabase = await createClient();
  await supabase
    .from('connected_accounts')
    .delete()
    .eq('worker_id', session.worker.id)
    .eq('provider', 'google');

  return NextResponse.json({ success: true });
}

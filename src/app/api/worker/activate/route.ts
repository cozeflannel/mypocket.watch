import { NextRequest, NextResponse } from 'next/server';
import { validateWorkerToken } from '@/lib/worker-auth';

/**
 * POST /api/worker/activate
 * Validates a magic link token and creates a worker session.
 */
export async function POST(request: NextRequest) {
  const { token } = await request.json();

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  const result = await validateWorkerToken(token);
  if (!result) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    worker: {
      id: result.worker.id,
      first_name: result.worker.first_name,
      last_name: result.worker.last_name,
    },
  });
}

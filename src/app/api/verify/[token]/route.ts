import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { processTimeCommand } from '@/lib/time-entry-processor';
import { sendTelegram, sendSMS, getTelegramKeyboard } from '@/lib/messaging';

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Haversine formula for distance in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { lat, lng } = await request.json();

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Coordinates required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // 1. Validate Token
  const { data: verification } = await supabase
    .from('location_verifications')
    .select('*, company:companies(job_site_lat, job_site_lng, geofence_radius)')
    .eq('token', token)
    .single();

  if (!verification) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
  }

  if (new Date(verification.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Link expired. Please request a new one.' }, { status: 400 });
  }

  if (verification.status !== 'pending') {
    return NextResponse.json({ error: 'Link already used.' }, { status: 400 });
  }

  // 2. Check Distance (only if geofence is configured)
  const company = verification.company;
  if (company.job_site_lat && company.job_site_lng) {
    const distance = getDistance(lat, lng, company.job_site_lat, company.job_site_lng);

    // Allow 100m buffer if radius not set
    const radius = company.geofence_radius || 100;

    if (distance > radius) {
      // Mark token as failed
      await supabase
        .from('location_verifications')
        .update({ status: 'failed' })
        .eq('id', verification.id);

      return NextResponse.json({
        error: `You are ${Math.round(distance)}m from the job site. Please head to the site and try again when you arrive.`,
        distance: Math.round(distance)
      }, { status: 403 });
    }
  }

  // 3. Success - Clock In!
  const { data: worker } = await supabase
    .from('workers')
    .select('*')
    .eq('id', verification.worker_id)
    .single();

  if (worker) {
    // Clock In (bypassing geofence since location is already verified)
    await processTimeCommand(worker, 'clock_in', verification.platform, true);

    // Mark token used
    await supabase
      .from('location_verifications')
      .update({ status: 'verified' })
      .eq('id', verification.id);

    // Send confirmation message
    const time = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const confirmMessage = `✅ You're clocked in at ${time}! Have a great shift.`;

    try {
      if (verification.platform === 'telegram' && worker.telegram_id) {
        await sendTelegram(worker.telegram_id, confirmMessage, getTelegramKeyboard());
      } else if (verification.platform === 'sms' && worker.phone) {
        await sendSMS(worker.phone, confirmMessage);
      }
    } catch (error) {
      console.error('Failed to send confirmation message:', error);
      // Don't fail the clock-in if message sending fails
    }
  }

  // 4. Return correct deep link
  let returnUrl = '';
  switch (verification.platform) {
    case 'telegram':
      returnUrl = 'https://t.me/MyPocketWatchbot';
      break;
    case 'sms':
      returnUrl = `sms:${process.env.TWILIO_PHONE_NUMBER}`;
      break;
    case 'whatsapp':
      returnUrl = `https://wa.me/${process.env.WHATSAPP_BUSINESS_PHONE?.replace(/\+/g, '')}`;
      break;
  }

  return NextResponse.json({
    success: true,
    message: `Location verified! You're now clocked in, ${worker?.first_name || ''}!`,
    returnUrl,
    platform: verification.platform
  });
}

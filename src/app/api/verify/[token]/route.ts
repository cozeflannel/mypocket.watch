import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { processTimeCommand } from '@/lib/time-entry-processor';

// Haversine formula for distance in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ1) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
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

  const supabase = createClient();
  
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

  // 2. Check Distance
  const company = verification.company;
  if (!company.job_site_lat || !company.job_site_lng) {
    // If no geofence set, allow it (or fail depending on policy - failing safe here)
    return NextResponse.json({ error: 'Company has no job site configured.' }, { status: 500 });
  }

  const distance = getDistance(lat, lng, company.job_site_lat, company.job_site_lng);
  
  // Allow 50m buffer if radius not set
  const radius = company.geofence_radius || 50; 

  if (distance > radius) {
    return NextResponse.json({ 
      error: `You are ${(distance - radius).toFixed(0)}m too far from the job site.` 
    }, { status: 403 });
  }

  // 3. Success - Clock In!
  const { data: worker } = await supabase
    .from('workers')
    .select('*')
    .eq('id', verification.worker_id)
    .single();

  if (worker) {
    // We reuse the processor but force it to bypass location check this time (internal flag needed?)
    // Actually, processTimeCommand handles the logic. We'll call it directly.
    // '1' = Clock In
    await processTimeCommand(worker, '1', verification.platform);
    
    // Mark token used
    await supabase
      .from('location_verifications')
      .update({ status: 'verified' })
      .eq('id', verification.id);
  }

  // 4. Return correct deep link
  let returnUrl = '';
  switch (verification.platform) {
    case 'sms':
      returnUrl = `sms:${process.env.TWILIO_PHONE_NUMBER}`;
      break;
    case 'whatsapp':
      returnUrl = `https://wa.me/${process.env.WHATSAPP_BUSINESS_PHONE?.replace(/\+/g, '')}`;
      break;
    // ... others
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Location verified! You are now clocked in.',
    returnUrl
  });
}

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { getAuthContext, isAuthError } from '@/lib/auth-helpers';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

// GET: Get Twilio connection status
export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return NextResponse.json({
      connected: false,
      error: 'Twilio not configured'
    });
  }

  try {
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    
    return NextResponse.json({
      connected: account.status === 'active',
      accountStatus: account.status,
      friendlyName: account.friendlyName,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
      verifyServiceSid: verifyServiceSid,
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : 'Failed to connect to Twilio'
    });
  }
}

// POST: Send verification code or SMS
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const body = await request.json();
  const { action, phone, code } = body;

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return NextResponse.json({ error: 'Twilio not configured' }, { status: 500 });
  }

  try {
    switch (action) {
      case 'send-verification': {
        if (!phone) {
          return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
        }
        
        if (!verifyServiceSid) {
          return NextResponse.json({ error: 'Verify service not configured' }, { status: 500 });
        }

        const verification = await client.verify.v2
          .services(verifyServiceSid)
          .verifications.create({
            to: phone,
            channel: 'sms'
          });

        return NextResponse.json({
          status: verification.status,
          to: verification.to
        });
      }

      case 'verify-code': {
        if (!phone || !code) {
          return NextResponse.json({ error: 'Phone and code required' }, { status: 400 });
        }

        if (!verifyServiceSid) {
          return NextResponse.json({ error: 'Verify service not configured' }, { status: 500 });
        }

        const verificationCheck = await client.verify.v2
          .services(verifyServiceSid)
          .verificationChecks.create({
            to: phone,
            code: code
          });

        return NextResponse.json({
          status: verificationCheck.status,
          valid: verificationCheck.status === 'approved'
        });
      }

      case 'send-sms': {
        if (!phone || !body.message) {
          return NextResponse.json({ error: 'Phone and message required' }, { status: 400 });
        }

        if (!process.env.TWILIO_PHONE_NUMBER) {
          return NextResponse.json({ error: 'Phone number not configured' }, { status: 500 });
        }

        const message = await client.messages.create({
          body: body.message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone
        });

        return NextResponse.json({
          sid: message.sid,
          status: message.status
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Twilio error'
    }, { status: 500 });
  }
}

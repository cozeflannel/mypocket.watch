import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(request: Request) {
  try {
    console.log('📝 Signup API called');
    const body = await request.json();
    console.log('📝 Request body:', { email: body.email, companyName: body.companyName, fullName: body.fullName });
    const { email, password, fullName, companyName } = body;

    // Validate input
    if (!email || !password || !fullName || !companyName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for better UX
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message ?? 'Failed to create account' },
        { status: 400 }
      );
    }

    // 2. Create company
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({ name: companyName, slug })
      .select()
      .single();

    if (companyError || !company) {
      // Rollback: delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: 'Failed to create company. Please try again.' },
        { status: 400 }
      );
    }

    // 3. Create admin user record
    const { error: adminError } = await supabase.from('admin_users').insert({
      auth_uid: authData.user.id,
      company_id: company.id,
      email,
      full_name: fullName,
      role: 'owner',
    });

    if (adminError) {
      // Rollback: delete company and auth user
      await supabase.from('companies').delete().eq('id', company.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: 'Account created but failed to set up admin profile. Please contact support.' },
        { status: 400 }
      );
    }

    // Success! Return success and let client sign in
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

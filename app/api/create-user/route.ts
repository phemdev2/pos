import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, role, companyId } = body;

    // 1. Validate incoming data
    const missingFields = [];
    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');
    if (!name) missingFields.push('name');
    if (!role) missingFields.push('role');
    if (!companyId) missingFields.push('companyId');

    if (missingFields.length > 0) {
      return NextResponse.json({ error: `Missing fields: ${missingFields.join(', ')}` }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // 2. Initialize Supabase Admin Client (Uses the SECRET key, completely hidden from browser)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. Create Auth User (Supabase securely hashes the password automatically)
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Bypass email verification for internal staff
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 4. Create Profile linked to the company
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: newUser.user.id,
      company_id: companyId,
      full_name: name,
      role: role
    });

    // 5. Rollback: If profile creation fails, delete the auth user so they aren't stuck
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return NextResponse.json({ error: "Failed to create profile: " + profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "User created successfully" });

  } catch (error: any) {
    return NextResponse.json({ error: "Server error: " + error.message }, { status: 500 });
  }
}
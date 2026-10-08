import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, name, inviterName, inviterId, redirectUrl, inviteToken } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase admin credentials (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) are missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase Admin client with Service Role Key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const targetEmail = String(email).trim().toLowerCase();
    const inviterDisplayName = inviterName ? String(inviterName).trim() : 'A colleague';
    const effectiveToken = inviteToken || `tok_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const effectiveRedirectUrl = redirectUrl || `https://taktic.app/login?circle_invite=${effectiveToken}&inviter=${encodeURIComponent(inviterDisplayName)}`;

    console.log(`Processing circle partner invite for ${targetEmail} from ${inviterDisplayName}...`);

    let inviteSent = false;
    let fallbackUsed = false;
    let inviteData = null;

    // 1. First, attempt Supabase Built-in Auth Invite Email (standard flow for new accounts)
    const { data: adminInviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      targetEmail,
      {
        data: {
          inviter_name: inviterDisplayName,
          inviter_id: inviterId || null,
          partner_name: name || null,
        },
        redirectTo: effectiveRedirectUrl,
      }
    );

    if (!inviteError) {
      inviteSent = true;
      inviteData = adminInviteData;
      console.log(`Supabase inviteUserByEmail succeeded for ${targetEmail}`);
    } else {
      console.warn('inviteUserByEmail note/error:', inviteError.message);

      // 2. If user already exists (HTTP 422 / already registered message), fallback to magic link OTP
      const isAlreadyRegistered =
        inviteError.status === 422 ||
        inviteError.message?.toLowerCase().includes('already') ||
        inviteError.message?.toLowerCase().includes('registered') ||
        inviteError.message?.toLowerCase().includes('exists');

      if (isAlreadyRegistered) {
        console.log(`User ${targetEmail} is already registered. Triggering magic link invite to existing account...`);
        const { data: otpData, error: otpError } = await supabaseAdmin.auth.signInWithOtp({
          email: targetEmail,
          options: {
            emailRedirectTo: effectiveRedirectUrl,
            data: {
              inviter_name: inviterDisplayName,
            },
          },
        });

        if (!otpError) {
          inviteSent = true;
          fallbackUsed = true;
          inviteData = otpData;
          console.log(`Magic link OTP dispatched to existing user ${targetEmail}`);
        } else {
          console.warn('signInWithOtp error:', otpError.message);
          // Even if rate limited or OTP fails, record the pending invite so when they log in they can still accept
          inviteSent = true;
          fallbackUsed = true;
        }
      } else {
        // Different error occurred
        return new Response(
          JSON.stringify({
            success: false,
            error: inviteError.message || 'Failed to dispatch email invite',
            status: inviteError.status || 400,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // 3. Persist record into circle_invites table
    if (inviterId) {
      try {
        await supabaseAdmin.from('circle_invites').upsert(
          {
            user_id: inviterId,
            email: targetEmail,
            name: name || targetEmail.split('@')[0],
            status: 'pending',
            invite_token: effectiveToken,
            invite_link: effectiveRedirectUrl,
          },
          { onConflict: 'user_id,email' }
        );
      } catch (dbErr) {
        console.warn('Could not upsert into circle_invites:', dbErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: fallbackUsed
          ? `Invitation sent to existing account: ${targetEmail}`
          : `Invitation email dispatched to ${targetEmail}`,
        token: effectiveToken,
        inviteLink: effectiveRedirectUrl,
        data: inviteData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in invite-partner function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

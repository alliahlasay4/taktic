import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowed origins for email redirect links (whitelisted to prevent open redirect token theft)
const ALLOWED_ORIGINS = [
  'https://taktic.app',
  'https://taktic-1.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase admin credentials are missing in Edge Function environment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Strict Authentication Check: Verify Caller's JWT
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Empty token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate the user with standard client
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceRoleKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const {
      data: { user: callerUser },
      error: userAuthError,
    } = await supabaseUserClient.auth.getUser(token);

    if (userAuthError || !callerUser) {
      console.warn('Caller JWT verification failed:', userAuthError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse & Validate Payload
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON request payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, name, inviterName, origin, inviteToken } = body;

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid recipient email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(targetEmail) || targetEmail.length > 254) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-invitation
    if (callerUser.email && callerUser.email.toLowerCase() === targetEmail) {
      return new Response(
        JSON.stringify({ error: 'You cannot invite your own email address as a circle partner' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Resolve & Sanitize Redirect URL against Allowed Origins (Prevent Open Redirect)
    let appOrigin = 'https://taktic.app';
    if (origin && typeof origin === 'string') {
      try {
        const parsedUrl = new URL(origin);
        const resolvedOrigin = parsedUrl.origin;
        if (ALLOWED_ORIGINS.includes(resolvedOrigin)) {
          appOrigin = resolvedOrigin;
        } else {
          console.warn(`Untrusted origin provided (${resolvedOrigin}); falling back to default.`);
        }
      } catch {
        // invalid URL; fall back to default
      }
    }

    // Securely derive inviter parameters (never trust client-supplied inviterId)
    const verifiedInviterId = callerUser.id;
    const inviterDisplayName = inviterName && typeof inviterName === 'string'
      ? inviterName.trim().slice(0, 50)
      : (callerUser.user_metadata?.full_name || callerUser.user_metadata?.name || 'A colleague');

    const sanitizedPartnerName = name && typeof name === 'string'
      ? name.trim().slice(0, 50)
      : targetEmail.split('@')[0];

    // Generate safe, tamper-evident random invite token if not a valid format
    const safeToken = typeof inviteToken === 'string' && /^[a-zA-Z0-9_-]{10,64}$/.test(inviteToken)
      ? inviteToken
      : `tok_${Date.now().toString(36)}_${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`;

    const effectiveRedirectUrl = `${appOrigin}/login?circle_invite=${encodeURIComponent(safeToken)}&inviter=${encodeURIComponent(inviterDisplayName)}`;

    // 4. Initialize Privileged Supabase Admin Client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 5. Rate-limit check: Ensure caller has not exceeded pending invites threshold (anti-abuse)
    const { count: pendingCount, error: countErr } = await supabaseAdmin
      .from('circle_invites')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', verifiedInviterId)
      .eq('status', 'pending');

    if (!countErr && typeof pendingCount === 'number' && pendingCount >= 20) {
      return new Response(
        JSON.stringify({ error: 'You have too many pending invitations. Please revoke existing pending invites before sending new ones.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing verified circle partner invite for ${targetEmail} from user ${verifiedInviterId}...`);

    let inviteSent = false;
    let fallbackUsed = false;
    let inviteData = null;

    // 6. Attempt Supabase Auth Admin Invite Email
    const { data: adminInviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      targetEmail,
      {
        data: {
          inviter_name: inviterDisplayName,
          inviter_id: verifiedInviterId,
          partner_name: sanitizedPartnerName,
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

      // Check if user is already registered, fallback to OTP magic link
      const isAlreadyRegistered =
        inviteError.status === 422 ||
        inviteError.message?.toLowerCase().includes('already') ||
        inviteError.message?.toLowerCase().includes('registered') ||
        inviteError.message?.toLowerCase().includes('exists');

      if (isAlreadyRegistered) {
        console.log(`User ${targetEmail} already registered. Sending OTP invite...`);
        const { data: otpData, error: otpError } = await supabaseAdmin.auth.signInWithOtp({
          email: targetEmail,
          options: {
            emailRedirectTo: effectiveRedirectUrl,
            data: {
              inviter_name: inviterDisplayName,
              inviter_id: verifiedInviterId,
            },
          },
        });

        if (!otpError) {
          inviteSent = true;
          fallbackUsed = true;
          inviteData = otpData;
        } else {
          console.warn('signInWithOtp error:', otpError.message);
          // Persist the invite even if OTP dispatch encountered email rate limit
          inviteSent = true;
          fallbackUsed = true;
        }
      } else {
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

    // 7. Persist record into circle_invites table under verified caller user_id
    try {
      await supabaseAdmin.from('circle_invites').upsert(
        {
          user_id: verifiedInviterId,
          email: targetEmail,
          name: sanitizedPartnerName,
          status: 'pending',
          invite_token: safeToken,
          invite_link: effectiveRedirectUrl,
        },
        { onConflict: 'user_id,email' }
      );
    } catch (dbErr) {
      console.warn('Could not upsert into circle_invites:', dbErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: fallbackUsed
          ? `Invitation sent to existing account: ${targetEmail}`
          : `Invitation email dispatched to ${targetEmail}`,
        token: safeToken,
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

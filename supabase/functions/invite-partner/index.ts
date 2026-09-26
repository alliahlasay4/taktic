import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, name, inviterName, inviterId, redirectUrl } = await req.json();

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

    console.log(`Attempting to invite user ${targetEmail} from ${inviterDisplayName}...`);

    // 1. Dispatch Supabase Built-in Auth Invite Email
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      targetEmail,
      {
        data: {
          inviter_name: inviterDisplayName,
          inviter_id: inviterId || null,
          partner_name: name || null,
        },
        redirectTo: redirectUrl || 'https://taktic.app/?circle_invite=accepted',
      }
    );

    if (inviteError) {
      console.error('Supabase inviteUserByEmail error:', inviteError);
      return new Response(
        JSON.stringify({
          success: false,
          error: inviteError.message || 'Failed to send invite',
          status: inviteError.status || 400,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Persist record into circle_invites table
    if (inviterId) {
      try {
        await supabaseAdmin.from('circle_invites').upsert(
          {
            user_id: inviterId,
            email: targetEmail,
            name: name || targetEmail.split('@')[0],
            status: 'pending',
            invite_token: `tok_${Date.now().toString(36)}`,
            invite_link: redirectUrl || `https://taktic.app/?circle_invite=accepted`,
          },
          { onConflict: 'user_id,email' }
        );
      } catch (dbErr) {
        console.warn('Could not upsert into circle_invites:', dbErr);
      }
    }

    console.log(`Successfully dispatched invite email to ${targetEmail}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitation email dispatched to ${targetEmail}`,
        data: inviteData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error handling invite-partner Edge Function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

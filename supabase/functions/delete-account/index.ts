// Created: 2025-12-23
// Last updated: 2026-04-07 (Phase 3: restrict CORS to SITE_URL)

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

// SITE_URL is set automatically from Supabase Authentication → URL Configuration.
// Falls back to '*' only if not configured (e.g. local development).
const allowedOrigin = Deno.env.get('SITE_URL') || '*';

const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service client for privileged operations
    const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const now = new Date().toISOString();
    const purgeDate = new Date(now);
    purgeDate.setDate(purgeDate.getDate() + 15);

    // Get user profile info for audit
    const { data: profile } = await serviceClient
      .from('user_profiles')
      .select('email, display_name')
      .eq('id', user.id)
      .maybeSingle();

    // Soft-delete user profile
    const { error: profileError } = await serviceClient
      .from('user_profiles')
      .update({
        deleted_at: now,
        purge_at: purgeDate.toISOString(),
        purge_reason: 'ACCOUNT_DELETION_15D',
        purge_state: 'SCHEDULED',
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error soft-deleting user profile:', profileError);
      return new Response(
        JSON.stringify({
          error: 'Failed to delete account',
          details: profileError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Record in audit table
    const { error: auditError } = await serviceClient.from('user_purge_audit').insert({
      user_id: user.id,
      email: profile?.email || user.email || 'unknown',
      display_name: profile?.display_name,
      deleted_at: now,
      purge_reason: 'ACCOUNT_DELETION_15D',
      polls_deleted_count: 0,
      success: true,
    });

    if (auditError) {
      console.error('Error recording audit:', auditError);
    }

    // Sign out the user
    await supabase.auth.signOut();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account scheduled for deletion',
        purge_at: purgeDate.toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in delete-account function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

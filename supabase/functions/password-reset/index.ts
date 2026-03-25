// Created: 2026-02-06
// Last updated: 2026-02-06

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function hashAnswer(answer: string): Promise<string> {
  const normalized = answer.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body = await req.json();
    const { action, email, answer, redirectTo } = body;

    if (!email) {
      return jsonResponse({ error: "Email is required" }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serviceClient = createClient(supabaseUrl, serviceKey);

    const normalizedEmail = email.toLowerCase().trim();

    if (action === 'get-question') {
      const { data: profile } = await serviceClient
        .from('user_profiles')
        .select('security_question')
        .eq('email', normalizedEmail)
        .is('deleted_at', null)
        .maybeSingle();

      if (!profile || !profile.security_question) {
        return jsonResponse({ question: null });
      }

      return jsonResponse({ question: profile.security_question });

    } else if (action === 'verify-answer') {
      if (!answer) {
        return jsonResponse({ error: "Answer is required" }, 400);
      }

      const { data: profile } = await serviceClient
        .from('user_profiles')
        .select('security_answer_hash')
        .eq('email', normalizedEmail)
        .is('deleted_at', null)
        .maybeSingle();

      if (!profile || !profile.security_answer_hash) {
        await new Promise(r => setTimeout(r, 1000));
        return jsonResponse({ error: "Verification failed" }, 400);
      }

      const hashedAnswer = await hashAnswer(answer);

      if (hashedAnswer !== profile.security_answer_hash) {
        await new Promise(r => setTimeout(r, 1000));
        return jsonResponse({ error: "Incorrect security answer" }, 400);
      }

      const resetOptions: { redirectTo?: string } = {};
      if (redirectTo) {
        resetOptions.redirectTo = redirectTo;
      }

      const { error: resetError } = await serviceClient.auth.resetPasswordForEmail(
        normalizedEmail,
        resetOptions
      );

      if (resetError) {
        console.error('Error sending reset email:', resetError);
        return jsonResponse({ error: "Failed to send reset email" }, 500);
      }

      return jsonResponse({
        success: true,
        message: "Password reset email sent. Please check your inbox."
      });

    } else {
      return jsonResponse({ error: "Invalid action" }, 400);
    }
  } catch (error) {
    console.error('Error in password-reset function:', error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

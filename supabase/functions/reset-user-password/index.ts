import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  email?: string;
  userId?: string;
  newPassword: string;
  forcePasswordChange?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: caller },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authorization: allow only master (and optionally admin for same empresa)
    const { data: callerRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    if (rolesError) {
      return new Response(JSON.stringify({ error: "Failed to check roles" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isMaster = (callerRoles || []).some((r: any) => r.role === "master");
    const isAdmin = (callerRoles || []).some((r: any) => r.role === "admin");

    if (!isMaster && !isAdmin) {
      return new Response(JSON.stringify({ error: "Only master/admin can reset passwords" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: ResetPasswordRequest = await req.json();
    const { email, userId, newPassword, forcePasswordChange } = body;

    if (!newPassword || newPassword.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let targetUserId = userId;

    if (!targetUserId) {
      if (!email) {
        return new Response(JSON.stringify({ error: "Provide userId or email" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: targetProfile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, empresa_id")
        .eq("email", email)
        .maybeSingle();

      if (profileError || !targetProfile) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      targetUserId = targetProfile.id;

      // If caller is only admin, ensure same empresa
      if (isAdmin && !isMaster) {
        const { data: callerProfile } = await supabaseAdmin
          .from("profiles")
          .select("empresa_id")
          .eq("id", caller.id)
          .maybeSingle();

        if (!callerProfile?.empresa_id || callerProfile.empresa_id !== targetProfile.empresa_id) {
          return new Response(JSON.stringify({ error: "Cannot reset password for other empresas" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
      password: newPassword,
    });

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (forcePasswordChange) {
      await supabaseAdmin
        .from("profiles")
        .update({ forcar_troca_senha: true })
        .eq("id", targetUserId);
    }

    return new Response(
      JSON.stringify({ success: true, userId: targetUserId, forcePasswordChange: !!forcePasswordChange }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("reset-user-password error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

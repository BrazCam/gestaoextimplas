import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProvisionRequest {
  empresaId: string;
  dominio: string;
}

const DEFAULT_USERS = [
  { prefix: 'admin', role: 'admin' as const },
  { prefix: 'cliente', role: 'cliente' as const },
  { prefix: 'reloc', role: 'reloc' as const },
  { prefix: 'tec', role: 'tec' as const },
];

const DEFAULT_PASSWORD = '123456';

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

    // Get the authorization header to verify the caller is a master user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Verify the caller's token
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if caller is a master user
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const isMaster = callerRoles?.some((r: any) => r.role === "master");
    
    if (!isMaster) {
      return new Response(
        JSON.stringify({ error: "Only master users can provision empresa users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ProvisionRequest = await req.json();
    const { empresaId, dominio } = body;

    if (!empresaId || !dominio) {
      return new Response(
        JSON.stringify({ error: "empresaId and dominio are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const createdUsers: Array<{ email: string; role: string }> = [];
    const errors: string[] = [];

    for (const userDef of DEFAULT_USERS) {
      const email = `${userDef.prefix}@${dominio}`;
      
      try {
        // Create the user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: {
            empresa_id: empresaId,
            nome: userDef.prefix.charAt(0).toUpperCase() + userDef.prefix.slice(1),
          },
        });

        if (createError) {
          errors.push(`${email}: ${createError.message}`);
          continue;
        }

        // Add the role for the new user
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({
            user_id: newUser.user.id,
            role: userDef.role,
            empresa_id: empresaId,
          });

        if (roleError) {
          errors.push(`${email} role: ${roleError.message}`);
          // Optionally rollback user creation
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
          continue;
        }

        createdUsers.push({ email, role: userDef.role });
      } catch (e) {
        errors.push(`${email}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        createdUsers,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("provision-empresa-users error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return json(500, { error: "Supabase environment variables are missing" });
  }

  if (!authHeader) {
    return json(401, { error: "Missing authorization header" });
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return json(401, { error: "User could not be resolved" });
  }

  const deletedAt = new Date().toISOString();
  const fallbackUsername = user.email?.split("@")[0] || "user";
  const deletedEmail = `deleted+${user.id}@deleted.local`;
  const deletedUsername = `deleted_${user.id.replace(/-/g, "")}`.slice(0, 40);

  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const { error: profileError } = await adminClient.from("profiles").upsert(
    {
      id: user.id,
      email: deletedEmail,
      username: deletedUsername,
      display_name: existingProfile?.display_name || user.user_metadata?.display_name || fallbackUsername,
      is_deleted: true,
      deleted_at: deletedAt,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return json(500, { error: profileError.message || "Profile soft delete failed" });
  }

  const { error: userDataError } = await adminClient.from("user_app_data").upsert(
    {
      user_id: user.id,
      is_deleted: true,
      deleted_at: deletedAt,
      updated_at: deletedAt,
    },
    { onConflict: "user_id" }
  );

  if (userDataError) {
    return json(500, { error: userDataError.message || "User app data soft delete failed" });
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id, false);

  if (deleteError) {
    return json(500, { error: deleteError.message || "Auth user delete failed" });
  }

  return json(200, { success: true, deletedAt });
});
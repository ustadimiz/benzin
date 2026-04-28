import { getSupabaseClient } from "./supabase";

const ACCOUNT_DELETED = "ACCOUNT_DELETED";
const ACCOUNT_DELETE_NOT_AVAILABLE = "ACCOUNT_DELETE_NOT_AVAILABLE";

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function toAppUser(authUser, profile = null) {
  const metadata = authUser?.user_metadata || {};
  const username = profile?.username || metadata.username || authUser.email?.split("@")[0] || "user";
  const displayName = profile?.display_name || metadata.display_name || username;

  return {
    id: authUser.id,
    username,
    displayName,
  };
}

function mapAuthError(error) {
  const msg = (error?.message || "").toLowerCase();

  if (msg.includes("email not confirmed")) return "EMAIL_NOT_CONFIRMED";
  if (msg.includes("invalid login credentials")) return "WRONG_CREDENTIALS";
  if (msg.includes("already registered")) return "EMAIL_TAKEN";
  if (msg.includes("signups not allowed") || msg.includes("signup is disabled")) return "SIGNUP_DISABLED";
  if (msg.includes("password should be at least")) return "WEAK_PASSWORD";
  if (msg.includes("supabase_not_configured")) return "SUPABASE_NOT_CONFIGURED";
  return "AUTH_GENERIC";
}

function getErrorText(error, fallback = "Unknown error") {
  return error?.message || error?.code || fallback;
}

function isDeletedAccount(authUser, profile = null) {
  return authUser?.user_metadata?.is_deleted === true || profile?.is_deleted === true;
}

async function signOutQuietly(supabase) {
  try {
    await supabase.auth.signOut();
  } catch (_) {}
}

async function ensureAccountIsActive(supabase, authUser, profile = null) {
  if (isDeletedAccount(authUser, profile)) {
    await signOutQuietly(supabase);
    throw new Error(ACCOUNT_DELETED);
  }

  return profile;
}

async function selectProfileWithFallback(supabase, matchColumn, matchValue) {
  const richQuery = await supabase
    .from("profiles")
    .select("id, email, username, display_name, is_deleted")
    .eq(matchColumn, matchValue)
    .maybeSingle();

  if (!richQuery.error) return richQuery.data || null;

  const fallbackQuery = await supabase
    .from("profiles")
    .select("id, email, username, display_name")
    .eq(matchColumn, matchValue)
    .maybeSingle();

  if (fallbackQuery.error) return null;
  return fallbackQuery.data || null;
}

async function upsertProfile(supabase, user, displayName, username, email) {
  const fallbackUsername = user.email?.split("@")[0] || "user";
  const normalizedUsername = normalizeUsername(username || user.user_metadata?.username || fallbackUsername);
  const normalizedEmail = normalizeEmail(email || user.email || "");
  const normalizedDisplayName = (displayName || user.user_metadata?.display_name || normalizedUsername).trim();

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: normalizedEmail,
      username: normalizedUsername,
      display_name: normalizedDisplayName,
    },
    { onConflict: "id" }
  );

  if (!error) {
    return {
      username: normalizedUsername,
      display_name: normalizedDisplayName,
    };
  }

  if (error?.code === "23505") {
    const duplicateField = error.message?.toLowerCase().includes("email") ? "EMAIL_TAKEN" : "USERNAME_TAKEN";
    throw new Error(duplicateField);
  }

  throw new Error(`AUTH_DETAIL:${getErrorText(error, "Profile write failed")}`);
}

async function getProfileByUserId(supabase, userId) {
  return selectProfileWithFallback(supabase, "id", userId);
}

async function getProfileByUsername(supabase, username) {
  return selectProfileWithFallback(supabase, "username", username);
}

export async function register(displayName, email, username, password) {
  const supabase = getSupabaseClient();
  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeUsername(username);

  const existingProfile = await getProfileByUsername(supabase, normalizedUsername);
  if (existingProfile?.is_deleted) throw new Error(ACCOUNT_DELETED);
  if (existingProfile) throw new Error("USERNAME_TAKEN");

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        username: normalizedUsername,
        display_name: displayName.trim(),
      },
    },
  });

  if (error) {
    const code = mapAuthError(error);
    if (code === "AUTH_GENERIC") {
      throw new Error(`AUTH_DETAIL:${getErrorText(error)}`);
    }
    throw new Error(code);
  }
  if (!data.user) throw new Error("AUTH_GENERIC");

  if (!data.session) {
    // Email confirmation flow: no active session yet, so profile will be created
    // after the first successful login when auth.uid() is available.
    throw new Error("EMAIL_NOT_CONFIRMED");
  }

  const profile = await upsertProfile(
    supabase,
    data.user,
    displayName,
    normalizedUsername,
    normalizedEmail
  );

  return toAppUser(data.user, profile);
}

export async function login(identifier, password) {
  const supabase = getSupabaseClient();
  const normalizedIdentifier = identifier.trim().toLowerCase();

  let email = normalizedIdentifier;
  let profile = null;

  if (!normalizedIdentifier.includes("@")) {
    profile = await getProfileByUsername(supabase, normalizedIdentifier);
    if (profile?.is_deleted) throw new Error(ACCOUNT_DELETED);
    if (!profile?.email) throw new Error("USER_NOT_FOUND");
    email = profile.email;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const code = mapAuthError(error);
    if (code === "WRONG_CREDENTIALS") throw new Error("WRONG_PASSWORD");
    if (code === "EMAIL_NOT_CONFIRMED") throw new Error("EMAIL_NOT_CONFIRMED");
    if (code === "AUTH_GENERIC") throw new Error(`AUTH_DETAIL:${getErrorText(error)}`);
    throw new Error(code);
  }

  if (!data.user) throw new Error("AUTH_GENERIC");

  let resolvedProfile = profile;
  if (!resolvedProfile) {
    resolvedProfile = await getProfileByUserId(supabase, data.user.id);
  }

  await ensureAccountIsActive(supabase, data.user, resolvedProfile);

  try {
    await upsertProfile(supabase, data.user);
  } catch (e) {
    if (e.message === "USERNAME_TAKEN" || e.message === "EMAIL_TAKEN") throw e;
  }

  if (!resolvedProfile) {
    resolvedProfile = await getProfileByUserId(supabase, data.user.id);
  }

  await ensureAccountIsActive(supabase, data.user, resolvedProfile);
  return toAppUser(data.user, resolvedProfile);
}

export async function restoreSession() {
  try {
    const supabase = getSupabaseClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.user) return null;

    const profile = await getProfileByUserId(supabase, session.user.id);
    await ensureAccountIsActive(supabase, session.user, profile);
    return toAppUser(session.user, profile);
  } catch {
    return null;
  }
}

export async function softDeleteAccount() {
  const supabase = getSupabaseClient();
  const functionNames = ["delete-account", "hyper-function"];
  let lastError = null;

  for (const functionName of functionNames) {
    const { error } = await supabase.functions.invoke(functionName, {
      body: {},
    });

    if (!error) {
      await signOutQuietly(supabase);
      return;
    }

    lastError = error;

    const msg = (error.message || "").toLowerCase();
    const status = error?.context?.status;
    const notFound =
      status === 404 ||
      msg.includes("function not found") ||
      msg.includes("failed to send a request");
    if (!notFound) {
      throw new Error(`AUTH_DETAIL:${getErrorText(error, "Account delete failed")}`);
    }
  }

  if (lastError) {
    throw new Error(ACCOUNT_DELETE_NOT_AVAILABLE);
  }
}

export async function logout() {
  try {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  } catch (_) {}
}

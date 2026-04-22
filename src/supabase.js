import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { createClient } from "@supabase/supabase-js";

const extra = Constants.expoConfig?.extra || Constants.manifest2?.extra || {};

const SUPABASE_URL = extra.supabaseUrl;
const SUPABASE_ANON_KEY = extra.supabaseAnonKey;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }
  return supabase;
}

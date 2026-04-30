import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

export const authPlaceholders = {
  signInWithEmail: "Use supabase.auth.signInWithPassword({ email, password })",
  signInWithGoogle: "Use supabase.auth.signInWithOAuth({ provider: 'google' }) with Expo AuthSession",
  profileTable: "profiles/users table stores subscription status and credit balance"
};

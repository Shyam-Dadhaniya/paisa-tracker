import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/services/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  /** Persists the display name on the Supabase account (user_metadata) so it
   *  follows the user across devices. */
  updateDisplayName: (name: string) => Promise<{ error?: string }>;
}

let initialized = false;

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,

  init: async () => {
    if (initialized || !isSupabaseConfigured) {
      set({ loading: false });
      return;
    }
    initialized = true;
    const { data } = await supabase.auth.getSession();
    set({ session: data.session, user: data.session?.user ?? null, loading: false });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return error ? { error: error.message } : {};
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },

  updateDisplayName: async (name) => {
    const { data, error } = await supabase.auth.updateUser({ data: { display_name: name.trim() } });
    if (error) return { error: error.message };
    set({ user: data.user });
    return {};
  },
}));

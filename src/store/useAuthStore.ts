import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../api/supabase';

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean; // true pendant le bootstrap initial
  signingIn: boolean;
  error: string | null;

  bootstrap: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<boolean>;
  signUpWithPassword: (email: string, password: string, name: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ ok: boolean; error?: string }>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true,
  signingIn: false,
  error: null,

  bootstrap: async () => {
    const { data } = await supabase.auth.getSession();
    set({ session: data.session, user: data.session?.user ?? null, loading: false });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
  },

  signInWithPassword: async (email, password) => {
    set({ signingIn: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      set({ signingIn: false, error: humanizeError(error.message) });
      return false;
    }
    set({ session: data.session, user: data.user, signingIn: false });
    return true;
  },

  signUpWithPassword: async (email, password, name) => {
    set({ signingIn: true, error: null });
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name: name.trim() } },
    });
    if (error) {
      set({ signingIn: false, error: humanizeError(error.message) });
      return false;
    }
    // Si la confirmation email est OFF côté Supabase, on a une session direct.
    set({ session: data.session, user: data.user, signingIn: false });
    return true;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },

  deleteAccount: async () => {
    try {
      const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
        'delete-account',
        { method: 'POST' }
      );
      if (error) return { ok: false, error: humanizeError(error.message) };
      if (data?.error) return { ok: false, error: humanizeError(data.error) };
      // À ce stade le user est supprimé côté DB — on signOut local proprement.
      await supabase.auth.signOut().catch(() => {});
      set({ session: null, user: null });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: humanizeError(String(e?.message ?? e)) };
    }
  },

  clearError: () => set({ error: null }),
}));

function humanizeError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Email ou mot de passe incorrect.';
  if (m.includes('already registered')) return 'Cet email a déjà un compte.';
  if (m.includes('password should be')) return 'Le mot de passe doit faire au moins 6 caractères.';
  if (m.includes('email rate limit')) return 'Trop de tentatives, réessaie dans quelques minutes.';
  if (m.includes('network')) return 'Pas de connexion — vérifie ton réseau.';
  if (m.includes('not found') && m.includes('function'))
    return "L'edge function 'delete-account' n'est pas encore déployée sur Supabase.";
  return msg;
}

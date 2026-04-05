'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { db, upsertAttempt, runOneTimeCleanup, refreshProblemDataIfNeeded } from '@/lib/db';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

// Supabase→ローカル同期は無効化
// （Supabase側に古い破損lapNoデータが残っており、
//   ログインのたびにローカルの修正済みデータを上書きしてしまうため）
// ローカルIndexedDBを正とする。
async function syncFromSupabase(_userId: string) {
  // no-op
}

// 問題データが空なら自動インポート
async function autoImportIfEmpty() {
  try {
    const count = await db.problems.count();
    if (count > 0) return;

    const res = await fetch('/data/reviewed_import.json');
    if (!res.ok) return;
    const json = await res.json();

    const { importParsedBatch } = await import('@/lib/import-parsed');
    await importParsedBatch(json);
    console.log('問題データを自動インポートしました');
  } catch (e) {
    console.warn('自動インポートエラー:', e);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const handleSignIn = useCallback(async (newUser: User) => {
    setUser(newUser);
    syncFromSupabase(newUser.id);
    autoImportIfEmpty();
    await refreshProblemDataIfNeeded();
    runOneTimeCleanup();
  }, []);

  useEffect(() => {
    if (!supabase) {
      // Supabase未設定: ゲストモードで動作
      autoImportIfEmpty();
      refreshProblemDataIfNeeded().then(() => runOneTimeCleanup());
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleSignIn(session.user);
      } else {
        autoImportIfEmpty();
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        handleSignIn(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [handleSignIn]);

  // 未ログイン時は /login にリダイレクト（/login 自体は除外）
  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [loading, user, pathname, router]);

  const signOut = async () => {
    await supabase?.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

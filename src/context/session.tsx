import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { setAccessToken, setUnauthorizedHandler } from '@/api/client';

const TOKEN_KEY = 'rezy.accessToken';
const NEEDS_PROFILE_KEY = 'rezy.needsProfile';

type SessionValue = {
  isLoading: boolean;
  token: string | null;
  needsProfile: boolean;
  showWelcome: boolean; // 프로필 완성 직후 환영 화면을 한 번 보여준다
  signIn: (token: string, needsProfile: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  completeProfile: () => Promise<void>;
  finishWelcome: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const value = use(SessionContext);
  if (!value) throw new Error('useSession 은 SessionProvider 안에서만 쓸 수 있습니다.');
  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // 앱 시작 시 저장된 토큰 복원
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedToken, storedNeedsProfile] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(NEEDS_PROFILE_KEY),
        ]);
        if (cancelled) return;
        setAccessToken(storedToken);
        setToken(storedToken);
        setNeedsProfile(storedNeedsProfile === 'true');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (newToken: string, newNeedsProfile: boolean) => {
    setAccessToken(newToken);
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    await SecureStore.setItemAsync(NEEDS_PROFILE_KEY, String(newNeedsProfile));
    setNeedsProfile(newNeedsProfile);
    setToken(newToken);
  }, []);

  const signOut = useCallback(async () => {
    setAccessToken(null);
    setToken(null);
    setNeedsProfile(false);
    setShowWelcome(false);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(NEEDS_PROFILE_KEY);
  }, []);

  const completeProfile = useCallback(async () => {
    await SecureStore.setItemAsync(NEEDS_PROFILE_KEY, 'false');
    setShowWelcome(true);
    setNeedsProfile(false);
  }, []);

  const finishWelcome = useCallback(() => setShowWelcome(false), []);

  // 토큰 만료(401) → 로그아웃
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const value = useMemo(
    () => ({
      isLoading,
      token,
      needsProfile,
      showWelcome,
      signIn,
      signOut,
      completeProfile,
      finishWelcome,
    }),
    [isLoading, token, needsProfile, showWelcome, signIn, signOut, completeProfile, finishWelcome],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

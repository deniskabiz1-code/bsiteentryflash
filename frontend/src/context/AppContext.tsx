import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { fetchMe } from '@/api/client';
import { getTgWebApp } from '@/lib/tgWebApp';
import { User } from '@/types';
import {
  resolvePersonalizedAnalysis,
  writePersonalizedAnalysisPreference,
} from '@/utils/personalizedAnalysis';
import {
  isDarkThemeSaveInFlight,
  normalizeDarkTheme,
  syncDarkThemeFromServer,
} from '@/utils/theme';

interface AppContextType {
  user: User | null;
  channelSubscribed: boolean;
  testCreditsEnabled: boolean;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  applyUser: (user: User) => void;
}

const AppContext = createContext<AppContextType>({
  user: null,
  channelSubscribed: false,
  testCreditsEnabled: false,
  loading: true,
  error: null,
  refreshUser: async () => {},
  applyUser: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [channelSubscribed, setChannelSubscribed] = useState(false);
  const [testCreditsEnabled, setTestCreditsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  const refreshUser = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchMe();
      const personalizedAnalysis = resolvePersonalizedAnalysis(data.user?.personalizedAnalysis);
      writePersonalizedAnalysisPreference(personalizedAnalysis);
      const preserveTheme = isDarkThemeSaveInFlight()
        ? normalizeDarkTheme(userRef.current?.darkTheme)
        : undefined;
      const darkTheme = syncDarkThemeFromServer(data.user?.darkTheme, preserveTheme);
      setUser({ ...data.user, personalizedAnalysis, darkTheme });
      setChannelSubscribed(data.channelSubscribed);
      setTestCreditsEnabled(Boolean(data.testCreditsEnabled));
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 401 ? 'session_expired' : 'load_failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyUser = useCallback((nextUser: User) => {
    const darkTheme = syncDarkThemeFromServer(nextUser.darkTheme);
    setUser({ ...nextUser, darkTheme });
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const webApp = getTgWebApp();
    if (!webApp) return;
    const onActivated = () => {
      refreshUser();
    };
    webApp.onEvent('activated', onActivated);
    return () => webApp.offEvent('activated', onActivated);
  }, [refreshUser]);

  return (
    <AppContext.Provider value={{ user, channelSubscribed, testCreditsEnabled, loading, error, refreshUser, applyUser }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
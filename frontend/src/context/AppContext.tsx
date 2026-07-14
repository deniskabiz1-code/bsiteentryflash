import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { fetchMe } from '@/api/client';
import { User } from '@/types';
import {
  resolvePersonalizedAnalysis,
  writePersonalizedAnalysisPreference,
} from '@/utils/personalizedAnalysis';
import {
  applyTheme,
  resolveDarkTheme,
  writeDarkThemePreference,
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

  const refreshUser = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchMe();
      const personalizedAnalysis = resolvePersonalizedAnalysis(data.user?.personalizedAnalysis);
      writePersonalizedAnalysisPreference(personalizedAnalysis);
      const darkTheme = resolveDarkTheme(
        data.user?.darkTheme,
        Boolean(data.user?.subscriptionActive),
      );
      writeDarkThemePreference(darkTheme);
      applyTheme(darkTheme);
      setUser({ ...data.user, personalizedAnalysis, darkTheme });
      setChannelSubscribed(data.channelSubscribed);
      setTestCreditsEnabled(Boolean(data.testCreditsEnabled));
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyUser = useCallback((nextUser: User) => {
    const darkTheme = resolveDarkTheme(
      nextUser.darkTheme,
      Boolean(nextUser.subscriptionActive),
    );
    writeDarkThemePreference(darkTheme);
    applyTheme(darkTheme);
    setUser({ ...nextUser, darkTheme });
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    refreshUser();
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
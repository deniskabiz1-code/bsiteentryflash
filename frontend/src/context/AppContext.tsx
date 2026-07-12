import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { fetchMe } from '@/api/client';
import { User } from '@/types';

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
      setUser(data.user);
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
    setUser(nextUser);
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
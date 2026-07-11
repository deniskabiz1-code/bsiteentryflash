import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface OverlayContextType {
  overlayActive: boolean;
  registerOverlay: () => void;
  unregisterOverlay: () => void;
}

const OverlayContext = createContext<OverlayContextType>({
  overlayActive: false,
  registerOverlay: () => {},
  unregisterOverlay: () => {},
});

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  const registerOverlay = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  const unregisterOverlay = useCallback(() => {
    setCount((c) => Math.max(0, c - 1));
  }, []);

  return (
    <OverlayContext.Provider
      value={{ overlayActive: count > 0, registerOverlay, unregisterOverlay }}
    >
      {children}
    </OverlayContext.Provider>
  );
}

export function useOverlay() {
  return useContext(OverlayContext);
}
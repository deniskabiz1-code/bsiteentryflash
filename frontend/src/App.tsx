import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { OverlayProvider, useOverlay } from '@/context/OverlayContext';
import LoadingScreen from '@/components/LoadingScreen';
import BottomNav from '@/components/BottomNav';
import MockBanner from '@/components/MockBanner';
import TelegramBootstrap from '@/components/TelegramBootstrap';
import Onboarding from '@/pages/Onboarding';
import Home from '@/pages/Home';
import Analysis from '@/pages/Analysis';
import AnalysisResult from '@/pages/AnalysisResult';
import HairstyleAnalysis from '@/pages/HairstyleAnalysis';
import Progress from '@/pages/Progress';
import Profile from '@/pages/Profile';

function AppRoutes() {
  const { user, loading } = useApp();
  const { overlayActive } = useOverlay();
  const location = useLocation();
  const hideNavForFirstAnalysis =
    location.pathname.startsWith('/analysis')
    && (user?.faceAnalysisCount ?? 0) === 0;

  if (loading) return <LoadingScreen />;

  const skipOnboarding = import.meta.env.VITE_SKIP_ONBOARDING === 'true';

  if (!user?.onboarded && !skipOnboarding) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  }

  const needsFirstAnalysis = (user?.faceAnalysisCount ?? 0) === 0;

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            needsFirstAnalysis
              ? <Navigate to="/analysis" replace state={{ firstAnalysis: true, welcome: true }} />
              : <Home />
          }
        />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/analysis/result" element={<AnalysisResult />} />
        <Route path="/analysis/hairstyle" element={<HairstyleAnalysis />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!overlayActive && !hideNavForFirstAnalysis && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppProvider>
        <OverlayProvider>
          <TelegramBootstrap />
          <MockBanner />
          <div className={import.meta.env.VITE_MOCK_MODE === 'true' ? 'pt-6' : ''}>
            <AppRoutes />
          </div>
        </OverlayProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
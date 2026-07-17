import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { OverlayProvider, useOverlay } from '@/context/OverlayContext';
import LoadingScreen from '@/components/LoadingScreen';
import BottomNav from '@/components/BottomNav';
import MockBanner from '@/components/MockBanner';
import TelegramBootstrap from '@/components/TelegramBootstrap';
import ScrollToTop from '@/components/ScrollToTop';
import PageTransition from '@/components/PageTransition';
import Onboarding from '@/pages/Onboarding';
import Home from '@/pages/Home';
import Analysis from '@/pages/Analysis';
import AnalysisResult from '@/pages/AnalysisResult';
import HairstyleAnalysis from '@/pages/HairstyleAnalysis';
import Progress from '@/pages/Progress';
import Profile from '@/pages/Profile';
import FreeAnalysis from '@/pages/FreeAnalysis';
import { shouldSkipOnboarding } from '@/utils/onboarding';

function AppRoutes() {
  const { user, loading, error, refreshUser } = useApp();
  const { overlayActive } = useOverlay();
  const location = useLocation();
  const hideNavOnAnalysisUpload =
    location.pathname === '/analysis'
    && (user?.faceAnalysisCount ?? 0) === 0
    && (user?.freeAnalysisAvailable ?? true);
  const hideNavOnOverlayPage = location.pathname === '/free-analysis';

  if (loading) return <LoadingScreen />;

  if (error && !user) {
    return (
      <div className="page">
        <div className="page-inner space-y-4 pt-20 text-center">
          <h1 className="heading-md">
            {error === 'session_expired' ? 'Сессия устарела' : 'Не удалось загрузить профиль'}
          </h1>
          <p className="text-[15px] leading-relaxed text-app-muted">
            {error === 'session_expired'
              ? 'Закройте приложение и откройте Primeform снова из бота в Telegram — профиль на месте.'
              : 'Проверьте интернет и попробуйте снова.'}
          </p>
          <button type="button" onClick={() => refreshUser()} className="btn-light">
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  const skipOnboarding = import.meta.env.VITE_SKIP_ONBOARDING === 'true';

  if (!skipOnboarding && !shouldSkipOnboarding(user)) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  }

  const needsFirstAnalysis =
    (user?.faceAnalysisCount ?? 0) === 0
    && (user?.freeAnalysisAvailable ?? true);

  return (
    <>
      <PageTransition key={location.pathname}>
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
          <Route path="/analysis/result/:id" element={<AnalysisResult />} />
          <Route path="/analysis/result" element={<AnalysisResult />} />
          <Route path="/analysis/hairstyle" element={<HairstyleAnalysis />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/free-analysis" element={<FreeAnalysis />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
      {!overlayActive && !hideNavOnAnalysisUpload && !hideNavOnOverlayPage && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollToTop />
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
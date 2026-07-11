import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import LoadingScreen from '@/components/LoadingScreen';
import BottomNav from '@/components/BottomNav';
import MockBanner from '@/components/MockBanner';
import Onboarding from '@/pages/Onboarding';
import Home from '@/pages/Home';
import Analysis from '@/pages/Analysis';
import AnalysisResult from '@/pages/AnalysisResult';
import HairstyleAnalysis from '@/pages/HairstyleAnalysis';
import Progress from '@/pages/Progress';
import Profile from '@/pages/Profile';

function AppRoutes() {
  const { user, loading } = useApp();

  if (loading) return <LoadingScreen />;

  const skipOnboarding = import.meta.env.VITE_SKIP_ONBOARDING === 'true';

  if (!user?.onboarded && !skipOnboarding) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/analysis/result" element={<AnalysisResult />} />
        <Route path="/analysis/hairstyle" element={<HairstyleAnalysis />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppProvider>
        <MockBanner />
        <div className={import.meta.env.VITE_MOCK_MODE === 'true' ? 'pt-6' : ''}>
          <AppRoutes />
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}
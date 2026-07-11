import { Home, BarChart3, TrendingUp, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { path: '/', icon: Home, label: 'Главная' },
  { path: '/analysis', icon: BarChart3, label: 'Анализ' },
  { path: '/progress', icon: TrendingUp, label: 'Прогресс' },
  { path: '/profile', icon: User, label: 'Профиль' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-2 bg-gradient-to-t from-app-canvas via-app-canvas to-transparent">
      <div className="max-w-md mx-auto bg-app-surface rounded-full shadow-float px-2 py-2 flex items-center justify-around">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active =
            location.pathname === path ||
            (path === '/analysis' && location.pathname.startsWith('/analysis'));
          return (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-5 py-2.5 rounded-full transition-all duration-200 ${
                active ? 'bg-app-surface shadow-pill scale-105' : 'text-app-muted'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} className={active ? 'text-app-text' : ''} />
              <span className={`text-[10px] font-semibold ${active ? 'text-app-text' : 'text-app-muted'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
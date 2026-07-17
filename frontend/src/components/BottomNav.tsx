import { Home, BarChart3, TrendingUp, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { navigateWithTransition } from '@/utils/navigateWithTransition';

const tabs = [
  { path: '/', icon: Home, label: 'Главная' },
  { path: '/analysis', icon: BarChart3, label: 'Анализ' },
  { path: '/progress', icon: TrendingUp, label: 'Прогресс' },
  { path: '/profile', icon: User, label: 'Профиль' },
];

function isTabActive(pathname: string, path: string): boolean {
  if (path === '/') return pathname === '/';
  if (path === '/analysis') return pathname.startsWith('/analysis');
  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav-enter fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-app-canvas via-app-canvas to-transparent pb-6 pt-2">
      <div className="page-inner">
        <div className="relative flex items-center justify-around rounded-full bg-app-surface px-2 py-2 shadow-float">
          {tabs.map(({ path, icon: Icon, label }) => {
            const active = isTabActive(location.pathname, path);
            return (
              <button
                key={path}
                type="button"
                data-touch-interactive
                onClick={() => {
                  if (!active) navigateWithTransition(navigate, path);
                }}
                className={`relative z-10 flex flex-col items-center gap-0.5 rounded-full px-5 py-2.5 transition-all duration-200 ease-out ${
                  active
                    ? 'scale-105 text-brand-greenDark'
                    : 'scale-100 text-app-muted active:scale-95'
                }`}
              >
                {active && (
                  <span
                    className="absolute inset-0 -z-10 rounded-full bg-app-surface shadow-pill anim-scale-in"
                    aria-hidden
                  />
                )}
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 2}
                  className={`transition-all duration-200 ${active ? 'text-brand-greenDark' : ''}`}
                />
                <span
                  className={`text-[10px] font-semibold transition-colors duration-200 ${
                    active ? 'text-brand-greenDark' : 'text-app-muted'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

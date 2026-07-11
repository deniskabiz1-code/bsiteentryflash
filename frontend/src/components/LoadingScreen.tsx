import { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-app-canvas px-6 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-app-text border-t-transparent" />
      <p className="text-sm font-medium text-app-muted">Primeform</p>
      {slow && (
        <p className="max-w-xs text-[13px] leading-relaxed text-app-faint">
          Подключаемся к серверу… первый запуск может занять до 30 секунд
        </p>
      )}
    </div>
  );
}
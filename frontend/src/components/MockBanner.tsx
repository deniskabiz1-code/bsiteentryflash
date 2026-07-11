export default function MockBanner() {
  if (import.meta.env.VITE_MOCK_MODE !== 'true') return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-400 text-app-text text-center text-[11px] py-1.5 font-semibold">
      Режим предпросмотра — демо-данные
    </div>
  );
}
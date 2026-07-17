export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-canvas">
      <div className="spinner spinner-lg" aria-label="Загрузка" />
    </div>
  );
}

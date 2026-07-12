export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-canvas">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-app-text border-t-transparent" />
    </div>
  );
}
export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-app-canvas gap-4">
      <div className="w-10 h-10 border-2 border-app-text border-t-transparent rounded-full animate-spin" />
      <p className="text-app-muted text-sm font-medium">Primeform</p>
    </div>
  );
}
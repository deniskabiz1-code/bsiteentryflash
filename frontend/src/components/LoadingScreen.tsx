export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-canvas">
      <div className="flex flex-col items-center gap-4 anim-scale-in">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-greenLight shadow-pill">
          <div className="pulse-soft h-3 w-3 rounded-full bg-brand-green" />
        </div>
        <div className="spinner spinner-lg" />
      </div>
    </div>
  );
}

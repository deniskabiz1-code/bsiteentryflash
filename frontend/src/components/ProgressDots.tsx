interface ProgressDotsProps {
  total: number;
  current: number;
}

export default function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <div className="flex justify-center gap-2 py-4">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-300 ${
            i === current
              ? 'w-10 bg-app-text'
              : i < current
                ? 'w-6 bg-app-text/30'
                : 'w-6 bg-app-border'
          }`}
        />
      ))}
    </div>
  );
}
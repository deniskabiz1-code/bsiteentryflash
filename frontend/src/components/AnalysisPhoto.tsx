import { useEffect, useState } from 'react';
import { fetchAnalysisPhoto } from '@/api/client';
import { assetUrl } from '@/utils/assets';

type AnalysisPhotoProps = {
  analysisId?: number;
  photoUrl?: string | null;
  alt?: string;
  className?: string;
};

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true';

export default function AnalysisPhoto({
  analysisId,
  photoUrl,
  alt = '',
  className = '',
}: AnalysisPhotoProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    const load = async () => {
      setFailed(false);
      setSrc(null);

      if (!photoUrl && !analysisId) return;

      if (photoUrl?.startsWith('http')) {
        if (!cancelled) setSrc(photoUrl);
        return;
      }

      if (!MOCK && analysisId) {
        const blob = await fetchAnalysisPhoto(analysisId);
        if (cancelled) return;
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setSrc(objectUrl);
          return;
        }
      }

      if (photoUrl && !cancelled) {
        setSrc(assetUrl(photoUrl));
      }
    };

    load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [analysisId, photoUrl]);

  if (!photoUrl && !analysisId) return null;

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-app-track text-app-muted ${className}`}
        aria-hidden
      >
        <span className="text-[12px]">Фото недоступно</span>
      </div>
    );
  }

  if (!src) {
    return <div className={`animate-pulse bg-app-track ${className}`} aria-hidden />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
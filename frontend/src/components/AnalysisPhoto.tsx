import { useEffect, useState } from 'react';
import { fetchAnalysisPhoto, fetchPublicAsset } from '@/api/client';
import { getTgWebApp } from '@/lib/tgWebApp';
import { assetUrl } from '@/utils/assets';

type AnalysisPhotoProps = {
  analysisId?: number;
  photoUrl?: string | null;
  alt?: string;
  className?: string;
};

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true';

function applyBlob(
  blob: Blob | null,
  cancelled: boolean,
  onReady: (url: string) => string,
): string | null {
  if (!blob || cancelled) return null;
  return onReady(URL.createObjectURL(blob));
}

export default function AnalysisPhoto({
  analysisId,
  photoUrl,
  alt = '',
  className = '',
}: AnalysisPhotoProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [authReady, setAuthReady] = useState(() => Boolean(getTgWebApp()?.initData));

  useEffect(() => {
    const webApp = getTgWebApp();
    if (!webApp) return;

    if (webApp.initData) {
      setAuthReady(true);
      return;
    }

    const timer = window.setInterval(() => {
      if (getTgWebApp()?.initData) {
        setAuthReady(true);
        window.clearInterval(timer);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, []);

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

      if (!MOCK && analysisId && authReady) {
        const blob = await fetchAnalysisPhoto(analysisId);
        if (cancelled) return;
        const url = applyBlob(blob, cancelled, (nextUrl) => {
          objectUrl = nextUrl;
          return nextUrl;
        });
        if (url) {
          setSrc(url);
          return;
        }
      }

      if (photoUrl && !MOCK) {
        const blob = await fetchPublicAsset(photoUrl);
        if (cancelled) return;
        const url = applyBlob(blob, cancelled, (nextUrl) => {
          objectUrl = nextUrl;
          return nextUrl;
        });
        if (url) {
          setSrc(url);
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
  }, [analysisId, photoUrl, authReady]);

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
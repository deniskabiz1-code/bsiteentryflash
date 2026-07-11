import { useEffect, useState } from 'react';
import { getTgWebApp } from '@/lib/tgWebApp';
import { fetchProfilePhoto } from '@/api/client';

export function useTelegramPhoto() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const tgPhoto = getTgWebApp()?.initDataUnsafe.user?.photo_url || null;
    let objectUrl: string | null = null;
    let cancelled = false;

    const load = async () => {
      if (tgPhoto) {
        setPhotoUrl(tgPhoto);
        return;
      }

      const blob = await fetchProfilePhoto();
      if (cancelled) return;

      if (blob && blob.size > 0) {
        objectUrl = URL.createObjectURL(blob);
        setPhotoUrl(objectUrl);
      } else {
        setPhotoUrl(null);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  return photoUrl;
}
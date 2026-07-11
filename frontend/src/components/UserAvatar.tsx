import { useEffect, useState } from 'react';

const SIZES = {
  xs: 'h-10 w-10 text-sm',
  sm: 'h-16 w-16 text-3xl',
  md: 'h-20 w-20 text-4xl',
  lg: 'h-28 w-28 text-5xl',
} as const;

interface UserAvatarProps {
  photoUrl?: string | null;
  fallbackLetter: string;
  size?: keyof typeof SIZES;
  className?: string;
}

export default function UserAvatar({
  photoUrl,
  fallbackLetter,
  size = 'sm',
  className = '',
}: UserAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const letter = fallbackLetter.charAt(0).toUpperCase() || 'P';
  const showPhoto = photoUrl && !imgFailed;

  useEffect(() => {
    setImgFailed(false);
  }, [photoUrl]);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-app-surface font-bold shadow-float ${SIZES[size]} ${className}`}
    >
      {showPhoto ? (
        <img
          src={photoUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        letter
      )}
    </div>
  );
}
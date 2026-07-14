import { useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface PhotoUploadProps {
  onPhotoSelect: (file: File) => void;
  onPhotoClear?: () => void;
  preview?: string | null;
  label?: string;
  tips?: string[];
  compact?: boolean;
  /** Preview expands in a fixed grid slot (first-analysis flow only). */
  fill?: boolean;
  dense?: boolean;
}

const COMPACT_FRAME_CLASS =
  'aspect-[4/5] w-full max-h-[min(52dvh,26rem)] shrink-0';

export default function PhotoUpload({
  onPhotoSelect,
  onPhotoClear,
  preview,
  label = 'Загрузить фото',
  tips,
  compact = false,
  fill = false,
  dense = false,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(preview || null);

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    onPhotoSelect(file);
  };

  const clear = () => {
    setLocalPreview(null);
    if (inputRef.current) inputRef.current.value = '';
    onPhotoClear?.();
  };

  const openGallery = () => {
    const input = inputRef.current;
    if (!input) return;
    input.removeAttribute('capture');
    input.click();
    input.setAttribute('capture', 'user');
  };

  if (localPreview) {
    return (
      <div
        className={`relative overflow-hidden rounded-3xl shadow-card ${
          compact
            ? fill
              ? 'flex h-full min-h-0 max-h-full flex-1 flex-col'
              : COMPACT_FRAME_CLASS
            : ''
        }`}
      >
        <img
          src={localPreview}
          alt="Preview"
          className={`w-full object-cover object-center ${
            compact && fill ? 'min-h-0 flex-1' : compact ? 'h-full' : 'aspect-[3/4]'
          }`}
        />
        <button
          type="button"
          onClick={clear}
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full ${compact ? 'flex flex-col gap-3' : 'space-y-4'}`}>
      {tips && (
        <div className="card !p-4 space-y-2">
          <p className="text-[13px] font-semibold text-app-muted">Советы для лучшего результата</p>
          <ul className="text-[14px] text-app-muted space-y-1.5">
            {tips.map((tip, i) => (
              <li key={i}>• {tip}</li>
            ))}
          </ul>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed
          border-app-border bg-app-canvas transition-colors active:bg-app-track
          ${
            compact
              ? `${COMPACT_FRAME_CLASS} ${dense ? 'py-4 gap-1' : 'py-8'}`
              : 'aspect-[3/4] gap-4 shadow-card'
          }`}
      >
        <div
          className={`flex items-center justify-center rounded-full bg-brand-green ${
            compact ? (dense ? 'h-12 w-12' : 'h-16 w-16') : 'h-20 w-20 shadow-pill'
          }`}
        >
          <Camera
            size={compact ? (dense ? 24 : 30) : 32}
            className="text-white"
            strokeWidth={1.5}
          />
        </div>
        <span className={`font-medium text-app-text ${dense ? 'text-[14px]' : 'text-[15px]'}`}>
          {label}
        </span>
        {compact && !dense && (
          <span className="text-[12px] text-app-muted">Нажмите, чтобы открыть камеру</span>
        )}
        {!compact && (
          <span className="text-[13px] text-brand-greenDark">Нажмите, чтобы сделать селфи</span>
        )}
      </button>

      {compact ? (
        <button
          type="button"
          onClick={openGallery}
          className={`w-full text-center font-medium text-brand-greenDark ${dense ? 'text-[12px]' : 'text-[13px]'}`}
        >
          Выбрать из галереи
        </button>
      ) : (
        <button type="button" onClick={openGallery} className="btn-light flex items-center justify-center gap-2">
          <Upload size={18} />
          Выбрать из галереи
        </button>
      )}
    </div>
  );
}
import { useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface PhotoUploadProps {
  onPhotoSelect: (file: File) => void;
  preview?: string | null;
  label?: string;
  tips?: string[];
  compact?: boolean;
  fill?: boolean;
}

export default function PhotoUpload({
  onPhotoSelect,
  preview,
  label = 'Загрузить фото',
  tips,
  compact = false,
  fill = false,
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
      <div className={`relative overflow-hidden rounded-3xl shadow-card ${compact ? (fill ? 'first-analysis-photo-fill' : 'h-56') : ''}`}>
        <img
          src={localPreview}
          alt="Preview"
          className={`w-full object-cover ${compact ? 'h-full' : 'aspect-[3/4]'}`}
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
    <div className={`w-full ${compact ? (fill ? 'first-analysis-photo-fill h-full gap-3' : 'space-y-3') : 'space-y-4'}`}>
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
          ${compact ? (fill ? 'min-h-0 flex-1 py-6' : 'h-36 py-3') : 'aspect-[3/4] gap-4 shadow-card'}`}
      >
        <div className={`flex items-center justify-center rounded-full bg-brand-green ${compact ? (fill ? 'h-16 w-16' : 'h-14 w-14') : 'h-20 w-20 shadow-pill'}`}>
          <Camera size={compact ? (fill ? 30 : 26) : 32} className="text-white" strokeWidth={1.5} />
        </div>
        <span className="text-[15px] font-medium text-app-text">{label}</span>
        {compact && (
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
          className={`w-full text-center text-[13px] font-medium text-brand-greenDark ${fill ? 'shrink-0' : ''}`}
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
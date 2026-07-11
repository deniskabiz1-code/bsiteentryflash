import { useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface PhotoUploadProps {
  onPhotoSelect: (file: File) => void;
  preview?: string | null;
  label?: string;
  tips?: string[];
  compact?: boolean;
}

export default function PhotoUpload({
  onPhotoSelect,
  preview,
  label = 'Загрузить фото',
  tips,
  compact = false,
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
      <div className={`relative overflow-hidden rounded-3xl shadow-card ${compact ? 'h-52' : ''}`}>
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
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
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
        className={`flex w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed
          border-brand-green/25 bg-brand-greenTint shadow-card transition-colors active:bg-brand-greenLight/40
          ${compact ? 'h-44' : 'aspect-[3/4] gap-4'}`}
      >
        <div className={`flex items-center justify-center rounded-full bg-brand-green shadow-pill ${compact ? 'h-16 w-16' : 'h-20 w-20'}`}>
          <Camera size={compact ? 28 : 32} className="text-white" strokeWidth={1.5} />
        </div>
        <span className={`font-medium text-app-text ${compact ? 'text-[14px]' : 'text-[15px]'}`}>{label}</span>
        {!compact && (
          <span className="text-[13px] text-brand-greenDark">Нажмите, чтобы сделать селфи</span>
        )}
      </button>

      {compact ? (
        <button
          type="button"
          onClick={openGallery}
          className="w-full text-center text-[13px] font-medium text-brand-greenDark"
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
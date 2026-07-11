import { useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface PhotoUploadProps {
  onPhotoSelect: (file: File) => void;
  preview?: string | null;
  label?: string;
  tips?: string[];
}

export default function PhotoUpload({
  onPhotoSelect,
  preview,
  label = 'Загрузить фото',
  tips,
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

  if (localPreview) {
    return (
      <div className="relative rounded-3xl overflow-hidden shadow-card">
        <img src={localPreview} alt="Preview" className="w-full aspect-[3/4] object-cover" />
        <button
          type="button"
          onClick={clear}
          className="absolute top-4 right-4 w-9 h-9 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
        className="w-full aspect-[3/4] rounded-3xl bg-gradient-to-br from-accent-coralLight via-white to-accent-violetLight
                   border-2 border-dashed border-accent-coral/40 flex flex-col items-center justify-center gap-4
                   active:scale-[0.99] transition-all shadow-card"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent-coral to-accent-violet shadow-float">
          <Camera size={32} className="text-white" strokeWidth={1.5} />
        </div>
        <span className="text-[15px] font-semibold text-app-text">{label}</span>
        <span className="text-[13px] text-accent-coralDark">Нажмите, чтобы сделать селфи</span>
      </button>

      <button
        type="button"
        onClick={() => {
          const input = inputRef.current;
          if (input) {
            input.removeAttribute('capture');
            input.click();
            input.setAttribute('capture', 'user');
          }
        }}
        className="btn-light flex items-center justify-center gap-2"
      >
        <Upload size={18} />
        Выбрать из галереи
      </button>
    </div>
  );
}
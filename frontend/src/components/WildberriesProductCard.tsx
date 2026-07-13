import { ExternalLink } from 'lucide-react';
import type { WildberriesProduct } from '@/data/wildberriesSkincare';
import { wildberriesProductUrl } from '@/data/wildberriesSkincare';
import { useTelegram } from '@/hooks/useTelegram';

type WildberriesProductCardProps = {
  product: WildberriesProduct;
  compact?: boolean;
};

export default function WildberriesProductCard({ product, compact = false }: WildberriesProductCardProps) {
  const { openLink } = useTelegram();

  return (
    <button
      type="button"
      onClick={() => openLink(wildberriesProductUrl(product.id))}
      className={`w-full text-left transition-colors active:bg-app-canvas ${
        compact ? 'px-4 py-3' : 'px-5 py-4'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold leading-snug">{product.name}</p>
          <p className="mt-1 text-[13px] text-app-muted">
            {product.brand} · от {product.priceRub.toLocaleString('ru-RU')} ₽
          </p>
          {!compact && (
            <p className="mt-1 text-[13px] leading-snug text-app-faint">{product.description}</p>
          )}
          <p className="mt-2 inline-flex rounded-full bg-app-track px-2.5 py-1 text-[11px] font-semibold text-app-muted">
            WB · {product.id}
          </p>
        </div>
        <ExternalLink size={16} className="mt-0.5 shrink-0 text-app-muted" />
      </div>
    </button>
  );
}
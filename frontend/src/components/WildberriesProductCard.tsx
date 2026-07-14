import { ExternalLink } from 'lucide-react';
import type { WildberriesProduct } from '@/data/wildberriesSkincare';
import { skincareProductUrl } from '@/data/wildberriesSkincare';
import { useTelegram } from '@/hooks/useTelegram';

type WildberriesProductCardProps = {
  product: WildberriesProduct;
  compact?: boolean;
  /** Preview teaser — show info but no WB link */
  previewOnly?: boolean;
};

function ProductDetails({
  product,
  compact,
  showLink,
}: {
  product: WildberriesProduct;
  compact: boolean;
  showLink: boolean;
}) {
  return (
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
          {product.store === 'ozon' ? 'OZON' : 'WB'} · {product.id}
        </p>
      </div>
      {showLink && <ExternalLink size={16} className="mt-0.5 shrink-0 text-app-muted" />}
    </div>
  );
}

export default function WildberriesProductCard({
  product,
  compact = false,
  previewOnly = false,
}: WildberriesProductCardProps) {
  const { openLink } = useTelegram();
  const className = `w-full text-left ${compact ? 'px-4 py-3' : 'px-5 py-4'}`;

  if (previewOnly) {
    return (
      <div className={className}>
        <ProductDetails product={product} compact={compact} showLink={false} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openLink(skincareProductUrl(product))}
      className={`${className} transition-colors active:bg-app-canvas`}
    >
      <ProductDetails product={product} compact={compact} showLink />
    </button>
  );
}
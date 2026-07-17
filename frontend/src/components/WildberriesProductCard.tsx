import { ExternalLink } from 'lucide-react';
import type { WildberriesProduct } from '@/data/wildberriesSkincare';
import { skincareProductUrl } from '@/data/wildberriesSkincare';
import { useTelegram } from '@/hooks/useTelegram';

type WildberriesProductCardProps = {
  product: WildberriesProduct;
  compact?: boolean;
  /** Preview teaser: show info but no WB link */
  previewOnly?: boolean;
  whenLabel?: string;
  howToUse?: string;
  whyFits?: string;
  stepLabel?: string;
};

function ProductDetails({
  product,
  compact,
  showLink,
  whenLabel,
  howToUse,
  whyFits,
  stepLabel,
}: {
  product: WildberriesProduct;
  compact: boolean;
  showLink: boolean;
  whenLabel?: string;
  howToUse?: string;
  whyFits?: string;
  stepLabel?: string;
}) {
  const when = whenLabel || product.whenToUse;
  const how = howToUse || product.howToUse;

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        {(stepLabel || when) && (
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {stepLabel && (
              <span className="rounded-full bg-brand-greenLight px-2 py-0.5 text-[10px] font-semibold text-brand-greenDark">
                {stepLabel}
              </span>
            )}
            {when && (
              <span className="rounded-full bg-app-track px-2 py-0.5 text-[10px] font-semibold text-app-muted">
                {when}
              </span>
            )}
          </div>
        )}
        <p className={`font-semibold leading-snug ${compact ? 'text-[14px]' : 'text-[15px]'}`}>
          {product.name}
        </p>
        <p className="mt-1 text-[13px] text-app-muted">
          {product.brand} · от {product.priceRub.toLocaleString('ru-RU')} ₽
        </p>
        {!compact && whyFits && (
          <p className="mt-1.5 text-[13px] leading-snug text-app-text">{whyFits}</p>
        )}
        {!compact && !whyFits && product.description && (
          <p className="mt-1 text-[13px] leading-snug text-app-faint">{product.description}</p>
        )}
        {how && (
          <p className={`leading-snug text-app-muted ${compact ? 'mt-1 text-[11px]' : 'mt-1.5 text-[12px]'}`}>
            <span className="font-semibold text-app-text">Как: </span>
            {how}
          </p>
        )}
        {!compact && (
          <p className="mt-2 inline-flex rounded-full bg-app-track px-2.5 py-1 text-[11px] font-semibold text-app-muted">
            {product.store === 'ozon' ? 'OZON' : 'WB'} · {product.id}
          </p>
        )}
      </div>
      {showLink && <ExternalLink size={16} className="mt-0.5 shrink-0 text-app-muted" />}
    </div>
  );
}

export default function WildberriesProductCard({
  product,
  compact = false,
  previewOnly = false,
  whenLabel,
  howToUse,
  whyFits,
  stepLabel,
}: WildberriesProductCardProps) {
  const { openLink } = useTelegram();
  const className = `w-full text-left ${compact ? 'px-4 py-3' : 'px-5 py-4'}`;

  if (previewOnly) {
    return (
      <div className={className}>
        <ProductDetails
          product={product}
          compact={compact}
          showLink={false}
          whenLabel={whenLabel}
          howToUse={howToUse}
          whyFits={whyFits}
          stepLabel={stepLabel}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openLink(skincareProductUrl(product))}
      className={`${className} transition-colors active:bg-app-canvas`}
    >
      <ProductDetails
        product={product}
        compact={compact}
        showLink
        whenLabel={whenLabel}
        howToUse={howToUse}
        whyFits={whyFits}
        stepLabel={stepLabel}
      />
    </button>
  );
}

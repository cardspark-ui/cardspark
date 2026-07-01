import { CardMetadataBadges, CardNumberBadge, ConditionBadge, RarityBadge, SetBadge } from "./badges";
import { CardImageTilt } from "./card-image-tilt";
import { DeltaValue } from "./delta-value";
import type { ReactNode } from "react";

type CardTone = "fire" | "electric" | "water" | "neutral";

export type CardTileProps = {
  name: string;
  set: string;
  setCode?: string;
  number: string;
  rarity: string;
  condition: string;
  price: string;
  delta: string;
  deltaPeriod?: string;
  imageUrl?: string;
  imageAlt?: string;
  tone?: CardTone;
};

export type CardGridProps = {
  children: ReactNode;
  columns?: 2 | 3 | 4;
};

const NON_HOLOGRAPHIC_CARD_RARITIES = new Set(["common", "uncommon"]);

export function CardGrid({ children, columns }: CardGridProps) {
  const className = columns ? `cs-card-grid cs-card-grid-${columns}` : "cs-card-grid";

  return <div className={className}>{children}</div>;
}

export function CardTile({
  name,
  set,
  setCode,
  number,
  rarity,
  condition,
  price,
  delta,
  deltaPeriod,
  imageUrl,
  imageAlt,
  tone = "neutral"
}: CardTileProps) {
  const hasHolographicImageEffects = !NON_HOLOGRAPHIC_CARD_RARITIES.has(normalizeRarity(rarity));

  return (
    <article className="cs-card-tile">
      <CardImageTilt
        src={imageUrl}
        alt={imageAlt ?? `${name} trading card`}
        fallbackLabel={name}
        className={`cs-card-art cs-card-art-${tone}`}
        showGlow={hasHolographicImageEffects}
        showSpecular={hasHolographicImageEffects}
      />
      <div className="cs-card-footer">
        <div className="cs-card-title-row">
          <h3>{name}</h3>
          <strong className="cs-card-price">{price}</strong>
        </div>
        <div className="cs-card-subtitle-row">
          <p>
            <CardMetadataBadges>
              <SetBadge set={set} code={setCode} />
              <CardNumberBadge number={number} />
              <RarityBadge rarity={rarity} />
              <span className="cs-card-tile-condition">(<ConditionBadge condition={condition} />)</span>
            </CardMetadataBadges>
          </p>
          <DeltaValue value={delta} className="cs-card-delta" referenceValue={price} periodLabel={deltaPeriod} />
        </div>
      </div>
    </article>
  );
}

function normalizeRarity(rarity: string) {
  return rarity.trim().replace(/[-_]+/g, " ").replace(/\s+/g, " ").toLowerCase();
}

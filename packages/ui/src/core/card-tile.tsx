import { CardArt } from "./card-art";
import { CardBadge, CardBadgeStack } from "./badges";
import { resolveCardPresentation } from "./card-format";
import { DeltaValue } from "./delta-value";
import type { ReactNode } from "react";
import type { CardPresentationBaseProps } from "./card-format";

type CardTone = "fire" | "electric" | "water" | "neutral";

export type CardTileProps = CardPresentationBaseProps & {
  tone?: CardTone;
};

export type CardGridProps = {
  children: ReactNode;
  columns?: 2 | 3 | 4;
};

export function CardGrid({ children, columns }: CardGridProps) {
  const className = columns ? `cs-card-grid cs-card-grid-${columns}` : "cs-card-grid";

  return <div className={className}>{children}</div>;
}

export function CardTile({
  format,
  card,
  name,
  set,
  setCode,
  number,
  rarity,
  condition,
  variant,
  value,
  price,
  delta,
  deltaPeriod,
  imageUrl,
  imageAlt,
  tone = "neutral"
}: CardTileProps) {
  const resolvedCard = resolveCardPresentation({
    format,
    card,
    name,
    set,
    setCode,
    number,
    rarity,
    condition,
    variant,
    value,
    price,
    delta,
    deltaPeriod,
    imageUrl,
    imageAlt
  });
  const badgeCard = {
    set: resolvedCard.set,
    setCode: resolvedCard.setCode,
    number: resolvedCard.number,
    rarity: resolvedCard.rarity,
    condition: resolvedCard.condition
  };

  return (
    <article className="cs-card-tile" data-format={resolvedCard.format}>
      <CardArt
        src={resolvedCard.imageUrl}
        alt={resolvedCard.imageAlt ?? `${resolvedCard.name} trading card`}
        fallbackLabel={resolvedCard.name}
        rarity={resolvedCard.rarity}
        className={`cs-card-art cs-card-art-${tone}`}
      />
      <div className="cs-card-footer">
        <div className="cs-card-title-row">
          <h3>{resolvedCard.name}</h3>
          {resolvedCard.value ? <strong className="cs-card-price">{resolvedCard.value}</strong> : null}
        </div>
        <div className="cs-card-subtitle-row">
          <p>
            <CardBadgeStack>
              <CardBadge type="set" card={badgeCard} />
              <CardBadge type="number" card={badgeCard} />
              <CardBadge type="rarity" card={badgeCard} />
              {resolvedCard.condition ? (
                <span className="cs-card-tile-condition">(<CardBadge type="condition" card={badgeCard} />)</span>
              ) : null}
            </CardBadgeStack>
          </p>
          {resolvedCard.delta ? (
            <DeltaValue
              value={resolvedCard.delta}
              className="cs-card-delta"
              referenceValue={resolvedCard.value}
              periodLabel={resolvedCard.deltaPeriod}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}

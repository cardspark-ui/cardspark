import { CardArt } from "./card-art";
import { CardBadge, CardBadgeStack } from "./badges";
import { resolveCardPresentation } from "./card-format";
import { DeltaValue } from "./delta-value";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from "react";
import type { CardPresentationBaseProps } from "./card-format";

type CardTone = "fire" | "electric" | "water" | "neutral";

export type CardTileProps = CardPresentationBaseProps &
  Omit<ComponentPropsWithoutRef<"article">, "aria-label" | "children" | "className" | "onClick"> & {
    tone?: CardTone;
    ariaLabel?: string;
    className?: string;
    onClick?: (event: MouseEvent<HTMLElement>) => void;
  };

export type CardGridProps = ComponentPropsWithoutRef<"div"> & {
  children: ReactNode;
  columns?: 2 | 3 | 4;
};

/** Responsive grid container for card tiles. */
export const CardGrid = forwardRef<HTMLDivElement, CardGridProps>(function CardGrid(
  { children, columns, className, ...props },
  ref
) {
  const classes = ["cs-card-grid", columns ? `cs-card-grid-${columns}` : null, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={classes} {...props}>
      {children}
    </div>
  );
});

/** Visual card tile accepting either canonical `card` data or direct presentation props. */
export const CardTile = forwardRef<HTMLElement, CardTileProps>(function CardTile({
  format,
  card,
  name,
  set,
  setCode,
  number,
  rarity,
  condition,
  finish,
  finishCode,
  variant,
  value,
  delta,
  deltaPeriod,
  imageUrl,
  imageAlt,
  tone = "neutral",
  ariaLabel,
  className,
  onClick,
  ...articleProps
}: CardTileProps, ref) {
  const resolvedCard = resolveCardPresentation({
    format,
    card,
    name,
    set,
    setCode,
    number,
    rarity,
    condition,
    finish,
    finishCode,
    variant,
    value,
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
    condition: resolvedCard.condition,
    finish: resolvedCard.finish,
    finishCode: resolvedCard.finishCode
  };

  return (
    <article
      ref={ref}
      {...articleProps}
      className={["cs-card-tile", className].filter(Boolean).join(" ")}
      data-format={resolvedCard.format}
      data-interactive={onClick ? "true" : undefined}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {onClick ? (
        <button
          className="cs-card-tile-interaction"
          type="button"
          aria-label={ariaLabel ?? `View ${resolvedCard.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onClick(event);
          }}
        />
      ) : null}
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
              {resolvedCard.finish ? <CardBadge type="foil" card={badgeCard} /> : null}
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
});

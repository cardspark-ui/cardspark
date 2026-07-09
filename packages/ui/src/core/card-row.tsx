import { CardBadge, CardBadgeStack } from "./badges";
import { CardArt } from "./card-art";
import { getCardFormatDetails, resolveCardPresentation } from "./card-format";
import { DeltaValue } from "./delta-value";
import { MetadataTooltip } from "./rarity";
import type { DeltaValueProps } from "./delta-value";
import type { CardPresentationBaseProps } from "./card-format";
import type { ComponentPropsWithoutRef, KeyboardEvent, ReactNode } from "react";

export type CardRowMetadataItem = {
  key: string;
  label: ReactNode;
  shortText?: ReactNode;
  fullText?: ReactNode;
  className?: string;
  visibility?: "always" | "compact";
  wrapInParentheses?: boolean;
  tooltip?: boolean;
};

export type CardRowProps = CardPresentationBaseProps & {
  nameContent?: ReactNode;
  imageRarity?: string;
  metadata?: CardRowMetadataItem[];
  deltaReferenceValue?: string;
  deltaSecondaryDisplay?: DeltaValueProps["secondaryDisplay"];
  chart?: ReactNode;
  details?: ReactNode;
  action?: ReactNode;
  active?: boolean;
  pricePosition?: "at-market" | "below-market" | "above-market";
  ariaLabel?: string;
  className?: string;
  imageClassName?: string;
  onClick?: () => void;
};

export type CardStackProps = ComponentPropsWithoutRef<"div"> & {
  children: ReactNode;
  className?: string;
};

export function CardStack({ children, className, ...props }: CardStackProps) {
  return (
    <div className={["cs-card-stack", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </div>
  );
}

export function CardRow({
  format,
  card,
  name,
  set,
  setCode,
  number,
  rarity,
  condition,
  variant,
  nameContent,
  imageUrl,
  imageAlt,
  imageRarity,
  metadata,
  value,
  price,
  delta,
  deltaReferenceValue,
  deltaSecondaryDisplay,
  deltaPeriod,
  dateAdded,
  costBasis,
  chart,
  details,
  action,
  active = false,
  pricePosition,
  ariaLabel,
  className,
  imageClassName,
  onClick
}: CardRowProps) {
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
    imageUrl,
    imageAlt,
    value,
    price,
    delta,
    deltaPeriod,
    dateAdded,
    costBasis
  });
  const resolvedMetadata =
    metadata ?? getTradingCardMetadata({
      set: resolvedCard.set,
      setCode: resolvedCard.setCode,
      number: resolvedCard.number,
      rarity: resolvedCard.rarity,
      condition: resolvedCard.condition,
      variant: resolvedCard.variant
    });
  const resolvedDetails = getCardFormatDetails(resolvedCard, { details });
  const classes = [
    "cs-card-row",
    resolvedCard.imageUrl ? "cs-card-row-with-thumbnail" : null,
    action ? "cs-card-row-with-action" : null,
    className
  ]
    .filter(Boolean)
    .join(" ");
  const hasTrailing = Boolean(resolvedCard.value || resolvedCard.delta || chart || action);
  const isInteractive = Boolean(onClick);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!onClick || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }

    event.preventDefault();
    onClick();
  }

  return (
    <article
      className={classes}
      data-active={active ? "true" : undefined}
      data-format={resolvedCard.format}
      data-interactive={isInteractive ? "true" : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={ariaLabel}
      onClick={onClick ? () => onClick() : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
    >
      {resolvedCard.imageUrl ? (
        <CardArt
          src={resolvedCard.imageUrl}
          alt={resolvedCard.imageAlt ?? `${resolvedCard.name} trading card`}
          fallbackLabel={resolvedCard.name}
          rarity={imageRarity ?? resolvedCard.rarity}
          className={["cs-card-row-thumbnail", imageClassName].filter(Boolean).join(" ")}
          tiltMultiplier={4.5}
        />
      ) : null}
      <div className="cs-card-row-copy">
        <h3>{nameContent ?? resolvedCard.name}</h3>
        {resolvedDetails ? <div className="cs-card-row-details">{renderCardRowDetails(resolvedDetails)}</div> : null}
        {resolvedMetadata.length ? <CardRowMetadata items={resolvedMetadata} /> : null}
      </div>
      {hasTrailing ? (
        <div className="cs-card-row-trailing" data-price-position={pricePosition}>
          {resolvedCard.value ? <strong>{resolvedCard.value}</strong> : null}
          {resolvedCard.delta || chart ? (
            <div className="cs-card-row-trend">
              {chart}
              {resolvedCard.delta ? (
                <DeltaValue
                  value={resolvedCard.delta}
                  referenceValue={deltaReferenceValue ?? resolvedCard.value}
                  secondaryDisplay={deltaSecondaryDisplay}
                  periodLabel={resolvedCard.deltaPeriod}
                />
              ) : null}
            </div>
          ) : null}
          {action ? <div className="cs-card-row-action">{action}</div> : null}
        </div>
      ) : null}
    </article>
  );
}

function renderCardRowDetails(details: ReactNode) {
  if (typeof details !== "string" || !details.includes(" • ")) {
    return details;
  }

  const parts = details.split(" • ");
  const renderedDetails: ReactNode[] = [];

  parts.forEach((part, index) => {
    if (index > 0) {
      renderedDetails.push(<span className="cs-card-row-detail-separator" aria-hidden="true" key={`separator-${index}`} />);
    }

    renderedDetails.push(part);
  });

  return renderedDetails;
}

function CardRowMetadata({ items }: { items: CardRowMetadataItem[] }) {
  const renderedItems: ReactNode[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const nextItem = items[index + 1];

    if (item.key === "set" && nextItem?.key === "number") {
      renderedItems.push(
        <span className="cs-card-row-meta-group" data-group="set-number" key={`${item.key}-${nextItem.key}`}>
          {renderCardRowMetadataItem(item)}
          {renderCardRowMetadataItem(nextItem)}
        </span>
      );
      index += 1;
      continue;
    }

    if (item.key === "rarity") {
      if (renderedItems.length > 0) {
        renderedItems.push(renderCardRowMetadataSeparator(`${item.key}-before`));
      }

      renderedItems.push(renderCardRowMetadataItem(item));

      if (nextItem) {
        renderedItems.push(renderCardRowMetadataSeparator(`${item.key}-after`));
      }

      continue;
    }

    renderedItems.push(renderCardRowMetadataItem(item));
  }

  return <CardBadgeStack className="cs-card-row-meta">{renderedItems}</CardBadgeStack>;
}

function renderCardRowMetadataSeparator(key: string) {
  return <span className="cs-card-row-meta-separator" aria-hidden="true" key={`separator-${key}`} />;
}

function renderCardRowMetadataItem(item: CardRowMetadataItem) {
  return (
    <span className="cs-card-row-meta-item" key={item.key}>
      <MetadataTooltip
        label={item.label}
        className={item.className}
        disabled={item.tooltip === false}
        visibility={item.visibility}
      >
        <span className="cs-card-row-meta-short">
          {renderCardRowMetadataValue(item.shortText ?? item.fullText ?? item.label, item.wrapInParentheses)}
        </span>
        <span className="cs-card-row-meta-full">
          {renderCardRowMetadataValue(item.fullText ?? item.shortText ?? item.label, item.wrapInParentheses)}
        </span>
      </MetadataTooltip>
    </span>
  );
}

function renderCardRowMetadataValue(value: ReactNode, wrapInParentheses?: boolean) {
  return wrapInParentheses ? (
    <>
      <span aria-hidden="true">(</span>
      {value}
      <span aria-hidden="true">)</span>
    </>
  ) : (
    value
  );
}

export function getTradingCardMetadata({
  set,
  setCode,
  number,
  rarity,
  condition,
  variant
}: {
  set?: string;
  setCode?: string;
  number?: string;
  rarity?: string;
  condition?: string;
  variant?: string;
}): CardRowMetadataItem[] {
  const metadataItems: Array<CardRowMetadataItem | null> = [
    set
      ? {
          key: "set",
          label: <CardBadge type="set" card={{ set, setCode }} display="full" tooltip={false} />,
          shortText: <CardBadge type="set" card={{ set, setCode }} />,
          fullText: <CardBadge type="set" card={{ set, setCode }} display="full" />,
          className: "cs-set-name",
          visibility: "compact",
          tooltip: false
        }
      : null,
    number
      ? {
          key: "number",
          label: <CardBadge type="number" card={{ number }} display="full" tooltip={false} />,
          shortText: <CardBadge type="number" card={{ number }} />,
          fullText: <CardBadge type="number" card={{ number }} />,
          visibility: "compact",
          tooltip: false
        }
      : null,
    rarity
      ? {
          key: "rarity",
          label: <CardBadge type="rarity" card={{ rarity }} display="mark-label" tooltip={false} />,
          shortText: <CardBadge type="rarity" card={{ rarity }} />,
          fullText: <CardBadge type="rarity" card={{ rarity }} display="mark-code" />,
          tooltip: false
        }
      : null,
    condition
      ? {
          key: "condition",
          label: <CardBadge type="condition" card={{ condition }} display="label" tooltip={false} />,
          shortText: <CardBadge type="condition" card={{ condition }} />,
          fullText: <CardBadge type="condition" card={{ condition }} />,
          visibility: "compact",
          tooltip: false
        }
      : null,
    variant
      ? {
          key: "variant",
          label: <CardBadge type="foil" card={{ finish: variant }} display="full" tooltip={false} />,
          shortText: <CardBadge type="foil" card={{ finish: variant, finishCode: getVariantBadgeCode(variant) }} />,
          fullText: <CardBadge type="foil" card={{ finish: variant }} display="full" />,
          visibility: "compact",
          tooltip: false
        }
      : null
  ];

  return metadataItems.filter((item): item is CardRowMetadataItem => item !== null);
}

function getVariantBadgeCode(variant: string) {
  const normalizedVariant = variant.trim().toLowerCase();
  const knownVariantCodes: Record<string, string> = {
    graded: "GRD",
    holo: "HOLO",
    holofoil: "HOLO",
    normal: "NORM",
    raw: "RAW",
    reverse: "REV",
    "reverse holo": "REV",
    "reverse holofoil": "REV"
  };

  return knownVariantCodes[normalizedVariant] ?? variant;
}

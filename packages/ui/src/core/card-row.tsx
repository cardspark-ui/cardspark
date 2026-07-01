import { CardNumberBadge, ConditionBadge, FoilBadge, RarityBadge, SetBadge } from "./badges";
import { CardImageTilt } from "./card-image-tilt";
import { DeltaValue } from "./delta-value";
import { MetadataTooltip } from "./rarity";
import type { DeltaValueProps } from "./delta-value";
import type { KeyboardEvent, ReactNode } from "react";

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

export type CardRowProps = {
  name: string;
  nameContent?: ReactNode;
  imageUrl?: string;
  imageAlt?: string;
  metadata?: CardRowMetadataItem[];
  value?: string;
  delta?: string;
  deltaReferenceValue?: string;
  deltaSecondaryDisplay?: DeltaValueProps["secondaryDisplay"];
  deltaPeriod?: string;
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

export function CardRow({
  name,
  nameContent,
  imageUrl,
  imageAlt,
  metadata = [],
  value,
  delta,
  deltaReferenceValue,
  deltaSecondaryDisplay,
  deltaPeriod,
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
  const classes = [
    "cs-card-row",
    imageUrl ? "cs-card-row-with-thumbnail" : null,
    action ? "cs-card-row-with-action" : null,
    className
  ]
    .filter(Boolean)
    .join(" ");
  const hasTrailing = Boolean(value || delta || chart || action);
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
      data-interactive={isInteractive ? "true" : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={ariaLabel}
      onClick={onClick ? () => onClick() : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
    >
      {imageUrl ? (
        <CardImageTilt
          src={imageUrl}
          alt={imageAlt ?? `${name} trading card`}
          fallbackLabel={name}
          className={["cs-card-row-thumbnail", imageClassName].filter(Boolean).join(" ")}
          tiltMultiplier={4.5}
        />
      ) : null}
      <div className="cs-card-row-copy">
        <h3>{nameContent ?? name}</h3>
        {details ? <div className="cs-card-row-details">{renderCardRowDetails(details)}</div> : null}
        {metadata.length ? <CardRowMetadata items={metadata} /> : null}
      </div>
      {hasTrailing ? (
        <div className="cs-card-row-trailing" data-price-position={pricePosition}>
          {value ? <strong>{value}</strong> : null}
          {delta || chart ? (
            <div className="cs-card-row-trend">
              {chart}
              {delta ? (
                <DeltaValue
                  value={delta}
                  referenceValue={deltaReferenceValue ?? value}
                  secondaryDisplay={deltaSecondaryDisplay}
                  periodLabel={deltaPeriod}
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

  return <p className="cs-card-row-meta">{renderedItems}</p>;
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
          label: <SetBadge set={set} code={setCode} display="full" tooltip={false} />,
          shortText: <SetBadge set={set} code={setCode} />,
          fullText: <SetBadge set={set} code={setCode} display="full" />,
          className: "cs-set-name",
          visibility: "compact",
          tooltip: false
        }
      : null,
    number
      ? {
          key: "number",
          label: <CardNumberBadge number={number} display="full" tooltip={false} />,
          shortText: <CardNumberBadge number={number} />,
          fullText: <CardNumberBadge number={number} />,
          visibility: "compact",
          tooltip: false
        }
      : null,
    rarity
      ? {
          key: "rarity",
          label: <RarityBadge rarity={rarity} display="mark-label" tooltip={false} />,
          shortText: <RarityBadge rarity={rarity} />,
          fullText: <RarityBadge rarity={rarity} display="mark-code" />,
          tooltip: false
        }
      : null,
    condition
      ? {
          key: "condition",
          label: <ConditionBadge condition={condition} display="label" tooltip={false} />,
          shortText: <ConditionBadge condition={condition} />,
          fullText: <ConditionBadge condition={condition} />,
          visibility: "compact",
          tooltip: false
        }
      : null,
    variant
      ? {
          key: "variant",
          label: <FoilBadge finish={variant} display="full" tooltip={false} />,
          shortText: <FoilBadge finish={variant} code={getVariantBadgeCode(variant)} />,
          fullText: <FoilBadge finish={variant} display="full" />,
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

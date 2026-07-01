"use client";

import { CollectionCardRow } from "../collecting/collection-card-row";
import {
  CardMetadataBadges,
  CardNumberBadge,
  formatLanguageLabel,
  LanguageBadge,
  RarityBadge,
  SetBadge
} from "../core/badges";
import { applyCardImageTilt, CardImageTilt, resetCardImageTilt } from "../core/card-image-tilt";
import { formatConditionLabel } from "../core/condition";
import { DeltaValue } from "../core/delta-value";
import { FilterBar } from "../core/filter-bar";
import { formatCurrency, formatDeltaFromReference, parseCurrencyLabel } from "../core/money";
import { MetadataTooltip } from "../core/rarity";
import { getMarketHistoryGraderValues, getNumericGradeValue, isUngradedGrader } from "../market/history-selection";
import { MarketSparkline } from "../market/sparkline";
import { CollectionValueContent } from "../market/value-panel-content";
import type { CSSProperties, MouseEvent, PointerEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FilterBarItem, FilterOption } from "../core/filter-bar";
import type { MarketHistoryDataSet, MarketHistoryDimension } from "../market/history-selection";
import type { CollectionValueRangeData } from "../market/value-panel-content";
import type { TcgVariant } from "../core/rarity";

const CARD_DETAIL_SPIN_DURATION_MS = 900;
const CARD_DETAIL_ACTION_DONE_DURATION_MS = 900;
const CARD_DETAIL_BUTTON_TILT_MULTIPLIER = 0.55;

export type CardFact = {
  label: string;
  value: ReactNode;
};

export type CardResourceType =
  | "Grass"
  | "Fire"
  | "Water"
  | "Lightning"
  | "Psychic"
  | "Fighting"
  | "Darkness"
  | "Metal"
  | "Fairy"
  | "Dragon"
  | "Colorless";

export type CardDetailCollectionItem = {
  name: string;
  set: string;
  setCode?: string;
  number?: string;
  rarity?: string;
  condition?: string;
  dateAdded?: string;
  costBasis?: string;
  value: string;
  delta?: string;
  imageUrl?: string;
  imageAlt?: string;
};

export type CardDetailHistoryDataSet = MarketHistoryDataSet;

export type CardDetailViewProps = {
  card: {
    name: string;
    set: string;
    setCode?: string;
    number: string;
    rarity: string;
    language?: string;
    imageUrl?: string;
    imageAlt?: string;
    hp?: string;
    type?: string;
    stage?: string;
  };
  facts: CardFact[];
  variants: string[];
  activeVariant: string;
  conditions?: string[];
  activeCondition?: string;
  dataSources: string[];
  activeDataSource: string;
  graders: string[];
  activeGrader: string;
  collection: {
    status: string;
    ownedLabel: string;
    costBasis: string;
    actionLabel: string;
    items?: CardDetailCollectionItem[];
  };
  market: {
    label: string;
    price: string;
    deltaToday: string;
    deltaWeek: string;
    freshness: string;
    condition: string;
    source: string;
  };
  history: {
    values: number[];
    baselineValue?: number;
    range: string;
    ranges: string[];
    volume?: number[];
    highLabel: string;
    lowLabel: string;
    hoverLabels?: string[];
    chartRangeData?: Partial<Record<string, CollectionValueRangeData>>;
    dataSets?: CardDetailHistoryDataSet[];
    emptyLabel?: string;
  };
  onVariantChange?: (variant: string) => void;
  onRangeChange?: (range: string) => void;
};

export type CardMediaPanelProps = {
  media: ReactNode;
  collection?: CardDetailViewProps["collection"];
  market?: ReactNode | null;
  isCollectionActionDone?: boolean;
  isCollectionActionPending?: boolean;
};

export type CardInfoPanelProps = {
  header: ReactNode;
  controls?: ReactNode;
  collection?: ReactNode;
  facts?: ReactNode;
};

type DetailDimension = MarketHistoryDimension;
type DetailDimensionValues = Record<string, string[]>;

const UNGRADED_GRADER = "Ungraded";
const PSA_GRADES = [
  "10",
  "9",
  "8.5",
  "8",
  "7.5",
  "7",
  "6.5",
  "6",
  "5.5",
  "5",
  "4.5",
  "4",
  "3.5",
  "3",
  "2.5",
  "2",
  "1.5",
  "1"
];
const CGC_GRADES = [
  "Pristine 10",
  "10",
  "9.5",
  "9",
  "8.5",
  "8",
  "7.5",
  "7",
  "6.5",
  "6",
  "5.5",
  "5",
  "4.5",
  "4",
  "3.5",
  "3",
  "2.5",
  "2",
  "1.5",
  "1"
];
const BGS_GRADES = [
  "Black Label 10",
  "Pristine 10",
  "9.5",
  "9",
  "8.5",
  "8",
  "7.5",
  "7",
  "6.5",
  "6",
  "5.5",
  "5",
  "4.5",
  "4",
  "3.5",
  "3",
  "2.5",
  "2",
  "1.5",
  "1"
];
const GRADER_GRADE_OPTIONS: Record<string, string[]> = {
  BGS: BGS_GRADES,
  CGC: CGC_GRADES,
  PSA: PSA_GRADES
};
function getUniqueOptions(options: string[]) {
  return Array.from(new Set(options));
}

function getGraderName(grader: string) {
  if (grader === UNGRADED_GRADER) return grader;

  const knownGrader = Object.keys(GRADER_GRADE_OPTIONS).find((graderName) => {
    const normalizedGrader = grader.toUpperCase();

    return normalizedGrader === graderName || normalizedGrader.startsWith(`${graderName} `);
  });

  if (knownGrader) return knownGrader;

  return grader.replace(/\s+\d+(?:\.\d+)?$/, "");
}

function getGraderGrade(grader: string) {
  const graderName = getGraderName(grader);

  if (graderName !== grader && grader.toUpperCase().startsWith(`${graderName} `)) {
    return grader.slice(graderName.length).trim();
  }

  return grader.match(/\s+(\d+(?:\.\d+)?)$/)?.[1];
}

function getGraderOptions(graders: string[]) {
  return getUniqueOptions(graders.map((grader) => getGraderName(grader)));
}

function getStandardGradeOptionsForGrader(grader: string) {
  return GRADER_GRADE_OPTIONS[grader.toUpperCase()] ?? [];
}

function isPlainNumericGrade(grade: string) {
  return /^\d+(?:\.\d+)?$/.test(grade);
}

function getDimensionDisplayText(dimensionLabel: string, option: string, variant: "compact" | "menu") {
  if (dimensionLabel !== "Condition") {
    return option;
  }

  return formatConditionLabel(option, variant === "compact" ? "code" : "code-label");
}

function getDetailDimensionId(dimensionLabel: string) {
  return dimensionLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function getDetailDimensionLabelFromId(dimensions: DetailDimension[], id: string) {
  return dimensions.find((dimension) => getDetailDimensionId(dimension.label) === id)?.label;
}

function createDetailDimensionOption(dimensionLabel: string, option: string): string | FilterOption {
  if (dimensionLabel !== "Condition") {
    return option;
  }

  return {
    value: option,
    label: getDimensionDisplayText(dimensionLabel, option, "menu"),
    compactLabel: getDimensionDisplayText(dimensionLabel, option, "compact")
  };
}

function createDetailFilterItems(dimensions: DetailDimension[], selectedOptions: Record<string, string>, selectedValues: DetailDimensionValues) {
  return dimensions.map((dimension) => {
    const selectedOption = selectedOptions[dimension.label] ?? dimension.activeOption;
    const values = selectedValues[dimension.label] ?? [selectedOption];

    return {
      id: getDetailDimensionId(dimension.label),
      label: dimension.label,
      value: selectedOption,
      values,
      options: dimension.options.map((option) => createDetailDimensionOption(dimension.label, option)),
      compact: dimension.label === "Condition"
    } satisfies FilterBarItem;
  });
}

function getSingleSelectionFromValues(values: string[], fallback: string) {
  return values[0] ?? fallback;
}

function getInitialDetailDimensionValues(dimensions: DetailDimension[] | undefined) {
  return Object.fromEntries(dimensions?.map((dimension) => [dimension.label, [dimension.activeOption]]) ?? []);
}

function getGradeOptionsForGrader(
  grader: string,
  dimensions: DetailDimension[] | undefined,
  dataSets: CardDetailHistoryDataSet[] | undefined
) {
  const graderDimension = dimensions?.find((dimension) => dimension.label === "Grader");
  const graderOptions = graderDimension?.options ?? [];
  const standardGradeOptions = getStandardGradeOptionsForGrader(grader);
  const dataGradeOptions = [
    ...graderOptions
      .filter((option) => getGraderName(option) === grader)
      .map((option) => getGraderGrade(option))
      .filter((grade): grade is string => Boolean(grade)),
    ...(dataSets ?? [])
      .filter((dataSet) => getGraderName(dataSet.dimensions.Grader) === grader)
      .map((dataSet) => getGraderGrade(dataSet.dimensions.Grader))
      .filter((grade): grade is string => Boolean(grade))
  ];

  if (standardGradeOptions.length) {
    return getUniqueOptions([
      ...standardGradeOptions,
      ...dataGradeOptions.filter((grade) => {
        if (!isPlainNumericGrade(grade)) return true;

        return !standardGradeOptions.some((standardGrade) => getNumericGradeValue(standardGrade) === grade);
      })
    ]);
  }

  return getUniqueOptions(dataGradeOptions).sort(
    (a, b) => Number(getNumericGradeValue(b)) - Number(getNumericGradeValue(a))
  );
}

function getConditionOptionsForGrader(
  grader: string | undefined,
  rawConditionOptions: string[],
  dimensions: DetailDimension[] | undefined,
  dataSets: CardDetailHistoryDataSet[] | undefined
) {
  if (isUngradedGrader(grader)) {
    return rawConditionOptions;
  }

  return getGradeOptionsForGrader(grader ?? UNGRADED_GRADER, dimensions, dataSets);
}

export function CardDetailView({
  card,
  facts,
  variants,
  activeVariant,
  conditions,
  activeCondition,
  dataSources,
  activeDataSource,
  graders,
  activeGrader,
  collection,
  market,
  history,
  onVariantChange,
  onRangeChange
}: CardDetailViewProps) {
  const normalizedGraders = getGraderOptions(graders);
  const activeGraderName = getGraderName(activeGrader);
  const activeGraderGrade = getGraderGrade(activeGrader);

  return (
    <CardDetailLayout
      media={
        <CardImage
          src={card.imageUrl}
          alt={card.imageAlt ?? `${card.name} trading card`}
          fallbackLabel={card.name}
        />
      }
      header={<CardDetailHeader card={card} />}
      facts={<CardFacts facts={facts} />}
      collectionItems={collection.items}
      controls={
        <PriceHistoryPanel
          {...history}
          label={market.label}
          price={market.price}
          deltaToday={market.deltaToday}
          dimensions={[
            { label: "Source", options: dataSources, activeOption: activeDataSource },
            { label: "Grader", options: normalizedGraders, activeOption: activeGraderName },
            { label: "Condition", options: conditions ?? variants, activeOption: activeGraderGrade ?? activeCondition ?? activeVariant },
            { label: "Variant", options: variants, activeOption: activeVariant }
          ]}
          onDimensionChange={(label, value) => {
            if (label === "Condition" || label === "Variant") {
              onVariantChange?.(value);
            }
          }}
          onRangeChange={onRangeChange}
        />
      }
      collection={collection}
      market={null}
      history={null}
    />
  );
}

export function CardDetailLayout({
  media,
  header,
  facts,
  collectionItems,
  controls,
  collection,
  market,
  history,
}: {
  media: ReactNode;
  header: ReactNode;
  facts: ReactNode;
  collectionItems?: CardDetailCollectionItem[];
  controls: ReactNode;
  collection: CardDetailViewProps["collection"];
  market: ReactNode | null;
  history: ReactNode | null;
}) {
  const [isCardSpinning, setIsCardSpinning] = useState(false);
  const [isCollectionActionDone, setIsCollectionActionDone] = useState(false);
  const spinLockedRef = useRef(false);
  const spinTimeoutRef = useRef<number | null>(null);
  const actionDoneTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current !== null) {
        window.clearTimeout(spinTimeoutRef.current);
      }

      if (actionDoneTimeoutRef.current !== null) {
        window.clearTimeout(actionDoneTimeoutRef.current);
      }
    };
  }, []);

  function triggerCardSpin() {
    if (spinLockedRef.current) {
      return;
    }

    if (spinTimeoutRef.current !== null) {
      window.clearTimeout(spinTimeoutRef.current);
    }

    if (actionDoneTimeoutRef.current !== null) {
      window.clearTimeout(actionDoneTimeoutRef.current);
      actionDoneTimeoutRef.current = null;
    }

    spinLockedRef.current = true;
    setIsCollectionActionDone(false);
    setIsCardSpinning(true);
    spinTimeoutRef.current = window.setTimeout(() => {
      setIsCardSpinning(false);
      spinTimeoutRef.current = null;
      setIsCollectionActionDone(true);

      actionDoneTimeoutRef.current = window.setTimeout(() => {
        setIsCollectionActionDone(false);
        spinLockedRef.current = false;
        actionDoneTimeoutRef.current = null;
      }, CARD_DETAIL_ACTION_DONE_DURATION_MS);
    }, CARD_DETAIL_SPIN_DURATION_MS);
  }

  function getCollectionActionButton(root: HTMLElement, target: EventTarget | null) {
    if (!(target instanceof Element)) {
      return null;
    }

    const actionButton = target.closest(".cs-collection-action-panel .cs-detail-primary-action");

    if (!actionButton || !root.contains(actionButton)) {
      return null;
    }

    return actionButton;
  }

  function getDetailCardImage(root: HTMLElement) {
    return root.querySelector<HTMLElement>(".cs-detail-card-image");
  }

  function handleCardDetailClick(event: MouseEvent<HTMLElement>) {
    const actionButton = getCollectionActionButton(event.currentTarget, event.target);

    if (!actionButton) {
      return;
    }

    triggerCardSpin();
  }

  function handleCardDetailPointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") {
      return;
    }

    const actionButton = getCollectionActionButton(event.currentTarget, event.target);

    if (!actionButton) {
      return;
    }

    const cardImage = getDetailCardImage(event.currentTarget);

    if (!cardImage) {
      return;
    }

    applyCardImageTilt(cardImage, event.clientX, event.clientY, {
      clampToBounds: true,
      tiltMultiplier: CARD_DETAIL_BUTTON_TILT_MULTIPLIER
    });
  }

  function handleCardDetailPointerOut(event: PointerEvent<HTMLElement>) {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const actionButton = getCollectionActionButton(event.currentTarget, target);

    if (!actionButton) {
      return;
    }

    const relatedTarget = event.relatedTarget;

    if (relatedTarget instanceof Node && actionButton.contains(relatedTarget)) {
      return;
    }

    const cardImage = getDetailCardImage(event.currentTarget);

    if (cardImage) {
      resetCardImageTilt(cardImage);
    }
  }

  return (
    <article
      className="cs-card-detail"
      data-card-spinning={isCardSpinning ? "true" : "false"}
      data-has-history={history ? "true" : "false"}
      onClick={handleCardDetailClick}
      onPointerMove={handleCardDetailPointerMove}
      onPointerOut={handleCardDetailPointerOut}
    >
      <CardMediaPanel
        media={media}
        collection={collection}
        market={market}
        isCollectionActionDone={isCollectionActionDone}
        isCollectionActionPending={isCardSpinning}
      />
      <CardInfoPanel
        header={header}
        controls={controls}
        collection={collectionItems?.length ? <CardCollectionPanel items={collectionItems} /> : null}
        facts={facts}
      />
      {history ? <div className="cs-card-detail-history">{history}</div> : null}
    </article>
  );
}

export function CardMediaPanel({
  media,
  collection,
  market,
  isCollectionActionDone = false,
  isCollectionActionPending = false
}: CardMediaPanelProps) {
  return (
    <div className="cs-card-detail-media">
      <div className="cs-card-detail-media-stack">
        {media}
        {collection ? (
          <CollectionStatusPanel
            {...collection}
            isDone={isCollectionActionDone}
            isPending={isCollectionActionPending}
          />
        ) : null}
        {market}
      </div>
    </div>
  );
}

export function CardInfoPanel({ header, controls, collection, facts }: CardInfoPanelProps) {
  return (
    <div className="cs-card-detail-main">
      {header}
      {controls ? <div className="cs-card-detail-control-stack">{controls}</div> : null}
      {collection}
      {facts}
    </div>
  );
}

export function CardImage({
  src,
  alt,
  fallbackLabel
}: {
  src?: string;
  alt: string;
  fallbackLabel: string;
}) {
  return (
    <CardImageTilt
      src={src}
      alt={alt}
      fallbackLabel={fallbackLabel}
      className="cs-detail-card-image"
      showBackFace
    />
  );
}

export function CardDetailHeader({
  card
}: {
  card: CardDetailViewProps["card"];
}) {
  const metadataLabel = getCardDetailMetadataLabel(card);

  return (
    <header className="cs-card-detail-header">
      <div className="cs-card-detail-kicker">
        <p aria-label={metadataLabel}>
          <CardMetadataBadges className="cs-card-detail-meta-full">
            <SetBadge set={card.set} code={card.setCode} display="full" />
            <CardNumberBadge number={card.number} display="full" tooltip={false} />
            <span className="cs-card-detail-meta-separator" aria-hidden="true" />
            <RarityBadge rarity={card.rarity} display="mark-label" tooltip={false} />
            <span className="cs-card-detail-meta-separator" aria-hidden="true" />
            <LanguageBadge language={card.language} display="label" />
          </CardMetadataBadges>
          <CardMetadataBadges className="cs-card-detail-meta-short">
            <SetBadge set={card.set} code={card.setCode} />
            <CardNumberBadge number={card.number} />
            <span className="cs-card-detail-meta-separator" aria-hidden="true" />
            <RarityBadge rarity={card.rarity} display="mark-code" />
            <span className="cs-card-detail-meta-separator" aria-hidden="true" />
            <LanguageBadge language={card.language} />
          </CardMetadataBadges>
        </p>
      </div>
      <div className="cs-card-detail-title-row">
        <div>
          <h2>{card.name}</h2>
        </div>
      </div>
    </header>
  );
}

function getCardDetailMetadataLabel(card: CardDetailViewProps["card"]) {
  return `${card.set} #${card.number} ${card.rarity} ${formatLanguageLabel(card.language)}`;
}

const FACT_LABELS_RENDERED_IN_HEADER = new Set(["card number", "rarity"]);
const CARD_FACT_SECTION_START_LABELS = new Set(["card text"]);
const CARD_FACT_DISPLAY_LABELS: Record<string, string> = {
  "card text": "Rules"
};

export function CardFacts({ facts }: { facts: CardFact[] }) {
  const visibleFacts = facts.filter((fact) => !FACT_LABELS_RENDERED_IN_HEADER.has(normalizeFactLabel(fact.label)));

  return (
    <section className="cs-card-facts-panel cs-card-facts-detail" aria-label="Details">
      <h3>Details</h3>
      <dl className="cs-card-facts" aria-label="Card facts">
        {visibleFacts.map((fact) => {
          const normalizedLabel = normalizeFactLabel(fact.label);

          return (
            <div
              className="cs-card-fact"
              data-section-start={CARD_FACT_SECTION_START_LABELS.has(normalizedLabel) ? "true" : undefined}
              key={fact.label}
            >
              <dt>{CARD_FACT_DISPLAY_LABELS[normalizedLabel] ?? fact.label}</dt>
              <dd>{renderCardFactValue(fact, normalizedLabel)}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

export function CardCollectionPanel({ items }: { items: CardDetailCollectionItem[] }) {
  return (
    <section className="cs-card-facts-panel cs-card-facts-detail cs-collection-panel" aria-label="Your collection">
      <h3>Your collection</h3>
      <ul className="cs-card-facts cs-collection-list" aria-label="Your collection cards">
        {items.map((item) => {
          const delta = getCollectionItemDelta(item);

          return (
            <li className="cs-collection-card-list-item" key={`${item.name}-${item.condition}-${item.value}`}>
              <CollectionCardRow
                name={item.name}
                set={item.set}
                setCode={item.setCode}
                number={item.number}
                rarity={item.rarity}
                condition={item.condition ?? item.name}
                dateAdded={item.dateAdded}
                costBasis={item.costBasis}
                value={item.value}
                delta={delta}
                imageUrl={item.imageUrl}
                imageAlt={item.imageAlt}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function getCollectionItemDelta(item: CardDetailCollectionItem) {
  if (!item.costBasis) {
    return item.delta;
  }

  const value = parseCurrencyLabel(item.value);
  const costBasis = parseCurrencyLabel(item.costBasis);

  if (value === undefined || costBasis === undefined) {
    return item.delta;
  }

  const difference = value - costBasis;
  const sign = difference >= 0 ? "+" : "-";
  const percentage = costBasis === 0 ? 0 : (difference / costBasis) * 100;

  return `${sign}${Math.abs(percentage).toFixed(1)}% (${formatCurrency(Math.abs(difference))})`;
}

function renderCardFactValue(fact: CardFact, normalizedLabel: string) {
  if (normalizedLabel === "card text" && typeof fact.value === "string") {
    return <NumberedCardRules value={fact.value} />;
  }

  if (normalizedLabel !== "type" || typeof fact.value !== "string") {
    return fact.value;
  }

  const resourceType = getKnownResourceType(fact.value);

  if (!resourceType) {
    return fact.value;
  }

  return (
    <CardTypeBadge type={fact.value} />
  );
}

function NumberedCardRules({ value }: { value: string }) {
  const rules = splitCardRules(value);

  if (rules.length <= 1) {
    return value;
  }

  return (
    <ol className="cs-card-rule-list">
      {rules.map((rule, index) => (
        <li key={`${rule}-${index}`}>{rule}</li>
      ))}
    </ol>
  );
}

function splitCardRules(value: string) {
  return value
    .split(/(?<=\.)\s+(?=[A-Z0-9])/)
    .map((rule) => rule.trim())
    .filter(Boolean);
}

function normalizeFactLabel(label: string) {
  return label.trim().replace(/\s+/g, " ").toLowerCase();
}

const ENERGY_CODE_LABELS: Record<string, CardResourceType> = {
  C: "Colorless",
  D: "Darkness",
  F: "Fighting",
  G: "Grass",
  L: "Lightning",
  M: "Metal",
  N: "Dragon",
  P: "Psychic",
  R: "Fire",
  W: "Water",
  Y: "Fairy"
};

const POKEMON_ENERGY_TYPES: CardResourceType[] = [
  "Grass",
  "Fire",
  "Water",
  "Lightning",
  "Psychic",
  "Fighting",
  "Darkness",
  "Metal",
  "Fairy",
  "Dragon",
  "Colorless"
];

const ENERGY_ASSET_URLS: Record<CardResourceType, string> = {
  Colorless: new URL("../assets/pokemon/energy/colorless.png", import.meta.url).toString(),
  Darkness: new URL("../assets/pokemon/energy/darkness.png", import.meta.url).toString(),
  Dragon: new URL("../assets/pokemon/energy/dragon.png", import.meta.url).toString(),
  Fairy: new URL("../assets/pokemon/energy/fairy.png", import.meta.url).toString(),
  Fighting: new URL("../assets/pokemon/energy/fighting.png", import.meta.url).toString(),
  Fire: new URL("../assets/pokemon/energy/fire.png", import.meta.url).toString(),
  Grass: new URL("../assets/pokemon/energy/grass.png", import.meta.url).toString(),
  Lightning: new URL("../assets/pokemon/energy/lightning.png", import.meta.url).toString(),
  Metal: new URL("../assets/pokemon/energy/metal.png", import.meta.url).toString(),
  Psychic: new URL("../assets/pokemon/energy/psychic.png", import.meta.url).toString(),
  Water: new URL("../assets/pokemon/energy/water.png", import.meta.url).toString()
};

export type CardCostProps = {
  cost: Array<CardResourceType | string>;
  label?: string;
  variant?: TcgVariant;
};

export type CardAttackTextProps = {
  cost: Array<CardResourceType | string>;
  name: string;
  damage?: string;
  effect?: string;
  variant?: TcgVariant;
};

export type CardWeaknessProps = {
  resourceType: CardResourceType | string;
  value: string;
  variant?: TcgVariant;
};

export type CardTypeBadgeProps = {
  type: CardResourceType | string;
  display?: "mark" | "label" | "mark-label";
  className?: string;
  variant?: TcgVariant;
};

export function CardCost({
  cost,
  label,
  variant = "pokemon"
}: CardCostProps) {
  const resourceTypes = cost.map((resource) => normalizeResourceType(resource, variant));

  return (
    <span className="cs-energy-cost" role="img" aria-label={label ?? getResourceCostLabel(resourceTypes)}>
      {resourceTypes.map((resourceType, index) => (
        <CardResourceIcon
          decorative
          resourceType={resourceType}
          variant={variant}
          key={`${resourceType}-${index}`}
        />
      ))}
    </span>
  );
}

export function CardAttackText({
  cost,
  name,
  damage,
  effect,
  variant = "pokemon"
}: CardAttackTextProps) {
  return (
    <span className="cs-attack-text">
      <span className="cs-attack-text-header">
        <span className="cs-attack-text-title">
          <CardCost
            cost={cost}
            label={`${name} cost: ${getResourceCostLabel(cost.map((resource) => normalizeResourceType(resource, variant)))}`}
            variant={variant}
          />
          <strong>{name}</strong>
        </span>
        {damage ? <span className="cs-attack-text-damage">{damage}</span> : null}
      </span>
      {effect ? <span className="cs-attack-text-effect">{effect}</span> : null}
    </span>
  );
}

export function CardWeakness({ resourceType, value, variant = "pokemon" }: CardWeaknessProps) {
  const normalizedResourceType = normalizeResourceType(resourceType, variant);

  return (
    <span className="cs-energy-line">
      <CardResourceIcon resourceType={normalizedResourceType} variant={variant} />
      <span className="cs-energy-line-text">{value}</span>
    </span>
  );
}

export function CardTypeBadge({
  type,
  display = "mark-label",
  className,
  variant = "pokemon"
}: CardTypeBadgeProps) {
  const resourceType = normalizeResourceType(type, variant);
  const classes = ["cs-metadata-badge", "cs-card-type-badge", "cs-energy-line", className].filter(Boolean).join(" ");
  const showLabel = display !== "mark";

  return (
    <span className={classes} aria-label={display === "mark" ? `${type} type` : undefined}>
      {display === "label" ? null : (
        <CardResourceIcon decorative resourceType={resourceType} tooltip={!showLabel} variant={variant} />
      )}
      {showLabel ? <span className="cs-energy-line-text">{type}</span> : null}
    </span>
  );
}

function CardResourceIcon({
  decorative = false,
  resourceType,
  tooltip = true,
  variant = "pokemon"
}: {
  decorative?: boolean;
  resourceType: CardResourceType;
  tooltip?: boolean;
  variant?: TcgVariant;
}) {
  const assetUrl = getResourceAssetUrl(resourceType, variant);

  return (
    <MetadataTooltip
      label={
        <span className="cs-energy-tooltip-label">
          <img alt="" aria-hidden="true" className="cs-energy-tooltip-icon" src={assetUrl} />
          <span>{resourceType}</span>
        </span>
      }
      className="cs-energy-tooltip-trigger"
      disabled={!tooltip}
    >
      <img
        alt={decorative ? "" : `${resourceType} resource`}
        aria-hidden={decorative ? "true" : undefined}
        className="cs-energy-icon"
        data-energy={resourceType.toLowerCase()}
        src={assetUrl}
      />
    </MetadataTooltip>
  );
}

function getResourceAssetUrl(resourceType: CardResourceType, variant: TcgVariant) {
  if (variant === "pokemon") {
    return ENERGY_ASSET_URLS[resourceType];
  }

  return ENERGY_ASSET_URLS.Colorless;
}

function getKnownResourceType(resource: CardResourceType | string, variant: TcgVariant = "pokemon"): CardResourceType | null {
  const normalized = resource.trim().toLowerCase();
  const codeLabel = variant === "pokemon" ? ENERGY_CODE_LABELS[resource.trim().toUpperCase()] : null;

  if (codeLabel) return codeLabel;

  const knownType = POKEMON_ENERGY_TYPES.find((type) => type.toLowerCase() === normalized);

  return knownType ?? null;
}

function normalizeResourceType(resource: CardResourceType | string, variant: TcgVariant = "pokemon"): CardResourceType {
  return getKnownResourceType(resource, variant) ?? "Colorless";
}

function getResourceCostLabel(resourceTypes: CardResourceType[]) {
  const counts = resourceTypes.reduce<Record<string, number>>((accumulator, resourceType) => {
    accumulator[resourceType] = (accumulator[resourceType] ?? 0) + 1;

    return accumulator;
  }, {});
  const parts = Object.entries(counts).map(([resourceType, count]) => `${count} ${resourceType}`);

  return `${parts.join(", ")} resource`;
}

export function DetailDimensionControls({
  dimensions,
  selectedOptions,
  selectedValues,
  onOptionChange,
  onOptionMultiChange,
  multiSelect = false,
  ariaLabel = "Data dimensions"
}: {
  dimensions: DetailDimension[];
  selectedOptions: Record<string, string>;
  selectedValues?: DetailDimensionValues;
  onOptionChange: (label: string, value: string) => void;
  onOptionMultiChange?: (label: string, values: string[]) => void;
  multiSelect?: boolean;
  ariaLabel?: string;
}) {
  if (multiSelect) {
    return (
      <FilterBar
        ariaLabel={ariaLabel}
        className="cs-detail-dimensions"
        filters={createDetailFilterItems(dimensions, selectedOptions, selectedValues ?? {})}
        onFilterChange={(id, value) => {
          const label = getDetailDimensionLabelFromId(dimensions, id);

          if (label) {
            onOptionChange(label, value);
          }
        }}
        onFilterMultiChange={(id, values) => {
          const label = getDetailDimensionLabelFromId(dimensions, id);

          if (label) {
            onOptionMultiChange?.(label, values);
          }
        }}
        multiSelect
      />
    );
  }

  return (
    <section className="cs-detail-dimensions" aria-label={ariaLabel}>
      <div className="cs-detail-dimensions-row">
        {dimensions.map((dimension) => {
          const controlId = `cs-detail-${dimension.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
          const selectedOption = selectedOptions[dimension.label] ?? dimension.activeOption;
          const hasCompactValue = dimension.label === "Condition";
          const selectedDisplayText = getDimensionDisplayText(
            dimension.label,
            selectedOption,
            hasCompactValue ? "compact" : "menu"
          );

          return (
            <label className="cs-detail-dimension" htmlFor={controlId} key={dimension.label}>
              <span
                className="cs-detail-dimension-select"
                data-compact-value={hasCompactValue ? "true" : undefined}
                style={
                  {
                    "--cs-detail-dimension-value-length": selectedDisplayText.length
                  } as CSSProperties
                }
              >
                <select
                  id={controlId}
                  name={controlId}
                  value={selectedOption}
                  aria-label={dimension.label}
                  onChange={(event) => {
                    onOptionChange(dimension.label, event.target.value);
                  }}
                >
                  {dimension.options.map((option) => (
                    <option key={option} value={option}>
                      {getDimensionDisplayText(dimension.label, option, "menu")}
                    </option>
                  ))}
                </select>
                {hasCompactValue ? (
                  <span className="cs-detail-dimension-value" aria-hidden="true">
                    {selectedDisplayText}
                  </span>
                ) : null}
                <span className="cs-detail-dimension-caret" aria-hidden="true">▼</span>
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}

export function CollectionStatusPanel({
  actionLabel,
  isDone = false,
  isPending = false
}: CardDetailViewProps["collection"] & {
  isDone?: boolean;
  isPending?: boolean;
}) {
  const actionStatus = isPending ? "pending" : isDone ? "done" : "idle";

  return (
    <section className="cs-detail-panel cs-collection-action-panel">
      <button
        className="cs-detail-primary-action"
        type="button"
        aria-label={isDone ? "Done" : undefined}
        aria-busy={isPending ? "true" : undefined}
        data-status={actionStatus}
        disabled={isPending}
      >
        <span className="cs-detail-primary-action-copy">
          {isPending ? "ADDING..." : actionLabel}
        </span>
        <span className="cs-detail-primary-action-done" aria-hidden="true">
          <span aria-hidden="true">✓</span>
          done
        </span>
      </button>
    </section>
  );
}

export function CardMarketPanel({
  label,
  price,
  deltaToday,
  deltaWeek,
  freshness,
  condition,
  source
}: CardDetailViewProps["market"]) {
  return (
    <section className="cs-detail-panel cs-market-panel">
      <div className="cs-detail-panel-heading">
        <h3>{label}</h3>
        <span>{freshness}</span>
      </div>
      <strong className="cs-market-panel-price">{price}</strong>
      <div className="cs-market-panel-deltas">
        <span>
          <DeltaValue value={deltaToday} referenceValue={price} periodLabel="Today" />
        </span>
        <span>
          <DeltaValue value={deltaWeek} referenceValue={price} periodLabel="Week" />
        </span>
      </div>
      <div className="cs-market-panel-controls">
        <button type="button">{condition}</button>
        <button type="button">{source}</button>
      </div>
    </section>
  );
}

function resolveDetailMarketHistoryDataSet({
  dataSets,
  dimensions,
  selectedOptions,
  selectedValues
}: {
  dataSets?: CardDetailHistoryDataSet[];
  dimensions?: DetailDimension[];
  selectedOptions: Record<string, string>;
  selectedValues: DetailDimensionValues;
}) {
  return dataSets?.find((dataSet) =>
    dimensions?.every((dimension) => {
      const dataSetDimensionValue = dataSet.dimensions[dimension.label];

      if (typeof dataSetDimensionValue === "undefined") {
        return true;
      }

      const dimensionValues = selectedValues[dimension.label] ?? [selectedOptions[dimension.label]];

      if (dimension.label === "Condition" && !isUngradedGrader(selectedOptions.Grader, UNGRADED_GRADER)) {
        return true;
      }

      if (dimension.label === "Grader") {
        const conditionValues = selectedValues.Condition ?? [selectedOptions.Condition];
        const graderValues = conditionValues.flatMap((condition) =>
          getMarketHistoryGraderValues(selectedOptions.Grader, condition, UNGRADED_GRADER)
        );

        return graderValues.includes(dataSetDimensionValue);
      }

      return dimensionValues.includes(dataSetDimensionValue);
    })
  );
}

export function PriceHistoryPanel({
  values,
  baselineValue,
  range,
  ranges,
  volume = [],
  highLabel,
  lowLabel,
  hoverLabels: providedHoverLabels,
  chartRangeData,
  dataSets,
  emptyLabel,
  label,
  price,
  deltaToday,
  dimensions,
  onDimensionChange,
  onRangeChange
}: CardDetailViewProps["history"] & Pick<CardDetailViewProps["market"], "label" | "price" | "deltaToday"> & {
  dimensions?: DetailDimension[];
  onDimensionChange?: (label: string, value: string) => void;
  onRangeChange?: (range: string) => void;
}) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(dimensions?.map((dimension) => [dimension.label, dimension.activeOption]) ?? [])
  );
  const [selectedOptionValues, setSelectedOptionValues] = useState<DetailDimensionValues>(() =>
    getInitialDetailDimensionValues(dimensions)
  );
  const rawConditionOptions = dimensions?.find((dimension) => dimension.label === "Condition")?.options ?? [];
  const dynamicDimensions = useMemo(() => {
    return dimensions?.map((dimension) => {
      if (dimension.label !== "Condition") {
        return dimension;
      }

      const options = getConditionOptionsForGrader(selectedOptions.Grader, rawConditionOptions, dimensions, dataSets);

      return {
        ...dimension,
        options,
        activeOption: options.includes(selectedOptions.Condition) ? selectedOptions.Condition : options[0] ?? dimension.activeOption
      };
    });
  }, [dataSets, dimensions, rawConditionOptions, selectedOptions.Condition, selectedOptions.Grader]);

  useEffect(() => {
    const conditionDimension = dynamicDimensions?.find((dimension) => dimension.label === "Condition");

    if (!conditionDimension?.options.length || conditionDimension.options.includes(selectedOptions.Condition)) {
      return;
    }

    setSelectedOptions((currentOptions) => ({
      ...currentOptions,
      Condition: conditionDimension.options[0]
    }));
    setSelectedOptionValues((currentValues) => ({
      ...currentValues,
      Condition: [conditionDimension.options[0]]
    }));
  }, [dynamicDimensions, selectedOptions.Condition]);

  const selectedDataSet = useMemo(
    () => resolveDetailMarketHistoryDataSet({ dataSets, dimensions, selectedOptions, selectedValues: selectedOptionValues }),
    [dataSets, dimensions, selectedOptions, selectedOptionValues]
  );
  const selectedValues = selectedDataSet?.values ?? (dataSets ? [] : values);
  const selectedVolume = selectedDataSet?.volume ?? (dataSets ? [] : volume);
  const selectedBaselineValue = selectedDataSet?.baselineValue ?? baselineValue;
  const selectedRange = selectedDataSet?.range ?? range;
  const selectedRanges = selectedDataSet?.ranges ?? ranges;
  const selectedHighLabel = selectedDataSet?.highLabel ?? highLabel;
  const selectedLowLabel = selectedDataSet?.lowLabel ?? lowLabel;
  const selectedChartRangeData = selectedDataSet?.chartRangeData ?? chartRangeData;
  const selectedEmptyLabel = selectedDataSet?.emptyLabel ?? emptyLabel ?? "No sales data for this selection";
  const referenceValue = selectedBaselineValue ?? selectedValues[0] ?? 0;
  const valueSeries = selectedValues.map((value) => formatCurrency(value));
  const deltaSeries = selectedValues.map((value) => formatDeltaFromReference(value, referenceValue));
  const hoverLabels = selectedDataSet?.hoverLabels ?? providedHoverLabels ?? selectedValues.map((_, index) => `${selectedRange} point ${index + 1}`);
  const minValue = parseCurrencyLabel(selectedLowLabel);
  const maxValue = parseCurrencyLabel(selectedHighLabel);
  const pointXPositions = getVolumeAlignedPointXPositions(selectedValues.length);
  const chartKey =
    dimensions
      ?.map((dimension) => `${dimension.label}:${(selectedOptionValues[dimension.label] ?? [selectedOptions[dimension.label]]).join(",")}`)
      .join("|") ?? "default";

  function handleOptionChange(label: string, value: string) {
    onDimensionChange?.(label, value);

    setSelectedOptions((currentOptions) => {
      if (label !== "Grader") {
        return {
          ...currentOptions,
          [label]: value
        };
      }

      const conditionOptions = getConditionOptionsForGrader(value, rawConditionOptions, dimensions, dataSets);
      const nextCondition = conditionOptions.includes(currentOptions.Condition)
        ? currentOptions.Condition
        : conditionOptions[0] ?? currentOptions.Condition;

      return {
        ...currentOptions,
        Grader: value,
        Condition: nextCondition
      };
    });
    setSelectedOptionValues((currentValues) => {
      if (label !== "Grader") {
        return {
          ...currentValues,
          [label]: [value]
        };
      }

      const conditionOptions = getConditionOptionsForGrader(value, rawConditionOptions, dimensions, dataSets);
      const currentCondition = selectedOptions.Condition;
      const nextCondition = conditionOptions.includes(currentCondition)
        ? currentCondition
        : conditionOptions[0] ?? currentCondition;

      return {
        ...currentValues,
        Grader: [value],
        Condition: [nextCondition]
      };
    });
  }

  function handleOptionMultiChange(label: string, values: string[]) {
    const fallback = selectedOptions[label] ?? dimensions?.find((dimension) => dimension.label === label)?.activeOption ?? values[0];
    const nextValue = getSingleSelectionFromValues(values, fallback);

    onDimensionChange?.(label, nextValue);

    setSelectedOptions((currentOptions) => ({
      ...currentOptions,
      [label]: nextValue
    }));
    setSelectedOptionValues((currentValues) => ({
      ...currentValues,
      [label]: values
    }));
  }

  return (
    <section className="cs-price-history-panel">
      <header className="cs-price-history-panel-heading">
        <h3>Market Price</h3>
        {dimensions ? (
          <DetailDimensionControls
            dimensions={dynamicDimensions ?? dimensions}
            selectedOptions={selectedOptions}
            selectedValues={selectedOptionValues}
            onOptionChange={handleOptionChange}
            onOptionMultiChange={handleOptionMultiChange}
            multiSelect
          />
        ) : null}
      </header>
      <article className="cs-price-history-panel-body cs-value-panel">
        <CollectionValueContent
          key={chartKey}
          title={label}
          value={selectedDataSet?.price ?? price}
          delta={selectedDataSet?.deltaToday ?? deltaToday}
          deltaPeriod="Today"
          values={selectedValues}
          valueSeries={valueSeries}
          deltaSeries={deltaSeries}
          hoverLabels={hoverLabels}
          previousCloseValue={selectedBaselineValue}
          minValue={minValue}
          maxValue={maxValue}
          pointXPositions={pointXPositions}
          chartRangeData={selectedChartRangeData}
          ranges={selectedRanges}
          activeRange={selectedRange}
          onRangeChange={onRangeChange}
          emptyLabel={selectedEmptyLabel}
          hideSummaryTitle
          renderChart={({ values: renderedValues = [], previousCloseValue, minValue: renderedMinValue, maxValue: renderedMaxValue, pointXPositions: renderedPointXPositions, rangeData }) => {
            const renderedVolume = rangeData?.volume ?? selectedVolume;

            return (
              <PriceHistoryChart
                values={renderedValues}
                baselineValue={previousCloseValue}
                volume={renderedVolume}
                minValue={renderedMinValue}
                maxValue={renderedMaxValue}
                pointXPositions={renderedPointXPositions}
              />
            );
          }}
        >
          <PriceHistoryChart
            values={selectedValues}
            baselineValue={selectedBaselineValue}
            volume={selectedVolume}
            minValue={minValue}
            maxValue={maxValue}
            pointXPositions={pointXPositions}
          />
        </CollectionValueContent>
      </article>
    </section>
  );
}

function PriceHistoryChart({
  values,
  baselineValue,
  volume,
  minValue,
  maxValue,
  pointXPositions
}: {
  values: number[];
  baselineValue?: number;
  volume: number[];
  minValue?: number;
  maxValue?: number;
  pointXPositions?: number[];
}) {
  const maxVolume = Math.max(...volume, 1);

  return (
    <div className="cs-price-history-chart">
      <div className="cs-price-history-volume" aria-hidden="true">
        {volume.map((item, index) => {
          return (
            <span
              key={`${item}-${index}`}
              style={{
                height: `${Math.max(8, (item / maxVolume) * 100)}%`
              } as CSSProperties}
            />
          );
        })}
      </div>
      <MarketSparkline values={values} baselineValue={baselineValue} minValue={minValue} maxValue={maxValue} xPositions={pointXPositions} />
    </div>
  );
}

function getVolumeAlignedPointXPositions(count: number) {
  if (count <= 0) {
    return undefined;
  }

  if (count === 1) {
    return [0.5];
  }

  return Array.from({ length: count }, (_, index) => {
    if (index === 0) return 0;
    if (index === count - 1) return 1;
    return (index + 0.5) / count;
  });
}

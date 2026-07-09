"use client";

import { CollectionCardRow } from "../collecting/collection-card-row";
import {
  CardBadge,
  CardBadgeStack,
  formatLanguageLabel,
} from "../core/badges";
import { applyCardImageTilt, CardArt, resetCardImageTilt } from "../core/card-art";
import { formatConditionLabel } from "../core/condition";
import { DeltaValue } from "../core/delta-value";
import { FilterBar } from "../core/filter-bar";
import { formatCurrency, formatDeltaFromReference, parseCurrencyLabel } from "../core/money";
import { getMarketHistoryGraderValues, getNumericGradeValue, isUngradedGrader } from "../market/history-selection";
import { MarketSparkline } from "../market/sparkline";
import { CollectionValueContent } from "../market/value-panel-content";
import type { CSSProperties, MouseEvent, PointerEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FilterBarItem, FilterOption } from "../core/filter-bar";
import type { MarketHistoryDataSet, MarketHistoryDimension } from "../market/history-selection";
import type { CollectionValueRangeData } from "../market/value-panel-content";

const CARD_DETAIL_SPIN_DURATION_MS = 900;
const CARD_DETAIL_ACTION_DONE_DURATION_MS = 900;
const CARD_DETAIL_BUTTON_TILT_MULTIPLIER = 0.55;

type CardDetailFact = {
  label: string;
  value: ReactNode;
};

type CardDetailOwnedItem = {
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

type CardDetailHistoryDataSet = MarketHistoryDataSet;

export type CardDetailProps = {
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
  facts: CardDetailFact[];
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
    items?: CardDetailOwnedItem[];
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

type DetailMediaColumnProps = {
  media: ReactNode;
  collection?: CardDetailProps["collection"];
  market?: ReactNode | null;
  isCollectionActionDone?: boolean;
  isCollectionActionPending?: boolean;
};

type DetailInfoColumnProps = {
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

export function CardDetail({
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
}: CardDetailProps) {
  const normalizedGraders = getGraderOptions(graders);
  const activeGraderName = getGraderName(activeGrader);
  const activeGraderGrade = getGraderGrade(activeGrader);

  return (
    <DetailFrame
      media={
        <CardArt
          src={card.imageUrl}
          alt={card.imageAlt ?? `${card.name} trading card`}
          fallbackLabel={card.name}
          rarity={card.rarity}
          className="cs-detail-card-image"
          showBackFace
        />
      }
      header={<DetailHeader card={card} />}
      facts={<DetailFacts facts={facts} />}
      ownedItems={collection.items}
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

function DetailFrame({
  media,
  header,
  facts,
  ownedItems,
  controls,
  collection,
  market,
  history,
}: {
  media: ReactNode;
  header: ReactNode;
  facts: ReactNode;
  ownedItems?: CardDetailOwnedItem[];
  controls: ReactNode;
  collection: CardDetailProps["collection"];
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
      <div className="cs-card-detail-layout">
        <DetailMediaColumn
          media={media}
          collection={collection}
          market={market}
          isCollectionActionDone={isCollectionActionDone}
          isCollectionActionPending={isCardSpinning}
        />
        <DetailInfoColumn
          header={header}
          controls={controls}
          collection={ownedItems?.length ? <DetailCollectionList items={ownedItems} /> : null}
          facts={facts}
        />
        {history ? <div className="cs-card-detail-history">{history}</div> : null}
      </div>
    </article>
  );
}

function DetailMediaColumn({
  media,
  collection,
  market,
  isCollectionActionDone = false,
  isCollectionActionPending = false
}: DetailMediaColumnProps) {
  return (
    <div className="cs-card-detail-media">
      <div className="cs-card-detail-media-stack">
        {media}
        {collection ? (
          <CollectionActionPanel
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

function DetailInfoColumn({ header, controls, collection, facts }: DetailInfoColumnProps) {
  return (
    <div className="cs-card-detail-main">
      {header}
      {controls ? <div className="cs-card-detail-control-stack">{controls}</div> : null}
      {collection}
      {facts}
    </div>
  );
}

function DetailHeader({
  card
}: {
  card: CardDetailProps["card"];
}) {
  const metadataLabel = getCardDetailMetadataLabel(card);

  return (
    <header className="cs-card-detail-header">
      <div className="cs-card-detail-kicker">
        <p aria-label={metadataLabel}>
          <CardBadgeStack className="cs-card-detail-meta-full">
            <CardBadge type="set" card={card} display="full" />
            <CardBadge type="number" card={card} display="full" tooltip={false} />
            <span className="cs-card-detail-meta-separator" aria-hidden="true" />
            <CardBadge type="rarity" card={card} display="mark-label" tooltip={false} />
            <span className="cs-card-detail-meta-separator" aria-hidden="true" />
            <CardBadge type="language" card={card} display="label" />
          </CardBadgeStack>
          <CardBadgeStack className="cs-card-detail-meta-short">
            <CardBadge type="set" card={card} />
            <CardBadge type="number" card={card} />
            <span className="cs-card-detail-meta-separator" aria-hidden="true" />
            <CardBadge type="rarity" card={card} display="mark-code" />
            <span className="cs-card-detail-meta-separator" aria-hidden="true" />
            <CardBadge type="language" card={card} />
          </CardBadgeStack>
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

function getCardDetailMetadataLabel(card: CardDetailProps["card"]) {
  return `${card.set} #${card.number} ${card.rarity} ${formatLanguageLabel(card.language)}`;
}

const FACT_LABELS_RENDERED_IN_HEADER = new Set(["card number", "rarity"]);
const CARD_FACT_SECTION_START_LABELS = new Set(["card text"]);
const CARD_FACT_DISPLAY_LABELS: Record<string, string> = {
  "card text": "Rules"
};

function DetailFacts({ facts }: { facts: CardDetailFact[] }) {
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

function DetailCollectionList({ items }: { items: CardDetailOwnedItem[] }) {
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

function getCollectionItemDelta(item: CardDetailOwnedItem) {
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

function renderCardFactValue(fact: CardDetailFact, normalizedLabel: string) {
  if (normalizedLabel === "card text" && typeof fact.value === "string") {
    return <NumberedCardRules value={fact.value} />;
  }

  if (normalizedLabel !== "type" || typeof fact.value !== "string") {
    return fact.value;
  }

  return <CardBadge type="type" value={fact.value} />;
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

function DetailDimensionControls({
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

function CollectionActionPanel({
  actionLabel,
  isDone = false,
  isPending = false
}: CardDetailProps["collection"] & {
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

function PriceHistoryPanel({
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
}: CardDetailProps["history"] & Pick<CardDetailProps["market"], "label" | "price" | "deltaToday"> & {
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

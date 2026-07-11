"use client";

import { CollectionCardRow } from "../collecting/collection-card-row";
import { CardBadge, CardBadgeStack, formatLanguageLabel } from "../core/badges";
import { applyCardImageTilt, CardArt, resetCardImageTilt } from "../core/card-art";
import { formatCurrency, parseCurrencyLabel } from "../core/money";
import { getGraderName, getGraderOptions } from "../market/grading";
import { forwardRef, useEffect, useRef, useState } from "react";
import type {
  ComponentPropsWithoutRef,
  ForwardedRef,
  MouseEvent,
  PointerEvent,
  ReactNode
} from "react";
import { DetailFacts } from "./card-detail-facts";
import type { CardDetailFact } from "./card-detail-facts";
import { PriceHistoryPanel } from "./card-detail-price-history";
import type { CardDetailHistory, CardDetailMarketSummary } from "./card-detail-price-history";
import type { CardId, TradingCardData } from "../core/card-format";
import type { MarketHistoryDimension } from "../market/history-selection";

const CARD_DETAIL_SPIN_DURATION_MS = 900;
const CARD_DETAIL_ACTION_DONE_DURATION_MS = 900;
const CARD_DETAIL_BUTTON_TILT_MULTIPLIER = 0.55;

export type CardDetailOwnedItem = {
  id: CardId;
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

export type CardDetailCard = TradingCardData & Required<Pick<TradingCardData, "set" | "number" | "rarity">>;

export type CardDetailCollection = {
  actionLabel: string;
  items?: CardDetailOwnedItem[];
};

export type CardDetailProps = Omit<ComponentPropsWithoutRef<"article">, "children"> & {
  card: CardDetailCard;
  facts?: CardDetailFact[];
  variants?: string[];
  activeVariant?: string;
  conditions?: string[];
  activeCondition?: string;
  grades?: string[];
  activeGrade?: string;
  dataSources?: string[];
  activeDataSource?: string;
  graders?: string[];
  activeGrader?: string;
  collection?: CardDetailCollection;
  market?: CardDetailMarketSummary;
  history?: CardDetailHistory;
  onCollectionAction?: (event: MouseEvent<HTMLElement>) => void;
  onConditionChange?: (condition: string) => void;
  onGradeChange?: (grade: string) => void;
  onDataSourceChange?: (dataSource: string) => void;
  onGraderChange?: (grader: string) => void;
  onVariantChange?: (variant: string) => void;
  onRangeChange?: (range: string) => void;
};

type DetailMediaColumnProps = {
  media: ReactNode;
  collection?: CardDetailProps["collection"];
  isCollectionActionDone?: boolean;
  isCollectionActionPending?: boolean;
};

type DetailInfoColumnProps = {
  header: ReactNode;
  controls?: ReactNode;
  collection?: ReactNode;
  facts?: ReactNode;
};

/** Composed card-detail surface; collection and market-history sections are independently optional. */
export const CardDetail = forwardRef<HTMLElement, CardDetailProps>(function CardDetail({
  className,
  card,
  facts = [],
  variants = [],
  activeVariant,
  conditions = [],
  activeCondition,
  grades = [],
  activeGrade,
  dataSources = [],
  activeDataSource,
  graders = [],
  activeGrader,
  collection,
  market,
  history,
  onCollectionAction,
  onConditionChange,
  onGradeChange,
  onDataSourceChange,
  onGraderChange,
  onVariantChange,
  onRangeChange,
  ...articleProps
}: CardDetailProps, ref) {
  const normalizedGraders = getGraderOptions(graders);
  const activeGraderName = activeGrader
    ? getGraderName(activeGrader)
    : normalizedGraders[0] ?? "Ungraded";
  const dimensions: MarketHistoryDimension[] = [];

  if (dataSources.length) {
    dimensions.push({ label: "Source", options: dataSources, activeOption: activeDataSource ?? dataSources[0] });
  }
  if (normalizedGraders.length) {
    dimensions.push({ label: "Grader", options: normalizedGraders, activeOption: activeGraderName });
    dimensions.push({ label: "Grade", options: grades, activeOption: activeGrade ?? "" });
  }
  if (conditions.length) {
    dimensions.push({ label: "Condition", options: conditions, activeOption: activeCondition ?? conditions[0] });
  }
  if (variants.length) {
    dimensions.push({ label: "Variant", options: variants, activeOption: activeVariant ?? variants[0] });
  }

  return (
    <DetailFrame
      className={className}
      articleProps={articleProps}
      forwardedRef={ref}
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
      facts={facts.length ? <DetailFacts facts={facts} /> : null}
      ownedItems={collection?.items}
      controls={
        market && history ? (
          <PriceHistoryPanel
            {...history}
            {...market}
            dimensions={dimensions}
            onDimensionChange={(label, value) => {
              if (label === "Source") onDataSourceChange?.(value);
              if (label === "Grader") onGraderChange?.(value);
              if (label === "Condition") onConditionChange?.(value);
              if (label === "Grade") onGradeChange?.(value);
              if (label === "Variant") onVariantChange?.(value);
            }}
            onRangeChange={onRangeChange}
          />
        ) : null
      }
      collection={collection}
      onCollectionAction={onCollectionAction}
    />
  );
});

function DetailFrame({
  className,
  articleProps,
  forwardedRef,
  media,
  header,
  facts,
  ownedItems,
  controls,
  collection,
  onCollectionAction,
}: {
  className?: string;
  articleProps: Omit<ComponentPropsWithoutRef<"article">, "children" | "className">;
  forwardedRef: ForwardedRef<HTMLElement>;
  media: ReactNode;
  header: ReactNode;
  facts?: ReactNode;
  ownedItems?: CardDetailOwnedItem[];
  controls?: ReactNode;
  collection?: CardDetailProps["collection"];
  onCollectionAction?: CardDetailProps["onCollectionAction"];
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
    onCollectionAction?.(event);
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
      {...articleProps}
      ref={forwardedRef}
      className={["cs-card-detail", className].filter(Boolean).join(" ")}
      data-card-spinning={isCardSpinning ? "true" : "false"}
      onClick={handleCardDetailClick}
      onPointerMove={handleCardDetailPointerMove}
      onPointerOut={handleCardDetailPointerOut}
    >
      <div className="cs-card-detail-layout">
        <DetailMediaColumn
          media={media}
          collection={collection}
          isCollectionActionDone={isCollectionActionDone}
          isCollectionActionPending={isCardSpinning}
        />
        <DetailInfoColumn
          header={header}
          controls={controls}
          collection={ownedItems?.length ? <DetailCollectionList items={ownedItems} /> : null}
          facts={facts}
        />
      </div>
    </article>
  );
}

function DetailMediaColumn({
  media,
  collection,
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

function DetailCollectionList({ items }: { items: CardDetailOwnedItem[] }) {
  return (
    <section className="cs-card-facts-panel cs-card-facts-detail cs-collection-panel" aria-label="Your collection">
      <h3>Your collection</h3>
      <ul className="cs-card-facts cs-collection-list" aria-label="Your collection cards">
        {items.map((item) => {
          const delta = getCollectionItemDelta(item);

          return (
            <li className="cs-collection-card-list-item" key={item.id}>
              <CollectionCardRow
                name={item.name}
                set={item.set}
                setCode={item.setCode}
                number={item.number}
                rarity={item.rarity}
                condition={item.condition}
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

function CollectionActionPanel({
  actionLabel,
  isDone = false,
  isPending = false
}: NonNullable<CardDetailProps["collection"]> & {
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

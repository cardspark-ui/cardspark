"use client";

import { CardArt } from "../core/card-art";
import { DeltaValue } from "../core/delta-value";
import { RarityMark } from "../core/rarity";
import { useAdaptivePreviewCount } from "./adaptive-preview-count";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, CSSProperties, MouseEventHandler } from "react";
import type { CardId } from "../core/card-format";

export type SetSummaryBreakdownItem = {
  label: string;
  owned: number;
  total: number;
};

export type SetSummaryPreviewCard = {
  id: CardId;
  name: string;
  value?: string;
  price?: string;
  delta?: string;
  imageUrl?: string;
  imageAlt?: string;
  rarity?: string;
  owned?: boolean;
};

export type SetSummaryChaseCard = SetSummaryPreviewCard;

export type SetSummaryMode = "standard" | "master";
export type SetSummaryStatus = "ready" | "loading" | "error" | "empty";

export type SetSummaryProps = Omit<ComponentPropsWithoutRef<"article">, "children" | "onClick"> & {
  name: string;
  code?: string;
  game?: string;
  series?: string;
  releaseDate?: string;
  mode?: SetSummaryMode;
  status?: SetSummaryStatus;
  owned: number;
  total: number;
  masterOwned?: number;
  masterTotal?: number;
  missingLabel?: string;
  missingCards?: SetSummaryPreviewCard[];
  chaseCards?: SetSummaryChaseCard[];
  collectedCards?: SetSummaryPreviewCard[];
  importingCards?: SetSummaryPreviewCard[];
  importingCardsLoadedCount?: number;
  importingLabel?: string;
  breakdown?: SetSummaryBreakdownItem[];
  loadingLabel?: string;
  errorLabel?: string;
  emptyLabel?: string;
  onClick?: MouseEventHandler<HTMLElement>;
};

const SET_SUMMARY_PREVIEW_LIMIT = 7;
const SET_SUMMARY_PREVIEW_CARD_FALLBACK_WIDTH = 22;
const SET_SUMMARY_PREVIEW_GAP_FALLBACK = 8;

/** Set completion summary with optional chase, missing, collected, and import previews. */
export const SetSummary = forwardRef<HTMLElement, SetSummaryProps>(function SetSummary({
  className,
  name,
  code,
  game,
  series,
  releaseDate,
  mode = "standard",
  status = "ready",
  owned,
  total,
  masterOwned,
  masterTotal,
  missingLabel,
  missingCards = [],
  chaseCards = [],
  collectedCards = [],
  importingCards = [],
  importingCardsLoadedCount = 0,
  importingLabel = "Importing cards",
  breakdown = [],
  loadingLabel = "Loading set summary",
  errorLabel = "Set summary unavailable",
  emptyLabel = "No set summary yet",
  onClick,
  ...articleProps
}: SetSummaryProps, ref) {
  const chaseOwnedCount = chaseCards.filter((card) => card.owned !== false).length;
  const activeProgress =
    mode === "master" && typeof masterOwned === "number" && typeof masterTotal === "number"
      ? { owned: masterOwned, total: masterTotal }
      : { owned, total };
  const ownedPercent = getProgressPercent(activeProgress.owned, activeProgress.total);
  const missingCount = Math.max(total - owned, 0);
  const {
    containerRef: chasePreviewContainerRef,
    countRef: chasePreviewCountRef,
    visibleCount: chasePreviewCount
  } = useAdaptiveSetSummaryPreviewCount(chaseCards.length);
  const maxMissingPreviewCount = Math.min(missingCards.length, missingCount);
  const {
    containerRef: missingPreviewContainerRef,
    countRef: missingPreviewCountRef,
    visibleCount: missingPreviewCount
  } = useAdaptiveSetSummaryPreviewCount(maxMissingPreviewCount);
  const sortedCollectedCards = getSortedSetSummaryCardsByValue(collectedCards);
  const collectedTotalCount = Math.max(activeProgress.owned, sortedCollectedCards.length);
  const {
    containerRef: collectedPreviewContainerRef,
    countRef: collectedPreviewCountRef,
    visibleCount: collectedPreviewCount
  } = useAdaptiveSetSummaryPreviewCount<HTMLDivElement>(
    sortedCollectedCards.length,
    sortedCollectedCards.length,
    collectedTotalCount > sortedCollectedCards.length ? "always" : "overflow"
  );
  const collectedOverflowCount = Math.max(collectedTotalCount - collectedPreviewCount, 0);
  const missingDisplayValue = missingCards.length
    ? `+${Math.max(missingCount - missingPreviewCount, 0)}`
    : (missingLabel ?? missingCount);
  const metadata = [game, series, releaseDate].filter((item): item is string => Boolean(item));
  const resolvedStatus = getResolvedSetSummaryStatus(status, activeProgress.total);
  const isComplete = resolvedStatus === "ready" && activeProgress.total > 0 && activeProgress.owned >= activeProgress.total;
  const stateLabel = getSetSummaryStateLabel({
    status: resolvedStatus,
    loadingLabel,
    errorLabel,
    emptyLabel
  });
  const hasMasterProgress = typeof masterOwned === "number" && typeof masterTotal === "number";
  const showImportingCards = importingCards.length > 0;
  const resolvedImportingCardsLoadedCount = Math.min(
    Math.max(Math.round(importingCardsLoadedCount), 0),
    importingCards.length
  );
  const showCompleteCollectedCards = !showImportingCards && isComplete && sortedCollectedCards.length > 0;
  const statsColumns = 2 + (hasMasterProgress ? 1 : 0) + (chaseCards.length ? 1 : 0);
  const showsProgressData = resolvedStatus === "ready";
  const importingProgressLabel = `${resolvedImportingCardsLoadedCount}/${importingCards.length}`;
  const headerValue = showsProgressData ? `${ownedPercent}%` : "--";
  const progressMeter = (
    <div
      className="cs-set-summary-meter"
      aria-label={`${activeProgress.owned} of ${activeProgress.total} cards owned`}
    >
      <span style={{ "--cs-set-summary": `${showsProgressData ? ownedPercent : 0}%` } as CSSProperties} />
    </div>
  );
  const progressHeader = (
    <header className="cs-set-summary-header">
      <div className="cs-set-summary-heading">
        <div className="cs-set-summary-title-row">
          <h3>{name}</h3>
          {!showImportingCards ? <strong>{headerValue}</strong> : null}
        </div>
        {showImportingCards ? (
          <p
            className="cs-set-summary-metadata"
            aria-label={`${importingLabel}: ${resolvedImportingCardsLoadedCount} of ${importingCards.length} cards imported`}
          >
            {importingLabel} &bull; {importingProgressLabel}
          </p>
        ) : metadata.length ? (
          <p className="cs-set-summary-metadata">{metadata.join(" • ")}</p>
        ) : code ? (
          <span className="cs-set-summary-code">{code}</span>
        ) : null}
      </div>
    </header>
  );

  return (
    <article
      {...articleProps}
      ref={ref}
      className={["cs-set-summary", className].filter(Boolean).join(" ")}
      data-status={resolvedStatus}
      data-complete={isComplete ? "true" : undefined}
      data-importing={showImportingCards ? "true" : undefined}
      data-interactive={onClick ? "true" : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              event.currentTarget.click();
            }
          : undefined
      }
    >
      {showImportingCards ? (
        <div className="cs-set-summary-import-header-stack">
          {progressHeader}
          {progressMeter}
        </div>
      ) : (
        progressHeader
      )}
      {!showImportingCards && stateLabel ? (
        <p className="cs-set-summary-state">
          <span>{stateLabel}</span>
        </p>
      ) : null}
      {showImportingCards ? (
        <div className="cs-set-summary-import-controls">
          <SetSummaryImportRail
            cards={importingCards}
            label={importingLabel}
            loadedCount={resolvedImportingCardsLoadedCount}
          />
        </div>
      ) : (
        <>
          {progressMeter}
          {showCompleteCollectedCards ? (
            <div
              ref={collectedPreviewContainerRef}
              className="cs-set-summary-complete-collected"
              data-adaptive-preview="true"
            >
              <SetSummaryCardPreviews cards={sortedCollectedCards} label="Collected cards" limit={collectedPreviewCount} />
              <span
                ref={collectedPreviewCountRef}
                className="cs-set-summary-preview-count"
                data-empty={collectedOverflowCount <= 0 ? "true" : undefined}
                aria-label={`${collectedOverflowCount} additional collected cards`}
              >
                +{collectedOverflowCount}
              </span>
            </div>
          ) : showsProgressData ? (
            <dl
              className="cs-set-summary-stats"
              style={{ "--cs-set-summary-stat-count": statsColumns } as CSSProperties}
            >
              <div data-stat="cards">
                <dt>Cards</dt>
                <dd>
                  {owned}/{total}
                </dd>
              </div>
              {hasMasterProgress ? (
                <div data-stat="master">
                  <dt>Master</dt>
                  <dd>
                    {masterOwned}/{masterTotal}
                  </dd>
                </div>
              ) : null}
              {chaseCards.length ? (
                <div data-stat="chase" data-variant="chase">
                  <dt>Chase cards</dt>
                  <dd ref={chasePreviewContainerRef} data-adaptive-preview="true">
                    <SetSummaryCardPreviews cards={chaseCards} label="Chase cards" limit={chasePreviewCount} />
                    <span
                      ref={chasePreviewCountRef}
                      className="cs-set-summary-preview-count"
                      aria-label={`${chaseOwnedCount} of ${chaseCards.length} chase cards owned`}
                    >
                      {chaseOwnedCount}/{chaseCards.length}
                    </span>
                  </dd>
                </div>
              ) : null}
              <div data-stat="missing" data-variant={missingCards.length ? "preview" : undefined}>
                <dt>Missing</dt>
                <dd ref={missingPreviewContainerRef} data-adaptive-preview={missingCards.length ? "true" : undefined}>
                  {missingCards.length ? (
                    <SetSummaryCardPreviews cards={missingCards} label="Missing cards" limit={missingPreviewCount} />
                  ) : null}
                  <span
                    ref={missingCards.length ? missingPreviewCountRef : undefined}
                    className={missingCards.length ? "cs-set-summary-preview-count" : undefined}
                  >
                    {missingLabel ?? missingDisplayValue}
                  </span>
                </dd>
              </div>
            </dl>
          ) : null}
        </>
      )}
      {resolvedStatus === "ready" && breakdown.length ? (
        <div className="cs-set-summary-breakdown">
          {breakdown.map((item) => (
            <div className="cs-set-summary-breakdown-item" key={item.label}>
              <div className="cs-set-summary-breakdown-rarity">
                <RarityMark rarity={item.label} tooltip={false} />
                <span className="cs-set-summary-breakdown-label">{item.label}</span>
              </div>
              <strong aria-label={`${item.owned} of ${item.total} ${item.label} cards owned`}>
                {item.owned}/{item.total}
              </strong>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
});

function useAdaptiveSetSummaryPreviewCount<ContainerElement extends HTMLElement = HTMLElement>(
  maxCount: number,
  limit = SET_SUMMARY_PREVIEW_LIMIT,
  countReservation: "always" | "overflow" = "always"
) {
  return useAdaptivePreviewCount<ContainerElement, HTMLSpanElement>({
    maxCount,
    limit,
    railSelector: ".cs-set-summary-preview-cards",
    itemSelector: ".cs-set-summary-preview-card",
    fallbackItemWidth: SET_SUMMARY_PREVIEW_CARD_FALLBACK_WIDTH,
    fallbackGap: SET_SUMMARY_PREVIEW_GAP_FALLBACK,
    countReservation
  });
}

function getResolvedSetSummaryStatus(status: SetSummaryStatus, total: number) {
  if (status !== "ready") {
    return status;
  }

  return total <= 0 ? "empty" : status;
}

function getSetSummaryStateLabel({
  status,
  loadingLabel,
  errorLabel,
  emptyLabel
}: {
  status: SetSummaryStatus;
  loadingLabel: string;
  errorLabel: string;
  emptyLabel: string;
}) {
  if (status === "loading") return loadingLabel;
  if (status === "error") return errorLabel;
  if (status === "empty") return emptyLabel;
  return null;
}

function getSortedSetSummaryCardsByValue(cards: SetSummaryPreviewCard[]) {
  return cards
    .map((card, index) => ({ card, index, sortValue: getSetSummaryCardSortValue(card) }))
    .sort((a, b) => {
      if (a.sortValue !== b.sortValue) return b.sortValue - a.sortValue;
      return a.index - b.index;
    })
    .map(({ card }) => card);
}

function getSetSummaryCardSortValue(card: SetSummaryPreviewCard) {
  const rawValue = card.value ?? card.price ?? "";
  const parsedValue = Number.parseFloat(rawValue.replace(/[^0-9.-]/g, ""));

  return Number.isFinite(parsedValue) ? parsedValue : Number.NEGATIVE_INFINITY;
}

function SetSummaryImportRail({
  cards,
  label,
  loadedCount
}: {
  cards: SetSummaryPreviewCard[];
  label: string;
  loadedCount: number;
}) {
  const resolvedLoadedCount = Math.min(Math.max(Math.round(loadedCount), 0), cards.length);
  const loadedCards = cards.slice(0, resolvedLoadedCount);
  const activeCard = cards[resolvedLoadedCount];

  return (
    <div className="cs-set-summary-import">
      <div className="cs-set-summary-import-rail" aria-label={label}>
        {loadedCards.map((card) => (
          <div
            className="cs-metadata-tooltip-trigger cs-set-summary-preview-card"
            data-tooltip="true"
            data-owned="true"
            aria-label={card.name}
            key={card.id}
          >
            <CardArt
              src={card.imageUrl}
              alt={card.imageAlt ?? `${card.name} trading card`}
              fallbackLabel={card.name}
              rarity={card.rarity}
              className="cs-set-summary-preview-thumbnail"
              tiltMultiplier={4.5}
            />
            <span className="cs-metadata-tooltip cs-set-summary-preview-tip" aria-hidden="true">
              <span className="cs-set-summary-preview-tip-name">{card.name}</span>
              {card.price || card.delta ? (
                <span>
                  {card.price ? <strong>{card.price}</strong> : null}
                  {card.price && card.delta ? (
                    <span className="cs-thumbnail-tooltip-separator" aria-hidden="true" />
                  ) : null}
                  {card.delta ? <DeltaValue value={card.delta} /> : null}
                </span>
              ) : null}
            </span>
          </div>
        ))}
        {activeCard ? (
          <div
            className="cs-set-summary-import-placeholder"
            data-active="true"
            aria-label={`Loading ${activeCard.name}`}
          />
        ) : null}
      </div>
    </div>
  );
}

function SetSummaryCardPreviews({
  cards,
  label,
  limit = SET_SUMMARY_PREVIEW_LIMIT
}: {
  cards: SetSummaryPreviewCard[];
  label: string;
  limit?: number;
}) {
  return (
    <div className="cs-set-summary-preview-cards" aria-label={label}>
      {cards.slice(0, limit).map((card) => (
        <div
          className="cs-metadata-tooltip-trigger cs-set-summary-preview-card"
          data-tooltip="true"
          data-owned={card.owned === false ? "false" : "true"}
          aria-label={card.name}
          key={card.id}
        >
          <CardArt
            src={card.imageUrl}
            alt={card.imageAlt ?? `${card.name} trading card`}
            fallbackLabel={card.name}
            rarity={card.rarity}
            className="cs-set-summary-preview-thumbnail"
            tiltMultiplier={4.5}
          />
          <span className="cs-metadata-tooltip cs-set-summary-preview-tip" aria-hidden="true">
            <span className="cs-set-summary-preview-tip-name">{card.name}</span>
            {card.value || card.price || card.delta ? (
              <span>
                {card.value || card.price ? <strong>{card.value ?? card.price}</strong> : null}
                {(card.value || card.price) && card.delta ? (
                  <span className="cs-thumbnail-tooltip-separator" aria-hidden="true" />
                ) : null}
                {card.delta ? <DeltaValue value={card.delta} /> : null}
              </span>
            ) : null}
          </span>
        </div>
      ))}
    </div>
  );
}

function getProgressPercent(owned: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((owned / total) * 100)));
}

"use client";

import { CardImageTilt } from "../core/card-image-tilt";
import { DeltaValue } from "../core/delta-value";
import { RarityMark } from "../core/rarity";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

export type SetProgressBreakdownItem = {
  label: string;
  owned: number;
  total: number;
};

export type SetProgressPreviewCard = {
  name: string;
  price?: string;
  delta?: string;
  imageUrl?: string;
  imageAlt?: string;
  owned?: boolean;
};

export type SetProgressChaseCard = SetProgressPreviewCard;

export type SetProgressMode = "standard" | "master" | "chase";
export type SetProgressStatus = "ready" | "loading" | "error" | "empty" | "stale";

export type SetProgressProps = {
  name: string;
  code?: string;
  game?: string;
  series?: string;
  releaseDate?: string;
  mode?: SetProgressMode;
  status?: SetProgressStatus;
  owned: number;
  total: number;
  masterOwned?: number;
  masterTotal?: number;
  missingLabel?: string;
  missingCards?: SetProgressPreviewCard[];
  chaseCards?: SetProgressChaseCard[];
  importingCards?: SetProgressPreviewCard[];
  importingCardsLoadedCount?: number;
  importingLabel?: string;
  breakdown?: SetProgressBreakdownItem[];
  loadingLabel?: string;
  errorLabel?: string;
  emptyLabel?: string;
  staleLabel?: string;
  completeLabel?: string;
  onClick?: () => void;
};

const SET_PROGRESS_PREVIEW_LIMIT = 7;
const SET_PROGRESS_PREVIEW_CARD_FALLBACK_WIDTH = 22;
const SET_PROGRESS_PREVIEW_GAP_FALLBACK = 8;

export function SetProgress({
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
  importingCards = [],
  importingCardsLoadedCount = 0,
  importingLabel = "Importing cards",
  breakdown = [],
  loadingLabel = "Loading set progress",
  errorLabel = "Set progress unavailable",
  emptyLabel = "No set progress yet",
  staleLabel = "Market sync locked",
  completeLabel = "Complete",
  onClick
}: SetProgressProps) {
  const chaseOwnedCount = chaseCards.filter((card) => card.owned !== false).length;
  const activeProgress = getSetProgressModeValues({
    mode,
    owned,
    total,
    masterOwned,
    masterTotal,
    chaseOwned: chaseOwnedCount,
    chaseTotal: chaseCards.length
  });
  const ownedPercent = getProgressPercent(activeProgress.owned, activeProgress.total);
  const missingCount = Math.max(total - owned, 0);
  const {
    containerRef: chasePreviewContainerRef,
    countRef: chasePreviewCountRef,
    visibleCount: chasePreviewCount
  } = useAdaptiveSetProgressPreviewCount(chaseCards.length);
  const maxMissingPreviewCount = Math.min(missingCards.length, missingCount);
  const {
    containerRef: missingPreviewContainerRef,
    countRef: missingPreviewCountRef,
    visibleCount: missingPreviewCount
  } = useAdaptiveSetProgressPreviewCount(maxMissingPreviewCount);
  const missingDisplayValue = missingCards.length
    ? `+${Math.max(missingCount - missingPreviewCount, 0)}`
    : (missingLabel ?? missingCount);
  const metadata = [game, series, releaseDate].filter((item): item is string => Boolean(item));
  const resolvedStatus = getResolvedSetProgressStatus(status, activeProgress.total);
  const isComplete = resolvedStatus === "ready" && activeProgress.total > 0 && activeProgress.owned >= activeProgress.total;
  const stateLabel = getSetProgressStateLabel({
    status: resolvedStatus,
    isComplete,
    loadingLabel,
    errorLabel,
    emptyLabel,
    staleLabel,
    completeLabel
  });
  const hasMasterProgress = typeof masterOwned === "number" && typeof masterTotal === "number";
  const showImportingCards = importingCards.length > 0;
  const resolvedImportingCardsLoadedCount = Math.min(
    Math.max(Math.round(importingCardsLoadedCount), 0),
    importingCards.length
  );
  const showCompleteChaseCards = !showImportingCards && isComplete && chaseCards.length > 0;
  const completeChaseCards = showCompleteChaseCards ? chaseCards.map((card) => ({ ...card, owned: true })) : [];
  const statsColumns = 2 + (hasMasterProgress ? 1 : 0) + (chaseCards.length ? 1 : 0);
  const showsProgressData = resolvedStatus === "ready" || resolvedStatus === "stale";
  const importingProgressLabel = `${resolvedImportingCardsLoadedCount}/${importingCards.length}`;
  const headerValue = showsProgressData ? `${ownedPercent}%` : "--";
  const progressMeter = (
    <div
      className="cs-set-progress-meter"
      aria-label={`${activeProgress.owned} of ${activeProgress.total} cards owned`}
    >
      <span style={{ "--cs-set-progress": `${showsProgressData ? ownedPercent : 0}%` } as CSSProperties} />
    </div>
  );
  const progressHeader = (
    <header className="cs-set-progress-header">
      <div className="cs-set-progress-heading">
        <div className="cs-set-progress-title-row">
          <h3>{name}</h3>
          {!showImportingCards ? <strong>{headerValue}</strong> : null}
        </div>
        {showImportingCards ? (
          <p
            className="cs-set-progress-metadata"
            aria-label={`${importingLabel}: ${resolvedImportingCardsLoadedCount} of ${importingCards.length} cards imported`}
          >
            {importingLabel} &bull; {importingProgressLabel}
          </p>
        ) : metadata.length ? (
          <p className="cs-set-progress-metadata">{metadata.join(" • ")}</p>
        ) : code ? (
          <span className="cs-set-progress-code">{code}</span>
        ) : null}
      </div>
    </header>
  );

  return (
    <article
      className="cs-set-progress"
      data-status={resolvedStatus}
      data-complete={isComplete ? "true" : undefined}
      data-importing={showImportingCards ? "true" : undefined}
      data-interactive={onClick ? "true" : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick ? () => onClick() : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              onClick();
            }
          : undefined
      }
    >
      {showImportingCards ? (
        <div className="cs-set-progress-import-header-stack">
          {progressHeader}
          {progressMeter}
        </div>
      ) : (
        progressHeader
      )}
      {!showImportingCards && stateLabel ? (
        <p className="cs-set-progress-state">
          {resolvedStatus === "stale" ? <span className="cs-set-progress-lock" aria-hidden="true" /> : null}
          <span>{stateLabel}</span>
        </p>
      ) : null}
      {showImportingCards ? (
        <div className="cs-set-progress-import-controls">
          <SetProgressImportRail
            cards={importingCards}
            label={importingLabel}
            loadedCount={resolvedImportingCardsLoadedCount}
          />
        </div>
      ) : (
        <>
          {progressMeter}
          {showCompleteChaseCards ? (
            <div className="cs-set-progress-complete-chase">
              <SetProgressCardPreviews cards={completeChaseCards} label="Chase cards" limit={completeChaseCards.length} />
            </div>
          ) : showsProgressData ? (
            <dl
              className="cs-set-progress-stats"
              style={{ "--cs-set-progress-stat-count": statsColumns } as CSSProperties}
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
                    <SetProgressCardPreviews cards={chaseCards} label="Chase cards" limit={chasePreviewCount} />
                    <span
                      ref={chasePreviewCountRef}
                      className="cs-set-progress-preview-count"
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
                    <SetProgressCardPreviews cards={missingCards} label="Missing cards" limit={missingPreviewCount} />
                  ) : null}
                  <span
                    ref={missingCards.length ? missingPreviewCountRef : undefined}
                    className={missingCards.length ? "cs-set-progress-preview-count" : undefined}
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
        <div className="cs-set-progress-breakdown">
          {breakdown.map((item) => (
            <div className="cs-set-progress-breakdown-item" key={item.label}>
              <div className="cs-set-progress-breakdown-rarity">
                <RarityMark rarity={item.label} tooltip={false} />
                <span className="cs-set-progress-breakdown-label">{item.label}</span>
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
}

function useAdaptiveSetProgressPreviewCount(maxCount: number) {
  const containerRef = useRef<HTMLElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const metricsRef = useRef({
    cardGap: SET_PROGRESS_PREVIEW_GAP_FALLBACK,
    cardWidth: SET_PROGRESS_PREVIEW_CARD_FALLBACK_WIDTH,
    containerGap: SET_PROGRESS_PREVIEW_GAP_FALLBACK
  });
  const [visibleCount, setVisibleCount] = useState(() => Math.min(maxCount, SET_PROGRESS_PREVIEW_LIMIT));

  useEffect(() => {
    setVisibleCount((currentCount) => Math.min(currentCount, maxCount));
  }, [maxCount]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId = 0;

    const measure = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        if (maxCount <= 0) {
          setVisibleCount(0);
          return;
        }

        const previewRail = container.querySelector<HTMLElement>(".cs-set-progress-preview-cards");
        const previewCard = previewRail?.querySelector<HTMLElement>(".cs-set-progress-preview-card");
        const count = countRef.current;

        if (previewRail) {
          metricsRef.current.cardGap = readCssPixelValue(getComputedStyle(previewRail).columnGap, metricsRef.current.cardGap);
        }

        if (previewCard) {
          metricsRef.current.cardWidth = previewCard.getBoundingClientRect().width || metricsRef.current.cardWidth;
        }

        metricsRef.current.containerGap = readCssPixelValue(
          getComputedStyle(container).columnGap,
          metricsRef.current.containerGap
        );

        const { cardGap, cardWidth, containerGap } = metricsRef.current;
        const containerWidth = getElementContentWidth(container.parentElement ?? container);
        const countWidth = count?.getBoundingClientRect().width ?? 0;
        const availableWidth = Math.max(containerWidth - countWidth - containerGap, 0);
        const nextVisibleCount = Math.min(
          maxCount,
          Math.max(0, Math.floor((availableWidth + cardGap) / (cardWidth + cardGap)))
        );

        setVisibleCount((currentCount) => (currentCount === nextVisibleCount ? currentCount : nextVisibleCount));
      });
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => {
        window.removeEventListener("resize", measure);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      };
    }

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(container);
    if (countRef.current) {
      resizeObserver.observe(countRef.current);
    }
    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [maxCount, visibleCount]);

  return { containerRef, countRef, visibleCount };
}

function readCssPixelValue(value: string, fallback: number) {
  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function getElementContentWidth(element: HTMLElement) {
  const styles = getComputedStyle(element);
  const paddingInline =
    readCssPixelValue(styles.paddingLeft, 0) + readCssPixelValue(styles.paddingRight, 0);

  return Math.max(element.getBoundingClientRect().width - paddingInline, 0);
}

function getSetProgressModeValues({
  mode,
  owned,
  total,
  masterOwned,
  masterTotal,
  chaseOwned,
  chaseTotal
}: {
  mode: SetProgressMode;
  owned: number;
  total: number;
  masterOwned?: number;
  masterTotal?: number;
  chaseOwned: number;
  chaseTotal: number;
}) {
  if (mode === "master" && typeof masterOwned === "number" && typeof masterTotal === "number") {
    return { owned: masterOwned, total: masterTotal };
  }

  if (mode === "chase" && chaseTotal > 0) {
    return { owned: chaseOwned, total: chaseTotal };
  }

  return { owned, total };
}

function getResolvedSetProgressStatus(status: SetProgressStatus, total: number) {
  if (status !== "ready") {
    return status;
  }

  return total <= 0 ? "empty" : status;
}

function getSetProgressStateLabel({
  status,
  isComplete,
  loadingLabel,
  errorLabel,
  emptyLabel,
  staleLabel,
  completeLabel
}: {
  status: SetProgressStatus;
  isComplete: boolean;
  loadingLabel: string;
  errorLabel: string;
  emptyLabel: string;
  staleLabel: string;
  completeLabel: string;
}) {
  if (status === "loading") return loadingLabel;
  if (status === "error") return errorLabel;
  if (status === "empty") return emptyLabel;
  if (status === "stale") return staleLabel;
  if (isComplete) return completeLabel;
  return null;
}

function SetProgressImportRail({
  cards,
  label,
  loadedCount
}: {
  cards: SetProgressPreviewCard[];
  label: string;
  loadedCount: number;
}) {
  const resolvedLoadedCount = Math.min(Math.max(Math.round(loadedCount), 0), cards.length);
  const loadedCards = cards.slice(0, resolvedLoadedCount);
  const activeCard = cards[resolvedLoadedCount];

  return (
    <div className="cs-set-progress-import">
      <div className="cs-set-progress-import-rail" aria-label={label}>
        {loadedCards.map((card) => (
          <div
            className="cs-metadata-tooltip-trigger cs-set-progress-preview-card"
            data-tooltip="true"
            data-owned="true"
            aria-label={card.name}
            key={card.name}
          >
            <CardImageTilt
              src={card.imageUrl}
              alt={card.imageAlt ?? `${card.name} trading card`}
              fallbackLabel={card.name}
              className="cs-set-progress-preview-thumbnail"
              tiltMultiplier={4.5}
            />
            <span className="cs-metadata-tooltip cs-set-progress-preview-tip" aria-hidden="true">
              <span className="cs-set-progress-preview-tip-name">{card.name}</span>
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
            className="cs-set-progress-import-placeholder"
            data-active="true"
            aria-label={`Loading ${activeCard.name}`}
          />
        ) : null}
      </div>
    </div>
  );
}

function SetProgressCardPreviews({
  cards,
  label,
  limit = SET_PROGRESS_PREVIEW_LIMIT
}: {
  cards: SetProgressPreviewCard[];
  label: string;
  limit?: number;
}) {
  return (
    <div className="cs-set-progress-preview-cards" aria-label={label}>
      {cards.slice(0, limit).map((card) => (
        <div
          className="cs-metadata-tooltip-trigger cs-set-progress-preview-card"
          data-tooltip="true"
          data-owned={card.owned === false ? "false" : "true"}
          aria-label={card.name}
          key={card.name}
        >
          <CardImageTilt
            src={card.imageUrl}
            alt={card.imageAlt ?? `${card.name} trading card`}
            fallbackLabel={card.name}
            className="cs-set-progress-preview-thumbnail"
            tiltMultiplier={4.5}
          />
          <span className="cs-metadata-tooltip cs-set-progress-preview-tip" aria-hidden="true">
            <span className="cs-set-progress-preview-tip-name">{card.name}</span>
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
    </div>
  );
}

function getProgressPercent(owned: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((owned / total) * 100)));
}

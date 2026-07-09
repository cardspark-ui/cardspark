"use client";

import { useEffect, useRef, useState } from "react";

type AdaptivePreviewCountOptions = {
  maxCount: number;
  limit: number;
  railSelector: string;
  itemSelector: string;
  fallbackItemWidth: number;
  fallbackGap: number;
  countReservation?: "always" | "overflow";
};

export function useAdaptivePreviewCount<
  ContainerElement extends HTMLElement = HTMLElement,
  CountElement extends HTMLElement = HTMLElement
>({
  maxCount,
  limit,
  railSelector,
  itemSelector,
  fallbackItemWidth,
  fallbackGap,
  countReservation = "always"
}: AdaptivePreviewCountOptions) {
  const containerRef = useRef<ContainerElement>(null);
  const countRef = useRef<CountElement>(null);
  const metricsRef = useRef({
    itemGap: fallbackGap,
    itemWidth: fallbackItemWidth,
    containerGap: fallbackGap
  });
  const [visibleCount, setVisibleCount] = useState(() => Math.min(maxCount, limit));

  useEffect(() => {
    setVisibleCount((currentCount) => Math.min(currentCount, maxCount, limit));
  }, [limit, maxCount]);

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

        const previewRail = container.querySelector<HTMLElement>(railSelector);
        const previewItem = previewRail?.querySelector<HTMLElement>(itemSelector);
        const count = countRef.current;

        if (previewRail) {
          metricsRef.current.itemGap = readCssPixelValue(getComputedStyle(previewRail).columnGap, metricsRef.current.itemGap);
        }

        if (previewItem) {
          metricsRef.current.itemWidth = previewItem.getBoundingClientRect().width || metricsRef.current.itemWidth;
        }

        metricsRef.current.containerGap = readCssPixelValue(
          getComputedStyle(container).columnGap,
          metricsRef.current.containerGap
        );

        const { itemGap, itemWidth, containerGap } = metricsRef.current;
        const containerWidth = getElementContentWidth(container.parentElement ?? container);
        const countWidth = count?.getBoundingClientRect().width ?? 0;
        const maxVisibleCount = Math.min(maxCount, limit);
        const unreservedVisibleCount = Math.min(
          maxVisibleCount,
          Math.max(0, Math.floor((containerWidth + itemGap) / (itemWidth + itemGap)))
        );
        const shouldReserveCount = countReservation === "always" || unreservedVisibleCount < maxVisibleCount;
        const availableWidth = Math.max(
          containerWidth - (shouldReserveCount ? countWidth + containerGap : 0),
          0
        );
        const nextVisibleCount = Math.min(
          maxCount,
          limit,
          Math.max(0, Math.floor((availableWidth + itemGap) / (itemWidth + itemGap)))
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
  }, [countReservation, itemSelector, limit, maxCount, railSelector, visibleCount]);

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

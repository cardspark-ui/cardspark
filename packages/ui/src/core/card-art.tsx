"use client";

import { useCallback, useEffect, useRef, useState, type AnimationEvent, type PointerEvent } from "react";

const MAX_COUNTER_TILT_DEGREES = 8;
const MAX_HOLO_SHIFT_PERCENT = 46;
const MAX_LIGHT_SHIFT_PERCENT = 70;
const AUTO_LOADING_PLACEHOLDER_DELAY_MS = 120;

const NON_HOLOGRAPHIC_CARD_RARITIES = new Set(["common", "uncommon", "rare"]);
const HOLOGRAPHIC_RARITY_KEYWORDS = [
  "ace spec",
  "amazing rare",
  "double rare",
  "gold",
  "holo",
  "hyper rare",
  "illustration rare",
  "radiant",
  "rainbow",
  "secret",
  "shiny",
  "special illustration",
  "trainer gallery",
  "ultra rare"
];

export type CardArtEffectSetting = boolean | "auto";
export type CardArtLoadState = "auto" | "loading" | "transitioning" | "loaded";
export type CardArtSpecularEffect = "auto" | "plain" | "holo";
type ResolvedCardArtLoadState = Exclude<CardArtLoadState, "auto">;
type InternalCardArtLoadState = ResolvedCardArtLoadState | "pending";
const loadedCardArtSources = new Set<string>();

export type CardArtProps = {
  src?: string;
  alt: string;
  fallbackLabel: string;
  className?: string;
  rarity?: string;
  showGlow?: CardArtEffectSetting;
  loadState?: CardArtLoadState;
  showSpecular?: CardArtEffectSetting;
  specularEffect?: CardArtSpecularEffect;
  showBackFace?: boolean;
  tiltMultiplier?: number;
};

function clampOffset(value: number) {
  return Math.min(0.5, Math.max(-0.5, value));
}

function normalizeRarity(rarity: string) {
  return rarity.trim().replace(/[-_]+/g, " ").replace(/\s+/g, " ").toLowerCase();
}

function hasHolographicCardEffects(rarity?: string) {
  if (!rarity) {
    return true;
  }

  const normalizedRarity = normalizeRarity(rarity);

  if (NON_HOLOGRAPHIC_CARD_RARITIES.has(normalizedRarity)) {
    return false;
  }

  return HOLOGRAPHIC_RARITY_KEYWORDS.some((keyword) => normalizedRarity.includes(keyword));
}

function resolveCardArtSpecularEffect(effect: CardArtSpecularEffect, rarity?: string) {
  if (effect !== "auto") {
    return effect;
  }

  return hasHolographicCardEffects(rarity) ? "holo" : "plain";
}

function resolveCardArtEffect(setting: CardArtEffectSetting, rarity?: string) {
  return setting === "auto" ? hasHolographicCardEffects(rarity) : setting;
}

export function applyCardImageTilt(
  target: HTMLElement,
  clientX: number,
  clientY: number,
  {
    clampToBounds = false,
    lightOpacity = "1",
    tiltMultiplier = 1
  }: {
    clampToBounds?: boolean;
    lightOpacity?: string;
    tiltMultiplier?: number;
  } = {}
) {
  const rect = target.getBoundingClientRect();
  const width = Math.max(rect.width, 1);
  const height = Math.max(rect.height, 1);
  const rawOffsetX = (clientX - rect.left) / width - 0.5;
  const rawOffsetY = (clientY - rect.top) / height - 0.5;
  const offsetX = clampToBounds ? clampOffset(rawOffsetX) : rawOffsetX;
  const offsetY = clampToBounds ? clampOffset(rawOffsetY) : rawOffsetY;
  const rotateX = offsetY * MAX_COUNTER_TILT_DEGREES * tiltMultiplier;
  const rotateY = offsetX * -MAX_COUNTER_TILT_DEGREES * tiltMultiplier;
  const holoX = 50 + offsetX * MAX_HOLO_SHIFT_PERCENT;
  const holoY = 50 + offsetY * MAX_HOLO_SHIFT_PERCENT;
  const lightX = 50 - offsetX * MAX_LIGHT_SHIFT_PERCENT;
  const lightY = 50 - offsetY * MAX_LIGHT_SHIFT_PERCENT;

  target.dataset.tilting = "true";
  target.style.setProperty("--cs-card-tilt-x", `${rotateX.toFixed(2)}deg`);
  target.style.setProperty("--cs-card-tilt-y", `${rotateY.toFixed(2)}deg`);
  target.style.setProperty("--cs-card-holo-x", `${holoX.toFixed(1)}%`);
  target.style.setProperty("--cs-card-holo-y", `${holoY.toFixed(1)}%`);
  target.style.setProperty("--cs-card-light-x", `${lightX.toFixed(1)}%`);
  target.style.setProperty("--cs-card-light-y", `${lightY.toFixed(1)}%`);
  target.style.setProperty("--cs-card-light-opacity", lightOpacity);
}

export function resetCardImageTilt(target: HTMLElement) {
  delete target.dataset.tilting;
  target.style.setProperty("--cs-card-tilt-x", "0deg");
  target.style.setProperty("--cs-card-tilt-y", "0deg");
  target.style.setProperty("--cs-card-holo-x", "50%");
  target.style.setProperty("--cs-card-holo-y", "50%");
  target.style.setProperty("--cs-card-light-x", "50%");
  target.style.setProperty("--cs-card-light-y", "50%");
  target.style.setProperty("--cs-card-light-opacity", "0");
}

export function CardArt({
  src,
  alt,
  fallbackLabel,
  className,
  rarity,
  showGlow = "auto",
  loadState = "auto",
  showSpecular = "auto",
  specularEffect = "auto",
  showBackFace = false,
  tiltMultiplier = 1
}: CardArtProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [autoLoadState, setAutoLoadState] = useState<InternalCardArtLoadState>(() =>
    src && !loadedCardArtSources.has(src) ? "pending" : "loaded"
  );
  const resolvedLoadState = loadState === "auto" ? autoLoadState : loadState;
  const canShowCardEffects = Boolean(src && resolvedLoadState === "loaded");
  const hasGlow = Boolean(canShowCardEffects && resolveCardArtEffect(showGlow, rarity));
  const hasSpecular = Boolean(canShowCardEffects && resolveCardArtEffect(showSpecular, rarity));
  const resolvedSpecularEffect = resolveCardArtSpecularEffect(specularEffect, rarity);

  useEffect(() => {
    if (loadState !== "auto") {
      return;
    }

    setAutoLoadState(src && !loadedCardArtSources.has(src) ? "pending" : "loaded");
  }, [loadState, src]);

  useEffect(() => {
    if (loadState !== "auto" || autoLoadState !== "pending") {
      return;
    }

    const timer = setTimeout(() => {
      setAutoLoadState((current) => (current === "pending" ? "loading" : current));
    }, AUTO_LOADING_PLACEHOLDER_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [autoLoadState, loadState]);

  useEffect(() => {
    if (loadState !== "auto" || autoLoadState !== "transitioning") {
      return;
    }

    const timer = setTimeout(() => {
      setAutoLoadState("loaded");
    }, 900);

    return () => {
      clearTimeout(timer);
    };
  }, [autoLoadState, loadState]);

  const setArtworkRef = useCallback(
    (image: HTMLImageElement | null) => {
      imageRef.current = image;

      if (loadState !== "auto" || !src || !image) {
        return;
      }

      if (image.complete && image.naturalWidth > 0) {
        loadedCardArtSources.add(src);
        setAutoLoadState("loaded");
      }
    },
    [loadState, src]
  );

  function handleArtworkLoad() {
    if (src) {
      loadedCardArtSources.add(src);
    }

    if (loadState === "auto") {
      setAutoLoadState((current) => {
        if (current === "pending") {
          return "loaded";
        }

        if (current === "loading") {
          return "transitioning";
        }

        return current;
      });
    }
  }

  function handleLoadAnimationEnd(event: AnimationEvent<HTMLElement>) {
    if (event.animationName === "cs-card-art-load-reveal" && loadState === "auto") {
      setAutoLoadState("loaded");
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") {
      return;
    }

    applyCardImageTilt(event.currentTarget, event.clientX, event.clientY, {
      lightOpacity: hasSpecular ? "1" : "0",
      tiltMultiplier
    });
  }

  function resetTilt(event: PointerEvent<HTMLElement>) {
    resetCardImageTilt(event.currentTarget);
  }

  return (
    <div
      className={["cs-card-image-tilt", className].filter(Boolean).join(" ")}
      data-load-state={resolvedLoadState}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      onPointerCancel={resetTilt}
    >
      {hasGlow ? <img className="cs-card-image-glow" src={src} alt="" aria-hidden="true" loading="lazy" /> : null}
      <span className="cs-card-image-plane">
        <span className="cs-card-image-face cs-card-image-front-face">
          {src ? (
            <span className="cs-card-image-load-stage" onAnimationEnd={handleLoadAnimationEnd}>
              <span className="cs-card-image-load-face cs-card-image-loading-face" aria-hidden="true" />
              <span className="cs-card-image-load-face cs-card-image-loaded-face">
                <img
                  ref={setArtworkRef}
                  className="cs-card-image-artwork"
                  src={src}
                  alt={alt}
                  loading="lazy"
                  onLoad={handleArtworkLoad}
                />
              </span>
            </span>
          ) : (
            <span aria-hidden="true">{fallbackLabel.slice(0, 2).toUpperCase()}</span>
          )}
          {hasSpecular ? (
            <span className="cs-card-image-specular" data-effect={resolvedSpecularEffect} aria-hidden="true" />
          ) : null}
        </span>
        {showBackFace ? (
          <span className="cs-card-image-face cs-card-image-back-face" aria-hidden="true" />
        ) : null}
      </span>
    </div>
  );
}

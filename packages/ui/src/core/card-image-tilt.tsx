"use client";

import type { PointerEvent } from "react";

const MAX_COUNTER_TILT_DEGREES = 8;
const MAX_HOLO_SHIFT_PERCENT = 46;
const MAX_LIGHT_SHIFT_PERCENT = 70;

function clampOffset(value: number) {
  return Math.min(0.5, Math.max(-0.5, value));
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

export function CardImageTilt({
  src,
  alt,
  fallbackLabel,
  className,
  showGlow = true,
  showSpecular = true,
  showBackFace = false,
  tiltMultiplier = 1
}: {
  src?: string;
  alt: string;
  fallbackLabel: string;
  className?: string;
  showGlow?: boolean;
  showSpecular?: boolean;
  showBackFace?: boolean;
  tiltMultiplier?: number;
}) {
  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") {
      return;
    }

    applyCardImageTilt(event.currentTarget, event.clientX, event.clientY, {
      lightOpacity: src ? "1" : "0",
      tiltMultiplier
    });
  }

  function resetTilt(event: PointerEvent<HTMLElement>) {
    resetCardImageTilt(event.currentTarget);
  }

  return (
    <figure
      className={["cs-card-image-tilt", className].filter(Boolean).join(" ")}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      onPointerCancel={resetTilt}
    >
      {src && showGlow ? <img className="cs-card-image-glow" src={src} alt="" aria-hidden="true" loading="lazy" /> : null}
      <span className="cs-card-image-plane">
        <span className="cs-card-image-face cs-card-image-front-face">
          {src ? (
            <img className="cs-card-image-artwork" src={src} alt={alt} loading="lazy" />
          ) : (
            <span aria-hidden="true">{fallbackLabel.slice(0, 2).toUpperCase()}</span>
          )}
          {src && showSpecular ? <span className="cs-card-image-specular" aria-hidden="true" /> : null}
        </span>
        {showBackFace ? (
          <span className="cs-card-image-face cs-card-image-back-face" aria-hidden="true" />
        ) : null}
      </span>
    </figure>
  );
}

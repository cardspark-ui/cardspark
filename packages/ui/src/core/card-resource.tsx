import { MetadataTooltip } from "./rarity";
import type { TcgVariant } from "./rarity";
import colorlessEnergyUrl from "../assets/pokemon/energy/colorless.png";
import darknessEnergyUrl from "../assets/pokemon/energy/darkness.png";
import dragonEnergyUrl from "../assets/pokemon/energy/dragon.png";
import fairyEnergyUrl from "../assets/pokemon/energy/fairy.png";
import fightingEnergyUrl from "../assets/pokemon/energy/fighting.png";
import fireEnergyUrl from "../assets/pokemon/energy/fire.png";
import grassEnergyUrl from "../assets/pokemon/energy/grass.png";
import lightningEnergyUrl from "../assets/pokemon/energy/lightning.png";
import metalEnergyUrl from "../assets/pokemon/energy/metal.png";
import psychicEnergyUrl from "../assets/pokemon/energy/psychic.png";
import waterEnergyUrl from "../assets/pokemon/energy/water.png";

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

export type CardBadgeTypeDisplay = "mark" | "label" | "mark-label";

const ENERGY_CODE_LABELS: Record<string, CardResourceType> = {
  C: "Colorless",
  D: "Darkness",
  DR: "Dragon",
  F: "Fighting",
  FA: "Fairy",
  G: "Grass",
  L: "Lightning",
  M: "Metal",
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

function getBundledAssetUrl(asset: string | { src: string }) {
  return typeof asset === "string" ? asset : asset.src;
}

const ENERGY_ASSET_URLS: Record<CardResourceType, string> = {
  Colorless: getBundledAssetUrl(colorlessEnergyUrl),
  Darkness: getBundledAssetUrl(darknessEnergyUrl),
  Dragon: getBundledAssetUrl(dragonEnergyUrl),
  Fairy: getBundledAssetUrl(fairyEnergyUrl),
  Fighting: getBundledAssetUrl(fightingEnergyUrl),
  Fire: getBundledAssetUrl(fireEnergyUrl),
  Grass: getBundledAssetUrl(grassEnergyUrl),
  Lightning: getBundledAssetUrl(lightningEnergyUrl),
  Metal: getBundledAssetUrl(metalEnergyUrl),
  Psychic: getBundledAssetUrl(psychicEnergyUrl),
  Water: getBundledAssetUrl(waterEnergyUrl)
};

export function CardBadgeTypeView({
  type,
  display = "mark-label",
  className,
  tooltip = true,
  variant = "pokemon"
}: {
  type: CardResourceType | string;
  display?: CardBadgeTypeDisplay;
  className?: string;
  tooltip?: boolean;
  variant?: TcgVariant;
}) {
  const resourceType = normalizeResourceType(type, variant);
  const classes = ["cs-metadata-badge", "cs-card-type-badge", "cs-energy-line", className].filter(Boolean).join(" ");
  const showLabel = display !== "mark";

  return (
    <span className={classes} aria-label={display === "mark" ? `${type} type` : undefined}>
      {display === "label" ? null : (
        <CardResourceIcon decorative resourceType={resourceType} tooltip={tooltip && !showLabel} variant={variant} />
      )}
      {showLabel ? <span className="cs-energy-line-text">{type}</span> : null}
    </span>
  );
}

export function CardResourceIcon({
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

export function normalizeResourceType(resource: CardResourceType | string, variant: TcgVariant = "pokemon"): CardResourceType {
  return getKnownResourceType(resource, variant) ?? "Colorless";
}

export function getResourceCostLabel(resourceTypes: CardResourceType[]) {
  const counts = resourceTypes.reduce<Record<string, number>>((accumulator, resourceType) => {
    accumulator[resourceType] = (accumulator[resourceType] ?? 0) + 1;

    return accumulator;
  }, {});
  const parts = Object.entries(counts).map(([resourceType, count]) => `${count} ${resourceType}`);

  return `${parts.join(", ")} resource`;
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

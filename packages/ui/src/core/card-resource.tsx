import { MetadataTooltip } from "./rarity";
import type { TcgVariant } from "./rarity";

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

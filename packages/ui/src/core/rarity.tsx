import { RARITY_ASSETS } from "./rarity-assets";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

const RARITY_ALIASES: Record<string, string> = {
  "ACE SPEC": "ACE SPEC Rare",
  "Art Rare": "Art Rare_JP",
  "Character Rare": "Character Rare_JP",
  "Character Super Rare": "Character Super Rare_JP",
  "Holo Rare": "Rare Holo",
  Radiant: "Radiant_JP",
  "Secret Rare": "Rare Secret",
  "Special Art Rare": "Special Art Rare_JP",
  "Super Rare": "Super Rare_JP",
  "Triple Rare": "Triple Rare_JP"
};

const RARITY_ASSETS_BY_NORMALIZED_NAME = buildRarityAssetLookup();

export type TcgVariant = "pokemon";

export type RarityMarkProps = {
  rarity: string;
  className?: string;
  variant?: TcgVariant;
  tooltip?: boolean;
};

export type RarityTooltipLabelProps = {
  rarity: string;
  variant?: TcgVariant;
};

export function getRarityAcronym(rarity: string) {
  const knownRarities: Record<string, string> = {
    "ACE SPEC": "ACE",
    "ACE SPEC Rare": "ACE",
    "Special Illustration Rare": "SIR",
    "Illustration Rare": "IR",
    "Ultra Rare": "UR",
    "Secret Rare": "SR",
    "Rare Secret": "SR",
    "Hyper Rare": "HR",
    "Double Rare": "DR",
    "Rare Holo": "RH",
    "Holo Rare": "HR",
    "Trainer Gallery Rare Holo": "TGRH",
    "Shiny Ultra Rare": "SHUR"
  };

  return knownRarities[rarity] ?? makeRarityAcronym(rarity);
}

export function RarityMark({
  rarity,
  className,
  variant = "pokemon",
  tooltip = true
}: RarityMarkProps) {
  const asset = variant === "pokemon" ? getRarityAsset(rarity) : undefined;
  const shortText = getRarityAcronym(rarity);
  const classes = ["cs-rarity-mark", className].filter(Boolean).join(" ");

  return (
    <MetadataTooltip label={<RarityTooltipLabel rarity={rarity} variant={variant} />} className={classes} disabled={!tooltip}>
      {asset ? <RaritySymbol asset={asset} /> : null}
      <span className={asset ? "cs-rarity-text cs-sr-only" : "cs-rarity-text"}>{shortText}</span>
    </MetadataTooltip>
  );
}

export function RarityTooltipLabel({ rarity, variant = "pokemon" }: RarityTooltipLabelProps) {
  const asset = variant === "pokemon" ? getRarityAsset(rarity) : undefined;
  const shortText = getRarityAcronym(rarity);

  return (
    <span className="cs-metadata-badge cs-rarity-badge cs-rarity-tooltip-label">
      {asset ? <RaritySymbol asset={asset} className="cs-rarity-tooltip-symbol" /> : <span className="cs-rarity-badge-text">{shortText}</span>}
      <span className="cs-rarity-badge-text">{rarity}</span>
    </span>
  );
}

function RaritySymbol({
  asset,
  className
}: {
  asset: (typeof RARITY_ASSETS)[string];
  className?: string;
}) {
  const classes = ["cs-rarity-svg", className].filter(Boolean).join(" ");

  return (
    <span
      className={classes}
      aria-hidden="true"
      style={
        {
          "--cs-rarity-scale": asset.scale * (asset.sizeScale ?? 1),
          "--cs-rarity-size-scale": asset.sizeScale ?? 1
        } as CSSProperties
      }
      dangerouslySetInnerHTML={{ __html: asset.svg }}
    />
  );
}

export function MetadataTooltip({
  label,
  className,
  children,
  visibility = "always",
  disabled = false,
  ...triggerProps
}: {
  label: ReactNode;
  className?: string;
  children: ReactNode;
  visibility?: "always" | "compact";
  disabled?: boolean;
} & Omit<ComponentPropsWithoutRef<"span">, "aria-label" | "children" | "className" | "title">) {
  const classes = ["cs-metadata-tooltip-trigger", className].filter(Boolean).join(" ");

  return (
    <span
      {...triggerProps}
      className={classes}
      aria-label={!disabled && typeof label === "string" ? label : undefined}
      data-tooltip={disabled ? undefined : "true"}
      data-tooltip-visibility={!disabled && visibility !== "always" ? visibility : undefined}
      tabIndex={disabled ? undefined : 0}
    >
      {children}
      {disabled ? null : (
        <span className="cs-metadata-tooltip" aria-hidden="true">
          {label}
        </span>
      )}
    </span>
  );
}

function getRarityAsset(rarity: string) {
  const alias = RARITY_ALIASES[rarity];
  return RARITY_ASSETS_BY_NORMALIZED_NAME[normalizeRarity(alias ?? rarity)];
}

function buildRarityAssetLookup() {
  const lookup: typeof RARITY_ASSETS = {};

  for (const [key, asset] of Object.entries(RARITY_ASSETS)) {
    lookup[normalizeRarity(key)] ??= asset;
  }

  return lookup;
}

function normalizeRarity(rarity: string) {
  return rarity.trim().replace(/[-_]+/g, " ").replace(/\s+/g, " ").toLowerCase();
}

function makeRarityAcronym(rarity: string) {
  return rarity
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

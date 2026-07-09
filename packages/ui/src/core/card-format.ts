import type { ReactNode } from "react";

export type CardPresentationFormat = "market" | "collection";

export type TradingCardData = {
  name?: string;
  set?: string;
  setCode?: string;
  number?: string;
  rarity?: string;
  condition?: string;
  finish?: string;
  finishCode?: string;
  variant?: string;
  imageUrl?: string;
  imageAlt?: string;
  value?: string;
  marketValue?: string;
  collectionValue?: string;
  delta?: string;
  deltaPeriod?: string;
  dateAdded?: string;
  costBasis?: string;
};

export type CardPresentationBaseProps = {
  format?: CardPresentationFormat;
  card?: TradingCardData;
  name?: string;
  set?: string;
  setCode?: string;
  number?: string;
  rarity?: string;
  condition?: string;
  variant?: string;
  imageUrl?: string;
  imageAlt?: string;
  value?: string;
  price?: string;
  delta?: string;
  deltaPeriod?: string;
  dateAdded?: string;
  costBasis?: string;
};

export type ResolvedCardPresentation = {
  format: CardPresentationFormat;
  name: string;
  set?: string;
  setCode?: string;
  number?: string;
  rarity?: string;
  condition?: string;
  variant?: string;
  imageUrl?: string;
  imageAlt?: string;
  value?: string;
  delta?: string;
  deltaPeriod?: string;
  dateAdded?: string;
  costBasis?: string;
};

export type CardFormatDisplayOptions = {
  details?: ReactNode;
};

export function resolveCardPresentation({
  format = "market",
  card,
  name,
  set,
  setCode,
  number,
  rarity,
  condition,
  variant,
  imageUrl,
  imageAlt,
  value,
  price,
  delta,
  deltaPeriod,
  dateAdded,
  costBasis
}: CardPresentationBaseProps): ResolvedCardPresentation {
  return {
    format,
    name: name ?? card?.name ?? "Untitled card",
    set: set ?? card?.set,
    setCode: setCode ?? card?.setCode,
    number: number ?? card?.number,
    rarity: rarity ?? card?.rarity,
    condition: condition ?? card?.condition,
    variant: variant ?? card?.variant,
    imageUrl: imageUrl ?? card?.imageUrl,
    imageAlt: imageAlt ?? card?.imageAlt,
    value: value ?? getFormatValue(format, card) ?? price,
    delta: delta ?? card?.delta,
    deltaPeriod: deltaPeriod ?? card?.deltaPeriod,
    dateAdded: dateAdded ?? card?.dateAdded,
    costBasis: costBasis ?? card?.costBasis
  };
}

export function getCardFormatDetails(card: ResolvedCardPresentation, options: CardFormatDisplayOptions = {}) {
  if (options.details) {
    return options.details;
  }

  if (card.format !== "collection") {
    return undefined;
  }

  const details = [card.dateAdded, card.costBasis].filter(Boolean).join(" • ");

  return details || undefined;
}

function getFormatValue(format: CardPresentationFormat, card?: TradingCardData) {
  if (!card) {
    return undefined;
  }

  if (format === "collection") {
    return card.collectionValue ?? card.value;
  }

  return card.marketValue ?? card.value;
}

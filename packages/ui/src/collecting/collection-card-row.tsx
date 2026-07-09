import { CardRow } from "../core/card-row";
import type { TradingCardData } from "../core/card-format";

export type CollectionCardRowProps = {
  card?: TradingCardData;
  name?: string;
  set?: string;
  setCode?: string;
  number?: string;
  rarity?: string;
  condition?: string;
  variant?: string;
  dateAdded?: string;
  costBasis?: string;
  value?: string;
  delta?: string;
  deltaPeriod?: string;
  imageUrl?: string;
  imageAlt?: string;
  active?: boolean;
  onClick?: () => void;
};

export function CollectionCardRow({
  card,
  name,
  set,
  setCode,
  number,
  rarity,
  condition,
  variant,
  dateAdded,
  costBasis,
  value,
  delta,
  deltaPeriod,
  imageUrl,
  imageAlt,
  active,
  onClick
}: CollectionCardRowProps) {
  return (
    <CardRow
      format="collection"
      card={card}
      active={active}
      name={name}
      set={set}
      setCode={setCode}
      number={number}
      rarity={rarity}
      condition={condition}
      variant={variant}
      imageUrl={imageUrl}
      imageAlt={imageAlt}
      value={value}
      delta={delta}
      deltaPeriod={deltaPeriod}
      dateAdded={dateAdded}
      costBasis={costBasis}
      deltaSecondaryDisplay="tooltip"
      className="cs-collection-card-row"
      onClick={onClick}
    />
  );
}

import { CardRow, getTradingCardMetadata } from "../core/card-row";

export type CollectionCardRowProps = {
  name: string;
  set?: string;
  setCode?: string;
  number?: string;
  rarity?: string;
  condition: string;
  variant?: string;
  dateAdded?: string;
  costBasis?: string;
  value: string;
  delta?: string;
  imageUrl?: string;
  imageAlt?: string;
  active?: boolean;
  onClick?: () => void;
};

export function CollectionCardRow({
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
  imageUrl,
  imageAlt,
  active,
  onClick
}: CollectionCardRowProps) {
  const details = [dateAdded, costBasis].filter(Boolean).join(" • ");

  return (
    <CardRow
      active={active}
      name={name}
      imageUrl={imageUrl}
      imageAlt={imageAlt ?? `${name} trading card`}
      metadata={getTradingCardMetadata({ set, setCode, number, rarity, condition, variant })}
      details={details || undefined}
      value={value}
      delta={delta}
      deltaReferenceValue={value}
      deltaSecondaryDisplay="tooltip"
      className="cs-collection-card-row"
      onClick={onClick}
    />
  );
}

import { CardRow, getTradingCardMetadata } from "../core/card-row";
import type { ReactNode } from "react";

export type MarketCardRowProps = {
  name: string;
  set: string;
  setCode?: string;
  number?: string;
  rarity?: string;
  condition?: string;
  price: string;
  delta: string;
  deltaPeriod?: string;
  chart?: ReactNode;
  imageUrl?: string;
  imageAlt?: string;
  active?: boolean;
  onClick?: () => void;
};

export function MarketCardRow({
  name,
  set,
  setCode,
  number,
  rarity,
  condition,
  price,
  delta,
  deltaPeriod,
  chart,
  imageUrl,
  imageAlt,
  active,
  onClick
}: MarketCardRowProps) {
  return (
    <CardRow
      active={active}
      name={name}
      imageUrl={imageUrl}
      imageAlt={imageAlt}
      metadata={getTradingCardMetadata({ set, setCode, number, rarity, condition })}
      value={price}
      delta={delta}
      deltaReferenceValue={price}
      deltaPeriod={deltaPeriod}
      chart={chart}
      className="cs-market-card-row"
      onClick={onClick}
    />
  );
}

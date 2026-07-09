import { formatConditionLabel } from "./condition";
import { CardBadgeTypeView } from "./card-resource";
import { getSetShortText } from "./metadata";
import { getRarityAcronym, MetadataTooltip, RarityMark, RarityTooltipLabel } from "./rarity";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { ConditionLabelMode } from "./condition";
import type { TcgVariant } from "./rarity";

export type BadgeDisplay = "compact" | "full";
export type CardBadgeType = "set" | "number" | "rarity" | "condition" | "foil" | "language" | "type";

export type CardBadgeCard = {
  set?: string;
  setCode?: string;
  number?: string;
  rarity?: string;
  condition?: string;
  finish?: string;
  finishCode?: string;
  language?: string;
  series?: string;
  type?: string;
  types?: string[];
};

export type SetBadgeProps = {
  set: string;
  code?: string;
  display?: BadgeDisplay;
  series?: string;
  showSeries?: boolean;
  tooltip?: boolean;
  className?: string;
};

export type CardNumberBadgeProps = {
  number: string;
  display?: BadgeDisplay;
  tooltip?: boolean;
  className?: string;
};

export type RarityBadgeProps = {
  rarity: string;
  display?: "mark" | "code" | "mark-code" | "mark-label" | "label";
  tooltip?: boolean;
  variant?: TcgVariant;
  className?: string;
};

export type ConditionBadgeProps = {
  condition: string;
  display?: ConditionLabelMode;
  tooltip?: boolean;
  className?: string;
};

export type FoilBadgeProps = {
  finish: string;
  tooltip?: boolean;
  className?: string;
} & ({ code: string; display?: "compact" } | { code?: string; display: "full" });

export type LanguageBadgeProps = {
  language?: string;
  display?: "code" | "label";
  tooltip?: boolean;
  className?: string;
};

export type TypeBadgeProps = {
  value: string;
  display?: "mark" | "label" | "mark-label";
  tooltip?: boolean;
  variant?: TcgVariant;
  className?: string;
};

export type CardBadgeProps =
  | ({ type: "set"; card?: CardBadgeCard } & Partial<SetBadgeProps>)
  | ({ type: "number"; card?: CardBadgeCard } & Partial<CardNumberBadgeProps>)
  | ({ type: "rarity"; card?: CardBadgeCard } & Partial<RarityBadgeProps>)
  | ({ type: "condition"; card?: CardBadgeCard } & Partial<ConditionBadgeProps>)
  | ({ type: "foil"; card?: CardBadgeCard } & Partial<FoilBadgeProps>)
  | ({ type: "language"; card?: CardBadgeCard } & Partial<LanguageBadgeProps>)
  | ({ type: "type"; card?: CardBadgeCard } & Partial<TypeBadgeProps>);

export type CardBadgeStackProps = ComponentPropsWithoutRef<"span"> & {
  children: ReactNode;
  className?: string;
};

export function CardBadge(props: CardBadgeProps) {
  switch (props.type) {
    case "set": {
      const set = props.set ?? props.card?.set;

      if (!set) {
        return null;
      }

      return (
        <SetBadgeView
          set={set}
          code={props.code ?? props.card?.setCode}
          display={props.display}
          series={props.series ?? props.card?.series}
          showSeries={props.showSeries}
          tooltip={props.tooltip}
          className={props.className}
        />
      );
    }
    case "number": {
      const number = props.number ?? props.card?.number;

      if (!number) {
        return null;
      }

      return (
        <CardNumberBadgeView
          number={number}
          display={props.display}
          tooltip={props.tooltip}
          className={props.className}
        />
      );
    }
    case "rarity": {
      const rarity = props.rarity ?? props.card?.rarity;

      if (!rarity) {
        return null;
      }

      return (
        <RarityBadgeView
          rarity={rarity}
          display={props.display}
          tooltip={props.tooltip}
          variant={props.variant}
          className={props.className}
        />
      );
    }
    case "condition": {
      const condition = props.condition ?? props.card?.condition;

      if (!condition) {
        return null;
      }

      return (
        <ConditionBadgeView
          condition={condition}
          display={props.display}
          tooltip={props.tooltip}
          className={props.className}
        />
      );
    }
    case "foil": {
      const finish = props.finish ?? props.card?.finish;

      if (!finish) {
        return null;
      }

      return (
        <FoilBadgeView
          finish={finish}
          code={props.code ?? props.card?.finishCode}
          display={props.display}
          tooltip={props.tooltip}
          className={props.className}
        />
      );
    }
    case "language": {
      return (
        <LanguageBadgeView
          language={props.language ?? props.card?.language}
          display={props.display}
          tooltip={props.tooltip}
          className={props.className}
        />
      );
    }
    case "type": {
      const cardType = props.value ?? props.card?.type ?? props.card?.types?.[0];

      if (!cardType) {
        return null;
      }

      return (
        <CardBadgeTypeView
          type={cardType}
          display={props.display}
          tooltip={props.tooltip}
          variant={props.variant}
          className={props.className}
        />
      );
    }
    default:
      return null;
  }
}

export function SetBadge(props: SetBadgeProps) {
  return <CardBadge type="set" {...props} />;
}

function SetBadgeView({
  set,
  code,
  display = "compact",
  series,
  showSeries = true,
  tooltip = true,
  className
}: SetBadgeProps) {
  const displaySet = showSeries ? set : getSetNameWithoutSeries(set, series);
  const shortText = getSetShortText(displaySet, code);
  const displayText = display === "compact" ? shortText : displaySet;
  const tooltipLabel = <BadgeTooltipLabel className="cs-set-badge cs-set-name">{set}</BadgeTooltipLabel>;

  return (
    <MetadataBadge
      label={tooltipLabel}
      className={["cs-set-badge", "cs-set-name", className].filter(Boolean).join(" ")}
      disabled={!tooltip || displayText === set}
    >
      {displayText}
    </MetadataBadge>
  );
}

function getSetNameWithoutSeries(set: string, series?: string) {
  const normalizedSeries = series?.trim();

  if (!normalizedSeries) {
    return set;
  }

  const normalizedSet = set.trim();
  const lowerSet = normalizedSet.toLowerCase();
  const lowerSeries = normalizedSeries.toLowerCase();

  if (lowerSet === lowerSeries) {
    return normalizedSet;
  }

  if (!lowerSet.startsWith(`${lowerSeries} `)) {
    return set;
  }

  return normalizedSet.slice(normalizedSeries.length).trimStart();
}

export function CardNumberBadge(props: CardNumberBadgeProps) {
  return <CardBadge type="number" {...props} />;
}

function CardNumberBadgeView({ number, display = "compact", tooltip = true, className }: CardNumberBadgeProps) {
  const [cardNumber, setTotal] = number.split("/");
  const displayText = display === "compact" ? `#${cardNumber}` : setTotal ? `#${cardNumber}/${setTotal}` : `#${cardNumber}`;
  const tooltipLabel = <BadgeTooltipLabel className="cs-card-number-badge">{getCardNumberLabel(cardNumber, setTotal)}</BadgeTooltipLabel>;

  return (
    <MetadataBadge
      label={tooltipLabel}
      className={["cs-card-number-badge", className].filter(Boolean).join(" ")}
      disabled={!tooltip}
    >
      {displayText}
    </MetadataBadge>
  );
}

export function RarityBadge(props: RarityBadgeProps) {
  return <CardBadge type="rarity" {...props} />;
}

function RarityBadgeView({ rarity, display = "mark", tooltip = true, variant = "pokemon", className }: RarityBadgeProps) {
  const code = getRarityAcronym(rarity);
  const content = getRarityBadgeContent(rarity, code, display, variant);

  return (
    <MetadataBadge
      label={<RarityTooltipLabel rarity={rarity} variant={variant} />}
      className={["cs-rarity-badge", className].filter(Boolean).join(" ")}
      disabled={!tooltip}
    >
      {content}
    </MetadataBadge>
  );
}

export function ConditionBadge(props: ConditionBadgeProps) {
  return <CardBadge type="condition" {...props} />;
}

function ConditionBadgeView({
  condition,
  display = "code",
  tooltip = true,
  className
}: ConditionBadgeProps) {
  const displayText = formatConditionLabel(condition, display);
  const tooltipLabel = formatConditionLabel(condition, "label");

  return (
    <MetadataBadge
      label={<BadgeTooltipLabel className="cs-condition-badge">{tooltipLabel}</BadgeTooltipLabel>}
      className={["cs-condition-badge", className].filter(Boolean).join(" ")}
      disabled={!tooltip || displayText === tooltipLabel}
    >
      {displayText}
    </MetadataBadge>
  );
}

export function FoilBadge(props: FoilBadgeProps) {
  return <CardBadge type="foil" {...props} />;
}

function FoilBadgeView({ finish, code, display = "compact", tooltip = true, className }: {
  finish: string;
  code?: string;
  display?: "compact" | "full";
  tooltip?: boolean;
  className?: string;
}) {
  const displayText = display === "compact" ? code ?? finish : finish;

  return (
    <MetadataBadge
      label={<BadgeTooltipLabel className="cs-foil-badge">{finish}</BadgeTooltipLabel>}
      className={["cs-foil-badge", className].filter(Boolean).join(" ")}
      disabled={!tooltip || displayText === finish}
    >
      {displayText}
    </MetadataBadge>
  );
}

export function LanguageBadge(props: LanguageBadgeProps) {
  return <CardBadge type="language" {...props} />;
}

function LanguageBadgeView({ language, display = "code", tooltip = true, className }: LanguageBadgeProps) {
  const languageCode = getLanguageCode(language);
  const languageLabel = formatLanguageLabel(language);
  const displayText = display === "label" ? languageLabel : languageCode;

  return (
    <MetadataBadge
      label={<BadgeTooltipLabel className="cs-language-badge">{languageLabel}</BadgeTooltipLabel>}
      className={["cs-language-badge", className].filter(Boolean).join(" ")}
      disabled={!tooltip || displayText === languageLabel}
    >
      {displayText}
    </MetadataBadge>
  );
}

export function CardBadgeStack({ children, className, ...props }: CardBadgeStackProps) {
  return (
    <span className={["cs-card-badge-stack", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </span>
  );
}

function MetadataBadge({
  label,
  className,
  disabled,
  children
}: {
  label: ReactNode;
  className?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <MetadataTooltip label={label} className={["cs-metadata-badge", className].filter(Boolean).join(" ")} disabled={disabled}>
      {children}
    </MetadataTooltip>
  );
}

function BadgeTooltipLabel({ className, children }: { className: string; children: ReactNode }) {
  return <span className={["cs-metadata-badge", className].filter(Boolean).join(" ")}>{children}</span>;
}

function getRarityBadgeContent(
  rarity: string,
  code: string,
  display: NonNullable<RarityBadgeProps["display"]>,
  variant: TcgVariant
) {
  switch (display) {
    case "code":
      return <span className="cs-rarity-badge-text">{code}</span>;
    case "mark-code":
      return (
        <>
          <RarityMark rarity={rarity} variant={variant} tooltip={false} />
          <span className="cs-rarity-badge-text">{code}</span>
        </>
      );
    case "mark-label":
      return (
        <>
          <RarityMark rarity={rarity} variant={variant} tooltip={false} />
          <span className="cs-rarity-badge-text">{rarity}</span>
        </>
      );
    case "label":
      return <span className="cs-rarity-badge-text">{rarity}</span>;
    case "mark":
    default:
      return <RarityMark rarity={rarity} variant={variant} tooltip={false} />;
  }
}

function getCardNumberLabel(cardNumber: string, setTotal?: string) {
  return setTotal ? `Card #${cardNumber} of ${setTotal}` : `Card #${cardNumber}`;
}

function getLanguageCode(language?: string) {
  return (language ?? "EN").toUpperCase();
}

export function formatLanguageLabel(language?: string) {
  const labels: Record<string, string> = {
    EN: "English",
    ES: "Spanish",
    FR: "French",
    DE: "German",
    IT: "Italian",
    JA: "Japanese",
    JP: "Japanese",
    KO: "Korean",
    PT: "Portuguese",
    ZH: "Chinese"
  };

  const languageCode = getLanguageCode(language);

  return labels[languageCode] ?? languageCode;
}

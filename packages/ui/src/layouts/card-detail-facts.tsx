import { CardBadge } from "../core/badges";
import { CardResourceIcon } from "../core/card-resource";
import type { CardResourceType } from "../core/card-resource";
import type { Key, ReactNode } from "react";

type CardDetailFactBase = {
  id?: Key;
  label?: string;
};

export type CardDetailFact = CardDetailFactBase & ({
  kind: "text";
  label: string;
  value: ReactNode;
} | {
  kind: "type" | "weakness" | "rules";
  value: string;
});

const DEFAULT_FACT_LABELS: Record<Exclude<CardDetailFact["kind"], "text">, string> = {
  type: "Type",
  weakness: "Weakness",
  rules: "Rules"
};

const CARD_DETAIL_RESOURCE_TYPES = new Set<CardResourceType>([
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
]);

export function DetailFacts({ facts }: { facts: CardDetailFact[] }) {
  return (
    <section className="cs-card-facts-panel cs-card-facts-detail" aria-label="Details">
      <h3>Details</h3>
      <dl className="cs-card-facts" aria-label="Card facts">
        {facts.map((fact, index) => {
          const label = fact.label ?? DEFAULT_FACT_LABELS[fact.kind as Exclude<CardDetailFact["kind"], "text">];

          return (
            <div
              className="cs-card-fact"
              data-section-start={fact.kind === "rules" ? "true" : undefined}
              key={fact.id ?? `${fact.kind}-${label}-${index}`}
            >
              <dt>{label}</dt>
              <dd>{renderCardFactValue(fact)}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

function renderCardFactValue(fact: CardDetailFact) {
  if (fact.kind === "rules") {
    return <NumberedCardRules value={fact.value} />;
  }

  if (fact.kind === "type") {
    return <CardBadge type="type" value={fact.value} />;
  }

  if (fact.kind === "weakness") {
    const weakness = parseResourceMultiplier(fact.value);

    if (weakness) {
      return (
        <span className="cs-energy-cost" aria-label={fact.value}>
          {Array.from({ length: weakness.count }, (_, index) => (
            <CardResourceIcon
              decorative
              key={`${weakness.resourceType}-${index}`}
              resourceType={weakness.resourceType}
              tooltip={false}
            />
          ))}
        </span>
      );
    }
  }

  return fact.value;
}

function parseResourceMultiplier(value: string) {
  const match = value.trim().match(/^([a-z]+)\s+x(\d+)$/i);

  if (!match) return null;

  const resourceType = `${match[1][0].toUpperCase()}${match[1].slice(1).toLowerCase()}` as CardResourceType;
  const count = Number(match[2]);

  if (!CARD_DETAIL_RESOURCE_TYPES.has(resourceType) || !Number.isSafeInteger(count) || count < 1 || count > 10) {
    return null;
  }

  return { count, resourceType };
}

function NumberedCardRules({ value }: { value: string }) {
  const rules = splitCardRules(value);

  if (rules.length <= 1) {
    return value;
  }

  return (
    <ol className="cs-card-rule-list">
      {rules.map((rule, index) => (
        <li key={`${rule}-${index}`}>{rule}</li>
      ))}
    </ol>
  );
}

function splitCardRules(value: string) {
  return value
    .split(/(?<=\.)\s+(?=[A-Z0-9])/)
    .map((rule) => rule.trim())
    .filter(Boolean);
}

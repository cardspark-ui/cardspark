# @cardspark/ui

React UI components for Pokémon card, collection, and USD market experiences.

The package is organized by workflow lane. Prefer lane imports over the root aggregate when writing application code.

Phase 1 intentionally targets Pokémon metadata and preformatted USD display values. Additional games, currencies, and locale-aware value models are planned as later adapters rather than baked into the initial component contracts.

## Setup

Install the package:

```sh
npm install @cardspark/ui
```

Import tokens first, then a theme, then component styles.

```ts
import "@cardspark/ui/tokens.css";
import "@cardspark/ui/themes/basement.css";
import "@cardspark/ui/styles.css";
```

Available CSS entrypoints:

- `@cardspark/ui/styles.css`
- `@cardspark/ui/tokens.css`
- `@cardspark/ui/themes/basement.css`

## Import Paths

```ts
import { CardStack, CardTile, FilterBar } from "@cardspark/ui/core";
import { CollectionSummary, SetSummary } from "@cardspark/ui/collecting";
import { resolveMarketHistoryDataSet } from "@cardspark/ui/market";
import { CardList, CardDetail } from "@cardspark/ui/layouts";
import { formatConditionLabel, formatCurrency } from "@cardspark/ui/utils";
```

The root `@cardspark/ui` export re-exports all component lanes for convenience. Use `@cardspark/ui/utils` or `@cardspark/ui/market` for server-safe helpers.

## Card Data

Every canonical `TradingCardData` object requires a stable `id` and `name`. Components that render arrays use the ID for React identity, so it must remain stable across filtering and sorting. Direct presentation props remain available for one-off `CardRow` and `CardTile` instances.

Phase 1 monetary props such as `value`, `marketValue`, `price`, and `costBasis` are preformatted USD display strings. Numeric history series remain numbers and are formatted by the package.

## Core

Use `@cardspark/ui/core` for reusable card and metadata primitives.

Available components and helpers:

- `CardGrid`, `CardTile`
- `CardStack`, `CardRow`
- `CardArt`
- `CardBadge`, `CardBadgeStack`
- `RarityMark`
- `FilterBar`
- `formatConditionLabel`, `getConditionAcronym`
- `formatCurrency`, `formatDeltaFromReference`, `parseCurrencyLabel`

The helpers remain available from `core` for compatibility; prefer `@cardspark/ui/utils` when calling them in server code.

Example:

```tsx
import { CardGrid, CardStack, CardRow, CardTile } from "@cardspark/ui/core";

export function CollectionGrid({ cards }) {
  return (
    <CardGrid columns={4}>
      {cards.map((card) => (
        <CardTile
          key={card.id}
          format="market"
          card={card}
          value={card.marketValue}
        />
      ))}
    </CardGrid>
  );
}
```

```tsx
export function WatchlistRows({ cards }) {
  return (
    <CardStack>
      {cards.map((card) => (
        <CardRow key={card.id} format="market" card={card} />
      ))}
    </CardStack>
  );
}
```

Condition labels use one shared convention. Import helpers from the server-safe utility entrypoint when they are called outside a Client Component:

```ts
import { formatConditionLabel } from "@cardspark/ui/utils";

formatConditionLabel("Lightly Played", "code"); // "LP"
formatConditionLabel("Lightly Played", "label"); // "Lightly Played"
formatConditionLabel("Lightly Played", "code-label"); // "LP - Lightly Played"
```

## Collecting

Use `@cardspark/ui/collecting` for ownership and collection progress surfaces.

Available components:

- `CollectionSummary`
- `SetSummary`

Example:

```tsx
import { SetSummary } from "@cardspark/ui/collecting";

<SetSummary
  name="Scarlet & Violet 151"
  code="MEW"
  owned={142}
  total={207}
  missingCards={missingCards}
  chaseCards={chaseCards}
/>;
```

Card preview arrays such as `missingCards` and `chaseCards` require a stable `id` on every item.

## Market

Use `@cardspark/ui/market` for market-history selection helpers used alongside the higher-order card components.

Available components and helpers:

- `resolveMarketHistoryDataSet`
- `getMarketHistoryGraderValue`, `getMarketHistoryGraderValues`
- `getNumericGradeValue`, `isUngradedGrader`

Example:

```tsx
import { CardRow } from "@cardspark/ui/core";

<CardRow
  format="market"
  card={{
    id: "swsh12-186",
    name: "Lugia V",
    set: "Silver Tempest",
    setCode: "SIT",
    number: "186/195",
    rarity: "Special Illustration Rare",
    condition: "Near Mint",
    marketValue: "$214.75",
    delta: "+5.4%",
    imageUrl: "https://images.pokemontcg.io/swsh12/186_hires.png"
  }}
/>;
```

## Layouts

Use `@cardspark/ui/layouts` for composed product surfaces.

Available layouts:

- `CardList`
- `CardDetail`

`CardList` composes `FilterBar` with a switchable `CardGrid` and `CardStack` surface for collection, set, and search views.

Use `onCardClick={(card, index, event) => ...}` for shared card navigation in both views. `renderTile` and `renderRow` remain available when a view needs fully custom rendering.

`CardDetail` requires only card identity. Facts, collection state, and market history are independent optional sections. Facts use explicit kinds, and condition and grade selections have separate state.

```tsx
<CardDetail
  card={{
    id: "swsh12-186",
    name: "Lugia V",
    set: "Silver Tempest",
    setCode: "SIT",
    number: "186/195",
    rarity: "Special Illustration Rare",
    imageUrl: "https://images.pokemontcg.io/swsh12/186_hires.png"
  }}
  facts={[
    { kind: "type", value: "Colorless" },
    { kind: "weakness", value: "Lightning x2" },
    { kind: "rules", value: "This Pokémon cannot attack during your next turn." }
  ]}
  graders={["Ungraded", "PSA"]}
  activeGrader="Ungraded"
  conditions={["Near Mint", "Lightly Played"]}
  activeCondition="Near Mint"
  variants={["Normal", "Holo"]}
  activeVariant="Holo"
  market={{ label: "Market price", price: "$214.75", deltaToday: "+5.4%" }}
  history={{ values: [201.5, 208.25, 214.75], range: "1M", ranges: ["1W", "1M", "1Y"] }}
  onConditionChange={setCondition}
  onGradeChange={setGrade}
/>
```

## Filters

Use `FilterBar` for compact source, condition, grader, finish, sort, and inventory filters.

```tsx
import { FilterBar } from "@cardspark/ui/core";
import { formatConditionLabel } from "@cardspark/ui/utils";
import type { FilterBarItem } from "@cardspark/ui/core";

const conditionOptions = ["Near Mint", "Lightly Played", "Damaged"].map((condition) => ({
  value: condition,
  label: formatConditionLabel(condition, "code-label"),
  compactLabel: formatConditionLabel(condition, "code")
}));

const filters: FilterBarItem[] = [
  { id: "source", label: "Source", value: "All", options: ["All", "TCGPlayer", "Ebay"] },
  {
    id: "condition",
    label: "Condition",
    multiple: true,
    values: ["Lightly Played"],
    options: ["All", ...conditionOptions],
    compact: true
  }
];

<FilterBar filters={filters} onChange={(id, selection) => updateFilter(id, selection)} />;
```

`multiple: true` requires `values`; single-select filters require `value`. The `onChange` selection is correspondingly `string[]` or `string`. Use `allOptionValue` when the universal option has a value other than `"All"`.

## React And Next.js Notes

- Components require `react >= 18` and are published as Client Components.
- Server Components may render them with serializable props, but event handlers must originate in a Client Component.
- `@cardspark/ui/utils` and `@cardspark/ui/market` are server-safe and may be called directly from Server Components.
- Major surface components forward their root-element ref and accept the corresponding native DOM props for focus, measurement, analytics, and test selectors.

## Theming

Cardspark themes are CSS variable packs. Override semantic `--cs-*` tokens for custom app themes.

```css
[data-cardspark-theme="my-theme"] {
  --cs-color-canvas: #0b0b0c;
  --cs-color-text: #f4f4f5;
  --cs-color-positive: #ccff00;
  --cs-color-border: #2a2a2f;

  --cs-radius-sm: 4px;
  --cs-radius-md: 8px;
  --cs-border-width: 1px;

  --cs-panel-padding: 1rem;
  --cs-panel-padding-lg: 1.25rem;
  --cs-card-row-padding: 1rem;
  --cs-filter-menu-option-padding: 0.75rem;
  --cs-value-panel-chart-height: 180px;
  --cs-detail-padding: 2rem;
}
```

Token tiers:

- Core scale: `--cs-space-*`, `--cs-text-*`, `--cs-leading-*`, `--cs-radius-*`, `--cs-border-*`, `--cs-shadow-*`, `--cs-duration-*`, `--cs-ease-*`
- Semantic surfaces: `--cs-color-*`, `--cs-panel-*`, `--cs-content-*`, `--cs-control-*`, `--cs-action-*`, `--cs-selection-*`, `--cs-tooltip-*`
- Component escapes: layout knobs such as `--cs-card-grid-min-column`, `--cs-card-row-thumbnail-width`, `--cs-filter-menu-max-height`, `--cs-value-panel-chart-height`, `--cs-detail-padding`

Start themes from the core scale and semantic surfaces. Use component escapes only when a specific component needs different layout density or sizing.

Scope a theme with `data-cardspark-theme`:

```tsx
<section data-cardspark-theme="basement">
  <CardTile card={card} />
</section>
```

See `docs/theming.md` in the repo for the full token guidance.

## License

Cardspark UI is free for personal, hobby, research, and other noncommercial use under the PolyForm Noncommercial License 1.0.0. Commercial use is not permitted under this license.

Pokemon-themed compatibility assets are included for hobby and noncommercial TCG interfaces. Pokemon and related marks, card graphics, symbols, and copyrights belong to their respective rights holders. Cardspark is not affiliated with, endorsed by, sponsored by, or approved by The Pokemon Company, Nintendo, Game Freak, or Creatures.

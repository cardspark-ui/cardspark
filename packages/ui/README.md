# @cardspark/ui

React UI components for TCG card, collection, and market experiences.

The package is organized by workflow lane. Prefer lane imports over the root aggregate when writing application code.

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
import { CardTile, FilterBar } from "@cardspark/ui/core";
import { CollectionValuePanel, SetProgress } from "@cardspark/ui/collecting";
import { MarketCardRow, MarketSparkline, PriceBadge } from "@cardspark/ui/market";
import { CardDetailView } from "@cardspark/ui/layouts";
```

The root `@cardspark/ui` export re-exports all lanes for convenience.

## Core

Use `@cardspark/ui/core` for reusable card and metadata primitives.

Available components and helpers:

- `CardGrid`, `CardTile`
- `CardRow`
- `CardImage`
- `CardMetadataBadges`
- `SetBadge`, `CardNumberBadge`, `RarityBadge`, `ConditionBadge`, `FoilBadge`, `LanguageBadge`, `CardTypeBadge`
- `RarityMark`, `RarityTooltipLabel`, `MetadataTooltip`
- `DeltaValue`
- `FilterBar`
- `formatConditionLabel`, `getConditionAcronym`
- `formatCurrency`, `formatDeltaFromReference`, `parseCurrencyLabel`

Example:

```tsx
import { CardGrid, CardTile } from "@cardspark/ui/core";

export function CollectionGrid({ cards }) {
  return (
    <CardGrid columns={4}>
      {cards.map((card) => (
        <CardTile
          key={card.id}
          name={card.name}
          set={card.set}
          setCode={card.setCode}
          number={card.number}
          rarity={card.rarity}
          condition={card.condition}
          price={card.price}
          delta={card.delta}
          imageUrl={card.imageUrl}
        />
      ))}
    </CardGrid>
  );
}
```

Condition labels use one shared convention:

```ts
formatConditionLabel("Lightly Played", "code"); // "LP"
formatConditionLabel("Lightly Played", "label"); // "Lightly Played"
formatConditionLabel("Lightly Played", "code-label"); // "LP - Lightly Played"
```

## Collecting

Use `@cardspark/ui/collecting` for ownership and collection progress surfaces.

Available components:

- `CollectionCardRow`
- `CollectionSummaryPanel`
- `CollectionValuePanel`
- `SetProgress`
- `CardCollectionPanel`

Example:

```tsx
import { SetProgress } from "@cardspark/ui/collecting";

<SetProgress
  name="Scarlet & Violet 151"
  code="MEW"
  owned={142}
  total={207}
  missingCards={missingCards}
  chaseCards={chaseCards}
/>;
```

## Market

Use `@cardspark/ui/market` for price movement, market rows, sparklines, and history selection helpers.

Available components and helpers:

- `MarketCardRow`
- `MarketSparkline`
- `PriceBadge`
- `CardMarketPanel`
- `PriceHistoryPanel`
- `resolveMarketHistoryDataSet`
- `getMarketHistoryGraderValue`, `getMarketHistoryGraderValues`
- `getNumericGradeValue`, `isUngradedGrader`

Example:

```tsx
import { MarketCardRow, MarketSparkline } from "@cardspark/ui/market";

<MarketCardRow
  name="Lugia V"
  set="Silver Tempest"
  setCode="SIT"
  number="186/195"
  rarity="Special Illustration Rare"
  condition="Near Mint"
  price="$214.75"
  delta="+5.4%"
  imageUrl="https://images.pokemontcg.io/swsh12/186_hires.png"
  chart={<MarketSparkline values={[18, 19, 21, 20, 23, 24, 27]} />}
/>;
```

## Layouts

Use `@cardspark/ui/layouts` for composed product surfaces.

Available layouts:

- `CardDetailView`
- `CardDetailLayout`

`CardDetailView` expects card identity, facts, market data, history data, and collection state.

## Filters

Use `FilterBar` for compact source, condition, grader, finish, sort, and inventory filters.

```tsx
import { FilterBar, formatConditionLabel } from "@cardspark/ui/core";

const conditionOptions = ["Near Mint", "Lightly Played", "Damaged"].map((condition) => ({
  value: condition,
  label: formatConditionLabel(condition, "code-label"),
  compactLabel: formatConditionLabel(condition, "code")
}));

<FilterBar
  filters={[
    { id: "source", label: "Source", value: "All", options: ["All", "TCGPlayer", "Ebay"] },
    { id: "condition", label: "Condition", value: "Lightly Played", options: conditionOptions, compact: true }
  ]}
  onFilterChange={(id, value) => setFilters((filters) => ({ ...filters, [id]: value }))}
/>;
```

## React And Next.js Notes

- Components are React components and require `react >= 18`.
- Components with event handlers must be rendered from a Client Component in Next.js.
- Do not pass event handlers from a Server Component into `FilterBar`, `CardRow`, `MarketCardRow`, `CollectionCardRow`, or `SetProgress`.
- It is safe to render passive rows/cards from Server Components when no event handler props are supplied.

## Theming

Cardspark themes are CSS variable packs. Override semantic `--cs-*` tokens for custom app themes.

```css
[data-cardspark-theme="my-theme"] {
  --cs-color-canvas: #0b0b0c;
  --cs-color-text: #f4f4f5;
  --cs-color-positive: #ccff00;
}
```

Scope a theme with `data-cardspark-theme`:

```tsx
<section data-cardspark-theme="basement">
  <CardTile {...card} />
</section>
```

See `docs/theming.md` in the repo for the full token guidance.

## License

Cardspark UI is free for personal, hobby, research, and other noncommercial use under the PolyForm Noncommercial License 1.0.0. Commercial use is not permitted under this license.

Pokemon-themed compatibility assets are included for hobby and noncommercial TCG interfaces. Pokemon and related marks, card graphics, symbols, and copyrights belong to their respective rights holders. Cardspark is not affiliated with, endorsed by, sponsored by, or approved by The Pokemon Company, Nintendo, Game Freak, or Creatures.

# Cardspark UI Theming

Cardspark themes are CSS variable packs. Components consume semantic `--cs-*` tokens and expose state with `data-*` attributes, so teams can customize the system without copying component source.

## Import Order

Import tokens first, then one theme, then component styles.

```ts
import "@cardspark/ui/tokens.css";
import "@cardspark/ui/themes/basement.css";
import "@cardspark/ui/styles.css";
```

Available theme entrypoints:

- `@cardspark/ui/themes/basement.css`

Use `data-cardspark-theme` when a theme should be scoped to part of an app.

```tsx
<section data-cardspark-theme="basement">
  <CardTile {...card} />
</section>
```

## Cascade Layers

Cardspark CSS uses these layers:

```css
@layer cardspark.tokens, cardspark.theme, cardspark.components;
```

Consumer CSS can remain unlayered for the simplest override path, or define a later local layer after importing Cardspark.

```css
:root {
  --cs-color-positive: #22c55e;
  --cs-radius-md: 6px;
}
```

## Token Contract

Cardspark tokens are organized into three tiers. Treat them like a narrow utility system: start with the reusable scale, map semantic surfaces to it, and use component escape hatches only when a layout needs a specific adjustment.

### 1. Core Scale

Core tokens define the reusable design language. They should work for existing components and future components.

- Spacing: `--cs-space-*`
- Type size: `--cs-text-*`
- Line height: `--cs-leading-*`
- Radius: `--cs-radius-*`
- Borders: `--cs-border-width`, `--cs-border-style`, `--cs-border-subtle`, `--cs-border-strong`
- Shadows: `--cs-shadow-*`
- Motion: `--cs-duration-*`, `--cs-ease-*`
- Letter spacing: `--cs-tracking-*`

### 2. Semantic Surfaces

Semantic tokens describe product surfaces and states. Most themes should primarily override these after setting the core scale.

- Color: `--cs-color-*`
- Panels: `--cs-panel-*`
- Content wells: `--cs-content-*`
- Controls: `--cs-control-*`
- Actions: `--cs-action-*`
- Selection and interaction: `--cs-selection-*`, `--cs-interaction-*`
- Inputs and select controls: `--cs-input-*`, `--cs-title-select-*`
- Tooltips and charts: `--cs-tooltip-*`, `--cs-chart-*`

### 3. Component Escape Hatches

Component tokens are layout-specific knobs. Use them when the core scale and semantic surfaces are not enough.

- Card grids and rows: `--cs-card-grid-min-column`, `--cs-card-row-*`, `--cs-card-tile-*`
- Filters: `--cs-filter-*`
- Value and chart panels: `--cs-value-panel-*`
- Detail layouts: `--cs-detail-*`
- Collection summary: `--cs-collection-summary-*`
- Empty states: `--cs-empty-state-padding`

Avoid starting a theme from component escapes. If many component escapes need overrides to achieve a theme, that usually means a reusable semantic token is missing.

## Example Theme

Themes should override core scale and semantic tokens first:

```css
[data-cardspark-theme="my-shop"] {
  --cs-font-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --cs-font-mono: "IBM Plex Mono", ui-monospace, monospace;

  --cs-space-4: 1rem;
  --cs-space-5: 1.25rem;
  --cs-text-xs: 0.75rem;
  --cs-text-md: 0.875rem;
  --cs-radius-sm: 4px;
  --cs-radius-md: 8px;
  --cs-border-width: 1px;

  --cs-color-canvas: #fbfaf7;
  --cs-color-surface: #ffffff;
  --cs-color-surface-raised: #f2efe8;
  --cs-color-text: #1a1713;
  --cs-color-muted: #776f63;
  --cs-color-muted-strong: #4f473d;
  --cs-color-border: #ded7cb;
  --cs-color-border-strong: #b9ad9d;
  --cs-color-positive: #168a45;
  --cs-color-negative: #b42318;

  --cs-panel-padding: var(--cs-space-4);
  --cs-panel-radius: var(--cs-radius-md);
  --cs-shadow-sm: 0 1px 2px rgb(26 23 19 / 0.08);
  --cs-control-radius: var(--cs-radius-sm);

  /* Optional escape hatch for a denser card detail page. */
  --cs-detail-padding: var(--cs-space-5);
}
```

Primitive palette tokens such as `--cs-gray-950` and `--cs-lime-400` are available for complete theme packs, but application overrides should usually target semantic tokens such as `--cs-color-canvas`, `--cs-color-text`, and `--cs-color-positive`.

## Stable Styling Surface

The stable customization surface is:

- CSS variables beginning with `--cs-`
- public `data-*` states emitted by components
- exported theme files under `@cardspark/ui/themes/*`

Component class names are prefixed with `cs-` and may be useful for app-level refinements, but themes should prefer variables and `data-*` states where possible.

Theme packs may also override panel, content, and control tokens for deeper visual shifts:

- `--cs-panel-background`
- `--cs-panel-border`
- `--cs-panel-radius`
- `--cs-panel-padding`
- `--cs-panel-shadow`
- `--cs-content-background`
- `--cs-content-border`
- `--cs-control-background`
- `--cs-control-border`
- `--cs-control-radius`
- `--cs-control-min-height`
- `--cs-control-shadow`
- `--cs-control-shadow-active`
- `--cs-input-background`
- `--cs-input-shadow`

Examples of supported state hooks:

- `[data-active="true"]`
- `[data-interactive="true"]`
- `[data-status="loading"]`
- `[data-status="error"]`
- `[data-price-position="below-market"]`
- `[data-tone="positive"]`
- `[data-tone="negative"]`

## Theme Authoring Rule

A good Cardspark theme should change the product mood without changing the component API. If a desired visual change requires modifying component markup, it is probably a missing token or missing state hook.

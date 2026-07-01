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

Themes should override semantic tokens first:

```css
[data-cardspark-theme="my-shop"] {
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
  --cs-radius-md: 6px;
  --cs-shadow-sm: 0 1px 2px rgb(26 23 19 / 0.08);
}
```

Primitive tokens such as `--cs-gray-950` and `--cs-lime-400` are available for complete theme packs, but application overrides should usually target semantic tokens such as `--cs-color-canvas`, `--cs-color-text`, and `--cs-color-positive`.

## Stable Styling Surface

The stable customization surface is:

- CSS variables beginning with `--cs-`
- public `data-*` states emitted by components
- exported theme files under `@cardspark/ui/themes/*`

Component class names are prefixed with `cs-` and may be useful for app-level refinements, but themes should prefer variables and `data-*` states where possible.

Theme packs may also override panel and control tokens for deeper visual shifts:

- `--cs-panel-background`
- `--cs-panel-shadow`
- `--cs-control-background`
- `--cs-control-border`
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

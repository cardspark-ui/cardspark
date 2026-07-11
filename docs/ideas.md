# Ideas

These are promising directions kept for future reference. They are not part of
the current roadmap unless promoted into active work.

## Cardspark CLI and Next.js Starter

Offer a CLI that turns Cardspark from a component package into a ready-to-use
Next.js application:

```bash
npm create cardspark@latest my-collection
```

The value should go beyond wrapping `create-next-app`. It should encode a
known-good Cardspark application shape:

- A supported Next.js, React, and CSS baseline.
- `@cardspark/ui` installed and themed correctly.
- Fonts, providers, global styles, and asset handling already connected.
- A coherent responsive shell and navigation.
- Optional catalog, collection, and card-detail examples.
- Pokémon and USD sample content, while keeping the underlying model open to
  future games and currencies.
- Reproducible, mutually compatible dependency versions.

Generated code should stay small, legible, and clearly owned by the user. Avoid
hiding a large proprietary framework inside the template.

### Existing applications

Support adoption in existing Next.js projects through a separate command:

```bash
npx cardspark init
```

This command could inspect the project, add the package and required setup, and
report conflicts rather than overwriting existing configuration. A later
`cardspark doctor` command could diagnose dependency, export, styling, and
framework compatibility problems.

### Optional Popmelt setup

The scaffold could detect installed AI coding CLIs and offer Popmelt as an
explicit opt-in:

```text
AI coding CLI detected: Codex
Enable visual collaboration with Popmelt? (Y/n)
```

If accepted, setup would:

- Install a compatible Popmelt release.
- Add the client integration.
- Wrap the development command.
- Explain what `.popmelt` stores and what is ignored or shared.
- Make local-first and privacy behavior explicit.
- Avoid requiring an account or hosted service.

Popmelt should feel like a useful capability, not bundled promotion. It should
never surprise-install agent tooling or start opaque background services.

The resulting product path would be:

```text
Cardspark UI
  -> Cardspark CLI: shortest path to a working product
  -> optional Popmelt: collaborative product-memory layer
```

### Sequencing

Build the component test baseline before committing to the CLI. Scaffolding
amplifies every package contract, so exports, styles, client/server boundaries,
peer dependencies, and framework compatibility should be protected first.

Once introduced, the generated starter should become a high-value integration
fixture in CI:

1. Scaffold a fresh application.
2. Install its dependencies.
3. Typecheck it.
4. Build it.
5. Launch it and smoke-test representative routes.

This could become a stronger onboarding surface than documentation alone:
someone can experience Cardspark in about a minute, while Popmelt appears at
the moment its visual collaboration model is easiest to understand.


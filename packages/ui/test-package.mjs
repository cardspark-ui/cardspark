import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const packageRoot = import.meta.dirname;
const npmCache = join(tmpdir(), "cardspark-ui-npm-cache");
const consumerRoot = mkdtempSync(join(tmpdir(), "cardspark-ui-consumer-"));

try {
  execFileSync("npm", ["pack", "--ignore-scripts", "--silent", "--pack-destination", consumerRoot, "--cache", npmCache], {
    cwd: packageRoot,
    stdio: "pipe"
  });
  const archiveName = readdirSync(consumerRoot).find((fileName) => fileName.endsWith(".tgz"));
  if (!archiveName) throw new Error("npm pack did not create a tarball");
  const tarball = join(consumerRoot, archiveName);

  writeFileSync(
    join(consumerRoot, "package.json"),
    JSON.stringify({ name: "cardspark-ui-consumer", private: true, type: "module" }, null, 2)
  );
  execFileSync("npm", ["install", "--ignore-scripts", "--cache", npmCache, tarball, "react@19", "react-dom@19"], {
    cwd: consumerRoot,
    stdio: "pipe"
  });

  writeFileSync(
    join(consumerRoot, "smoke.mjs"),
    `import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const entryPoints = ${JSON.stringify([
      "@cardspark/ui",
      "@cardspark/ui/collecting",
      "@cardspark/ui/core",
      "@cardspark/ui/layouts",
      "@cardspark/ui/market",
      "@cardspark/ui/utils"
    ])};
for (const entryPoint of entryPoints) {
  const exports = await import(entryPoint);
  if (Object.keys(exports).length === 0) throw new Error(\`${"${entryPoint}"} has no runtime exports\`);
}

const root = await import("@cardspark/ui");
const retiredExports = [
  "CardNumberBadge", "CollectionCardRow", "ConditionBadge", "DeltaValue", "FoilBadge",
  "LanguageBadge", "MarketCardRow", "RarityBadge", "SetBadge"
];
for (const exportName of retiredExports) {
  if (exportName in root) throw new Error(\`Retired public export found: ${"${exportName}"}\`);
}

const core = await import("@cardspark/ui/core");
const card = {
  id: "swsh12-186", name: "Lugia V", set: "Silver Tempest", number: "186/195",
  rarity: "Special Illustration Rare", marketValue: "$214.75",
  imageUrl: "https://example.com/lugia.png"
};
const markup = renderToStaticMarkup(
  React.createElement(core.CardStack, null, React.createElement(core.CardRow, { card, format: "market" }))
);
if (!markup.includes("Lugia V")) throw new Error("Representative server render failed");

const resourceMarkup = renderToStaticMarkup(
  React.createElement(
    React.Fragment,
    null,
    React.createElement(core.CardBadge, { type: "type", value: "Grass" }),
    React.createElement(core.CardBadge, { type: "type", value: "Fire" }),
    React.createElement(core.CardBadge, { type: "type", value: "Fire" })
  )
);
if (!resourceMarkup.includes("data:image/png;base64,")) {
  throw new Error("Energy icons are not embedded as portable package assets");
}
if (!resourceMarkup.includes('data-energy="grass"') || !resourceMarkup.includes('data-energy="fire"')) {
  throw new Error("Representative energy icons failed to render");
}

const layouts = await import("@cardspark/ui/layouts");
const detailMarkup = renderToStaticMarkup(
  React.createElement(layouts.CardDetail, {
    card: { ...card, number: "186/195", rarity: "Ultra Rare", type: "Grass" },
    facts: [
      { kind: "type", value: "Grass" },
      { kind: "weakness", value: "Fire x2" }
    ],
    variants: ["Normal"],
    activeVariant: "Normal",
    dataSources: ["Market"],
    activeDataSource: "Market",
    graders: ["Ungraded"],
    activeGrader: "Ungraded",
    collection: { actionLabel: "Add to collection" },
    market: { label: "Market price", price: "$214.75", deltaToday: "+5.4%" },
    history: { values: [190, 214.75], range: "1D", ranges: ["1D"] }
  })
);
if ((detailMarkup.match(/data-energy="grass"/g) ?? []).length !== 1) {
  throw new Error("CardDetail type energy icon failed to render");
}
if ((detailMarkup.match(/data-energy="fire"/g) ?? []).length !== 2) {
  throw new Error("CardDetail weakness multiplier did not render repeated energy icons");
}

const collecting = await import("@cardspark/ui/collecting");
const summaryMarkup = renderToStaticMarkup(
  React.createElement(collecting.SetSummary, { name: "Silver Tempest", owned: 12, total: 195 })
);
if (!summaryMarkup.includes("Silver Tempest")) throw new Error("Collecting server render failed");`
  );
  execFileSync(process.execPath, ["smoke.mjs"], { cwd: consumerRoot, stdio: "pipe" });

  const installedRoot = join(consumerRoot, "node_modules", "@cardspark", "ui");
  const installedManifest = JSON.parse(readFileSync(join(installedRoot, "package.json"), "utf8"));
  const coreEntry = readFileSync(join(installedRoot, "dist", "core", "index.js"), "utf8");
  const marketEntry = readFileSync(join(installedRoot, "dist", "market", "index.js"), "utf8");
  const utilsEntry = readFileSync(join(installedRoot, "dist", "utils", "index.js"), "utf8");

  if (!coreEntry.startsWith('"use client";')) throw new Error("Core component entry is missing its client boundary");
  if (marketEntry.startsWith('"use client";')) throw new Error("Market helper entry unexpectedly has a client boundary");
  if (utilsEntry.startsWith('"use client";')) throw new Error("Utility entry unexpectedly has a client boundary");
  process.stdout.write(`Verified ${installedManifest.name}@${installedManifest.version} from its packed tarball.\n`);
} finally {
  rmSync(consumerRoot, { force: true, recursive: true });
}

"use client";

import { CardRow, CardStack } from "../core/card-row";
import { CardGrid, CardTile } from "../core/card-tile";
import { FilterBar } from "../core/filter-bar";
import { Fragment, useState } from "react";
import type { CardPresentationFormat, TradingCardData } from "../core/card-format";
import type { CardGridProps, CardTileProps } from "../core/card-tile";
import type { CardRowProps } from "../core/card-row";
import type { FilterBarProps } from "../core/filter-bar";
import type { ReactNode } from "react";

export type CardListView = "grid" | "stack";

export type CardListProps = {
  cards: TradingCardData[];
  format?: CardPresentationFormat;
  filters?: FilterBarProps["filters"];
  onFilterChange?: FilterBarProps["onFilterChange"];
  onFilterMultiChange?: FilterBarProps["onFilterMultiChange"];
  multiSelectFilters?: FilterBarProps["multiSelect"];
  filterActions?: ReactNode;
  filterAriaLabel?: string;
  view?: CardListView;
  defaultView?: CardListView;
  onViewChange?: (view: CardListView) => void;
  showViewToggle?: boolean;
  gridColumns?: CardGridProps["columns"];
  getCardKey?: (card: TradingCardData, index: number) => string;
  renderTile?: (card: TradingCardData, index: number) => ReactNode;
  renderRow?: (card: TradingCardData, index: number) => ReactNode;
  tileProps?: Omit<CardTileProps, "card" | "format">;
  rowProps?: Omit<CardRowProps, "card" | "format">;
  emptyState?: ReactNode;
  className?: string;
};

export function CardList({
  cards,
  format = "market",
  filters = [],
  onFilterChange,
  onFilterMultiChange,
  multiSelectFilters,
  filterActions,
  filterAriaLabel = "Card filters",
  view,
  defaultView = "stack",
  onViewChange,
  showViewToggle = true,
  gridColumns,
  getCardKey = getDefaultCardKey,
  renderTile,
  renderRow,
  tileProps,
  rowProps,
  emptyState = <p>No cards found.</p>,
  className
}: CardListProps) {
  const [internalView, setInternalView] = useState<CardListView>(defaultView);
  const activeView = view ?? internalView;
  const hasActions = Boolean(filterActions) || showViewToggle;
  const hasToolbar = filters.length > 0 || hasActions;

  function handleViewChange(nextView: CardListView) {
    if (view === undefined) {
      setInternalView(nextView);
    }

    onViewChange?.(nextView);
  }

  return (
    <section className={["cs-card-list", className].filter(Boolean).join(" ")} data-view={activeView}>
      {hasToolbar ? (
        <div className="cs-card-list-toolbar">
          {filters.length > 0 ? (
            <FilterBar
              filters={filters}
              onFilterChange={onFilterChange}
              onFilterMultiChange={onFilterMultiChange}
              multiSelect={multiSelectFilters}
              ariaLabel={filterAriaLabel}
              className="cs-card-list-filter-bar"
            />
          ) : null}
          {hasActions ? (
            <div className="cs-card-list-actions">
              {filterActions}
              {showViewToggle ? <CardListViewToggle value={activeView} onChange={handleViewChange} /> : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {cards.length ? (
        activeView === "grid" ? (
          <CardGrid columns={gridColumns}>
            {cards.map((card, index) => (
              <Fragment key={getCardKey(card, index)}>
                {renderTile ? renderTile(card, index) : <CardTile format={format} card={card} {...tileProps} />}
              </Fragment>
            ))}
          </CardGrid>
        ) : (
          <CardStack>
            {cards.map((card, index) => (
              <Fragment key={getCardKey(card, index)}>
                {renderRow ? renderRow(card, index) : <CardRow format={format} card={card} {...rowProps} />}
              </Fragment>
            ))}
          </CardStack>
        )
      ) : (
        <div className="cs-card-list-empty">{emptyState}</div>
      )}
    </section>
  );
}

function CardListViewToggle({
  value,
  onChange
}: {
  value: CardListView;
  onChange: (view: CardListView) => void;
}) {
  const nextView: CardListView = value === "grid" ? "stack" : "grid";
  const nextViewLabel = nextView === "grid" ? "Grid" : "List";

  return (
    <button
      className="cs-card-list-view-toggle"
      type="button"
      aria-label={`View as ${nextViewLabel}`}
      data-view-target={nextView}
      onClick={() => onChange(nextView)}
    >
      {nextView === "grid" ? <GridViewIcon /> : <ListViewIcon />}
      <span className="cs-card-list-view-tooltip" aria-hidden="true">
        View as {nextViewLabel}
      </span>
    </button>
  );
}

function GridViewIcon() {
  return (
    <span className="cs-card-list-view-icon cs-card-list-view-icon-grid" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

function ListViewIcon() {
  return (
    <span className="cs-card-list-view-icon cs-card-list-view-icon-list" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function getDefaultCardKey(card: TradingCardData, index: number) {
  return [card.setCode, card.number, card.name, index].filter(Boolean).join("-");
}

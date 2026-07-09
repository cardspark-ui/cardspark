"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export type FilterOption = {
  value: string;
  label?: string;
  compactLabel?: string;
  disabled?: boolean;
};

export type FilterBarItem = {
  id: string;
  label: string;
  value: string;
  values?: string[];
  options: Array<string | FilterOption>;
  compact?: boolean;
  className?: string;
  formatValue?: (value: string) => string;
  formatOption?: (value: string) => string;
};

export type FilterBarProps = {
  filters: FilterBarItem[];
  onFilterChange?: (id: string, value: string) => void;
  onFilterMultiChange?: (id: string, values: string[]) => void;
  multiSelect?: boolean;
  actions?: ReactNode;
  ariaLabel?: string;
  className?: string;
};

export function FilterBar({
  filters,
  onFilterChange,
  onFilterMultiChange,
  multiSelect = false,
  actions,
  ariaLabel = "Filters",
  className
}: FilterBarProps) {
  const filterBarRef = useRef<HTMLElement>(null);
  const filterControlsRef = useRef<HTMLDivElement>(null);
  const [pendingMultiValuesById, setPendingMultiValuesById] = useState<Record<string, string[]>>({});
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    function handleDocumentPointerDown(event: PointerEvent) {
      const filterBar = filterBarRef.current;

      if (!filterBar || !(event.target instanceof Node) || filterBar.contains(event.target)) {
        return;
      }

      blurActiveFilterControl(filterBar);
      closeFilterMenus(filterBar);
    }

    document.addEventListener("pointerdown", handleDocumentPointerDown);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
    };
  }, []);

  useEffect(() => {
    const controls = filterControlsRef.current;

    if (!controls) {
      return;
    }

    function measureOverflow() {
      const measuredControls = filterControlsRef.current;

      if (!measuredControls) {
        return;
      }

      const nextIsOverflowing = measuredControls.scrollWidth > measuredControls.clientWidth + 1;
      setIsOverflowing((currentValue) => (currentValue === nextIsOverflowing ? currentValue : nextIsOverflowing));
    }

    measureOverflow();

    const resizeObserver = new ResizeObserver(measureOverflow);
    resizeObserver.observe(controls);

    controls.querySelectorAll<HTMLElement>(".cs-filter-control").forEach((control) => {
      resizeObserver.observe(control);
    });

    window.addEventListener("resize", measureOverflow);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measureOverflow);
    };
  }, [filters, multiSelect, pendingMultiValuesById]);

  return (
    <section
      className={["cs-filter-bar", className].filter(Boolean).join(" ")}
      aria-label={ariaLabel}
      data-overflowing={isOverflowing ? "true" : undefined}
      ref={filterBarRef}
    >
      <div className="cs-filter-bar-controls" ref={filterControlsRef}>
        {filters.map((filter) => {
          const options = filter.options.map(normalizeFilterOption);
          const useMultiSelect = multiSelect && filter.id !== "grader" && options.length > 2;
          const selectedOption = options.find((option) => option.value === filter.value);
          const selectedValues = useMultiSelect
            ? normalizeSelectedFilterValues(filter, options, getSelectedFilterValues(filter))
            : getSelectedFilterValues(filter);
          const selectedDisplayText = useMultiSelect
            ? getMultiFilterValueLabel(filter, options, selectedValues)
            : getFilterValueLabel(filter, selectedOption);
          const isAllValue = useMultiSelect
            ? isAllFilterSelection(filter, options, selectedValues)
            : selectedDisplayText.trim().toLowerCase().startsWith("all");
          const controlDisplayContent = isAllValue ? (
            <>
              +
              <span className="cs-filter-add-label">{filter.label}</span>
            </>
          ) : selectedDisplayText;
          const controlId = `cs-filter-${filter.id.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
          const labelId = `${controlId}-label`;

          if (useMultiSelect) {
            const menuOptions = options.filter((option) => !isAllFilterOption(filter, option));
            const pendingSpecificValues =
              pendingMultiValuesById[filter.id] ?? getSpecificMultiFilterValues(filter, options, selectedValues);
            const pendingAppliedValues = getAppliedMultiFilterValues(filter, options, pendingSpecificValues);
            const hasPendingChanges = !areFilterValueSetsEqual(pendingAppliedValues, selectedValues);
            const hasAppliedSelections = !isAllFilterSelection(filter, options, selectedValues);

            return (
              <div className={["cs-filter-control", filter.className].filter(Boolean).join(" ")} key={filter.id}>
                <span className="cs-filter-label" id={labelId}>{filter.label}</span>
                <details
                  className="cs-filter-select cs-filter-multiselect"
                  data-add-filter={isAllValue ? "true" : undefined}
                  data-all-value={isAllValue ? "true" : undefined}
                  data-compact-value={filter.compact ? "true" : undefined}
                  data-filter-id={filter.id}
                  onToggle={(event) => {
                    if (event.currentTarget.open) {
                      closeSiblingFilterMenus(event.currentTarget);
                      setPendingMultiValuesById((currentValues) => ({
                        ...currentValues,
                        [filter.id]: getSpecificMultiFilterValues(filter, options, selectedValues)
                      }));
                    } else {
                      setPendingMultiValuesById((currentValues) => {
                        const { [filter.id]: _removedValues, ...remainingValues } = currentValues;

                        return remainingValues;
                      });
                    }
                  }}
                >
                  <summary className="cs-filter-multiselect-trigger" aria-labelledby={`${labelId} ${controlId}-value`}>
                    <span className="cs-filter-size-probe" aria-hidden="true">
                      {controlDisplayContent}
                    </span>
                    <span className="cs-filter-multiselect-value" id={`${controlId}-value`}>
                      {controlDisplayContent}
                    </span>
                    <span className="cs-filter-caret" aria-hidden="true">▼</span>
                  </summary>
                  <div className="cs-filter-menu" role="group" aria-labelledby={labelId}>
                    {menuOptions.map((option) => {
                      const isSelected = pendingSpecificValues.includes(option.value);

                      return (
                        <label
                          className="cs-filter-menu-option"
                          data-selected={isSelected ? "true" : undefined}
                          key={option.value}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={option.disabled}
                            onChange={(event) => {
                              setPendingMultiValuesById((currentValues) => ({
                                ...currentValues,
                                [filter.id]: getNextPendingMultiFilterValues(
                                  pendingSpecificValues,
                                  option.value,
                                  event.target.checked
                                )
                              }));
                            }}
                          />
                          <span className="cs-filter-menu-check" aria-hidden="true" />
                          <span>{getFilterOptionLabel(filter, option)}</span>
                        </label>
                      );
                    })}
                    {hasPendingChanges ? (
                      <div className="cs-filter-menu-apply-row">
                        <button
                          className="cs-filter-menu-apply"
                          type="button"
                          onClick={(event) => {
                            onFilterMultiChange?.(filter.id, pendingAppliedValues);
                            event.currentTarget.closest("details")?.removeAttribute("open");
                          }}
                        >
                          Apply
                        </button>
                      </div>
                    ) : null}
                    {!hasPendingChanges && hasAppliedSelections ? (
                      <div className="cs-filter-menu-apply-row">
                        <button
                          className="cs-filter-menu-apply cs-filter-menu-clear"
                          type="button"
                          onClick={(event) => {
                            const nextValues = getAppliedMultiFilterValues(filter, options, []);

                            setPendingMultiValuesById((currentValues) => ({
                              ...currentValues,
                              [filter.id]: []
                            }));
                            onFilterMultiChange?.(filter.id, nextValues);
                            event.currentTarget.closest("details")?.removeAttribute("open");
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    ) : null}
                  </div>
                </details>
              </div>
            );
          }

          return (
            <label className={["cs-filter-control", filter.className].filter(Boolean).join(" ")} htmlFor={controlId} key={filter.id}>
              <span className="cs-filter-label" id={labelId}>{filter.label}</span>
              <span
                className="cs-filter-select"
                data-add-filter={isAllValue ? "true" : undefined}
                data-all-value={isAllValue ? "true" : undefined}
                data-compact-value={filter.compact ? "true" : undefined}
              >
                <span className="cs-filter-size-probe" aria-hidden="true">
                  {controlDisplayContent}
                </span>
                <select
                  id={controlId}
                  name={filter.id}
                  value={filter.value}
                  aria-label={filter.label}
                  onChange={(event) => {
                    onFilterChange?.(filter.id, event.target.value);
                    event.currentTarget.blur();
                  }}
                >
                  {options.map((option) => (
                    <option disabled={option.disabled} key={option.value} value={option.value}>
                      {getFilterOptionLabel(filter, option)}
                    </option>
                  ))}
                </select>
                {filter.compact || isAllValue ? (
                  <span className="cs-filter-value" aria-hidden="true">
                    {controlDisplayContent}
                  </span>
                ) : null}
                <span className="cs-filter-caret" aria-hidden="true">▼</span>
              </span>
            </label>
          );
        })}
      </div>
      {actions ? <div className="cs-filter-actions">{actions}</div> : null}
    </section>
  );
}

function normalizeFilterOption(option: string | FilterOption): FilterOption {
  return typeof option === "string" ? { value: option } : option;
}

function getSelectedFilterValues(filter: FilterBarItem) {
  return filter.values?.length ? filter.values : [filter.value];
}

function normalizeSelectedFilterValues(filter: FilterBarItem, options: FilterOption[], selectedValues: string[]) {
  const allOption = getAllFilterOption(filter, options);

  if (!allOption || selectedValues.length <= 1) {
    return selectedValues;
  }

  return selectedValues.filter((value) => value !== allOption.value);
}

function getSpecificMultiFilterValues(filter: FilterBarItem, options: FilterOption[], selectedValues: string[]) {
  const allOption = getAllFilterOption(filter, options);
  const availableValues = new Set(options.map((option) => option.value));

  return selectedValues.filter((value) => value !== allOption?.value && availableValues.has(value));
}

function getAppliedMultiFilterValues(filter: FilterBarItem, options: FilterOption[], selectedValues: string[]) {
  const allOption = getAllFilterOption(filter, options);

  return selectedValues.length ? selectedValues : allOption ? [allOption.value] : selectedValues;
}

function getNextPendingMultiFilterValues(selectedValues: string[], optionValue: string, checked: boolean) {
  if (checked && !selectedValues.includes(optionValue)) {
    return [...selectedValues, optionValue];
  }

  if (!checked) {
    return selectedValues.filter((value) => value !== optionValue);
  }

  return selectedValues;
}

function getFilterValueLabel(filter: FilterBarItem, option: FilterOption | undefined) {
  const value = option?.value ?? filter.value;

  return filter.formatValue?.(value) ?? option?.compactLabel ?? option?.label ?? value;
}

function getFilterOptionLabel(filter: FilterBarItem, option: FilterOption) {
  return filter.formatOption?.(option.value) ?? option.label ?? option.value;
}

function getMultiFilterValueLabel(filter: FilterBarItem, options: FilterOption[], selectedValues: string[]) {
  const allOption = getAllFilterOption(filter, options);
  const isAllSelected = Boolean(allOption && selectedValues.length === 1 && selectedValues[0] === allOption.value);

  if (isAllSelected) {
    return `+ ${filter.label}`;
  }

  if (selectedValues.length === 1) {
    const selectedOption = options.find((option) => option.value === selectedValues[0]);

    return getFilterValueLabel(filter, selectedOption);
  }

  return `${selectedValues.length} ${getPluralFilterLabel(filter.label)}`;
}

function isAllFilterSelection(filter: FilterBarItem, options: FilterOption[], selectedValues: string[]) {
  const allOption = getAllFilterOption(filter, options);

  return Boolean(allOption && selectedValues.length === 1 && selectedValues[0] === allOption.value);
}

function getAllFilterOption(filter: FilterBarItem, options: FilterOption[]) {
  return options.find((option) => isAllFilterOption(filter, option));
}

function areFilterValueSetsEqual(firstValues: string[], secondValues: string[]) {
  if (firstValues.length !== secondValues.length) {
    return false;
  }

  const secondValueSet = new Set(secondValues);

  return firstValues.every((value) => secondValueSet.has(value));
}

function isAllFilterOption(filter: FilterBarItem, option: FilterOption) {
  return getFilterOptionLabel(filter, option).trim().toLowerCase().startsWith("all");
}

function getPluralFilterLabel(label: string) {
  if (label.endsWith("y")) {
    return `${label.slice(0, -1)}ies`;
  }

  return label.endsWith("s") ? label : `${label}s`;
}

function closeSiblingFilterMenus(currentDetails: HTMLDetailsElement) {
  currentDetails
    .closest(".cs-filter-bar")
    ?.querySelectorAll<HTMLDetailsElement>(".cs-filter-multiselect[open]")
    .forEach((details) => {
      if (details !== currentDetails) {
        details.removeAttribute("open");
      }
    });
}

function closeFilterMenus(container: HTMLElement) {
  container.querySelectorAll<HTMLDetailsElement>(".cs-filter-multiselect[open]").forEach((details) => {
    details.removeAttribute("open");
  });
}

function blurActiveFilterControl(container: HTMLElement) {
  const activeElement = document.activeElement;

  if (activeElement instanceof HTMLElement && container.contains(activeElement)) {
    activeElement.blur();
  }
}

"use client";

import { useState, useRef, useEffect } from "react";

interface FilterConfig {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface Props {
  filters: FilterConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export default function FilterBar({
  filters,
  values,
  onChange,
  search,
  onSearchChange,
}: Props) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const activeFilters = filters.filter((f) => values[f.key]);

  return (
    <div className="filter-bar">
      <input
        className="filter-search"
        placeholder="Search entries..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <div className="filter-pills">
        {activeFilters.map((f) => {
          const opt = f.options.find((o) => o.value === values[f.key]);
          return (
            <span key={f.key} className="filter-pill">
              <span className="filter-pill-label">{f.label}:</span>
              <span className="filter-pill-value">{opt?.label || values[f.key]}</span>
              <button
                className="filter-pill-remove"
                onClick={() => onChange(f.key, "")}
              >
                ×
              </button>
            </span>
          );
        })}
        <div className="filter-dropdown-wrapper" ref={dropdownRef}>
          <button
            className="filter-add-btn"
            onClick={() => setOpenDropdown(openDropdown ? null : "_menu")}
          >
            + Filter
          </button>
          {openDropdown === "_menu" && (
            <div className="filter-dropdown">
              <div className="filter-dropdown-title">Add filter</div>
              {filters
                .filter((f) => !values[f.key])
                .map((f) => (
                  <button
                    key={f.key}
                    className="filter-dropdown-option"
                    onClick={() => setOpenDropdown(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
            </div>
          )}
          {openDropdown && openDropdown !== "_menu" && (
            <div className="filter-dropdown">
              <div className="filter-dropdown-title">
                {filters.find((f) => f.key === openDropdown)?.label}
              </div>
              {filters
                .find((f) => f.key === openDropdown)
                ?.options.map((opt) => (
                  <button
                    key={opt.value}
                    className={`filter-dropdown-option${
                      values[openDropdown] === opt.value ? " active" : ""
                    }`}
                    onClick={() => {
                      onChange(openDropdown, opt.value);
                      setOpenDropdown(null);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { cocktailAlcoholFilters, cocktailCategoryFilters, cocktailColorFilters, wineTypeFilters } from '../constants/appData'

export function FilterPanel({ activeFilterCount, drinkType, filters, onFilterChange, onReset }) {
  return (
    <section className="filter-panel" aria-label="검색 필터 메뉴">
      <div className="filter-panel-header">
        <div>
          <span className="eyebrow dark">Filter</span>
          <h2>검색 메뉴</h2>
        </div>
        <button disabled={activeFilterCount === 0 && drinkType === 'cocktail'} onClick={onReset} type="button">
          초기화
        </button>
      </div>

      {drinkType === 'cocktail' ? (
        <div className="filter-groups">
          <FilterChipGroup
            label="알코올 여부"
            name="alcoholic"
            onChange={onFilterChange}
            options={cocktailAlcoholFilters}
            value={filters.alcoholic}
          />
          <FilterChipGroup
            label="종류별"
            name="category"
            onChange={onFilterChange}
            options={cocktailCategoryFilters}
            value={filters.category}
          />
          <FilterChipGroup
            label="색상 기준"
            name="color"
            onChange={onFilterChange}
            options={cocktailColorFilters}
            value={filters.color}
            note="색상 DB 연결은 다음 단계에서 적용 예정"
          />
        </div>
      ) : (
        <div className="filter-groups">
          <FilterChipGroup
            label="와인 종류"
            name="wineType"
            onChange={onFilterChange}
            options={wineTypeFilters}
            value={filters.wineType}
            note="WineAPI 보강 완료 데이터 우선 표시"
          />
        </div>
      )}
    </section>
  )
}

function FilterChipGroup({ disabled = false, label, name, note, onChange, options, value }) {
  return (
    <section className="filter-group">
      <div className="filter-group-title">
        <strong>{label}</strong>
        {note ? <span>{note}</span> : null}
      </div>
      <div className="filter-chip-row">
        {options.map((option) => (
          <button
            aria-pressed={value === option}
            className={value === option ? 'active' : ''}
            disabled={disabled}
            key={option}
            onClick={() => onChange?.(name, option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </section>
  )
}

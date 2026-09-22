import { useEffect, useState } from 'react'
import { FilterPanel } from '../components/FilterPanel'
import { Pagination } from '../components/common'
import { FilterIcon, HeartIcon, SearchIcon } from '../components/icons'
import { cocktailPageSize } from '../constants/appData'
import { searchCocktails } from '../services/cocktailService'
import { searchWines } from '../services/wineService'

export function SearchScreen({ onOpenDrinkDetail, onSaveDrink, savedDrinkIds }) {
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('loading')
  const [totalCount, setTotalCount] = useState(0)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [drinkType, setDrinkType] = useState('cocktail')
  const [filters, setFilters] = useState({ alcoholic: '', category: '', color: '', wineType: '' })
  const totalPages = Math.ceil(totalCount / cocktailPageSize)
  const activeFilterCount = drinkType === 'cocktail'
    ? [filters.alcoholic, filters.category, filters.color].filter(Boolean).length
    : [filters.wineType].filter(Boolean).length

  useEffect(() => {
    let isMounted = true
    const timeoutId = window.setTimeout(() => {
      setStatus('loading')

      const searchDrinks = drinkType === 'wine' ? searchWines : searchCocktails

      searchDrinks(query, currentPage, cocktailPageSize, filters)
        .then(({ items, totalCount: nextTotalCount }) => {
          if (isMounted) {
            setResults(items)
            setTotalCount(nextTotalCount)
            setStatus(items.length > 0 ? 'ready' : 'empty')
          }
        })
        .catch(() => {
          if (isMounted) {
            setResults([])
            setTotalCount(0)
            setStatus('error')
          }
        })
    }, 240)

    return () => {
      isMounted = false
      window.clearTimeout(timeoutId)
    }
  }, [currentPage, drinkType, filters, query])

  function updateFilter(filterName, value) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [filterName]: currentFilters[filterName] === value ? '' : value,
    }))
    setCurrentPage(1)
  }

  function resetFilters() {
    setFilters({ alcoholic: '', category: '', color: '', wineType: '' })
    setDrinkType('cocktail')
    setCurrentPage(1)
  }

  function changeDrinkType(nextDrinkType) {
    setDrinkType(nextDrinkType)
    setCurrentPage(1)
  }

  return (
    <section className="search-screen">
      <header className="page-header">
        <span className="eyebrow dark">Explore drinks</span>
        <h1>탐색</h1>
      </header>

      <label className="search-bar search-page-bar">
        <SearchIcon />
        <input
          aria-label={drinkType === 'wine' ? '와인 검색' : '칵테일 검색'}
          onChange={(event) => {
            setQuery(event.target.value)
            setCurrentPage(1)
          }}
          placeholder={drinkType === 'wine' ? '와인 이름, 와이너리, 국가...' : '마가리타, 진, 하이볼 글라스...'}
          value={query}
        />
        <button
          className={activeFilterCount > 0 ? 'active' : ''}
          type="button"
          aria-expanded={isFilterOpen}
          aria-label="검색 필터"
          onClick={() => setIsFilterOpen((currentValue) => !currentValue)}
        >
          <FilterIcon />
        </button>
      </label>

      <div className="filter-segment search-type-toggle" aria-label="음료 분류">
        <button className={drinkType === 'cocktail' ? 'active' : ''} onClick={() => changeDrinkType('cocktail')} type="button">
          칵테일
        </button>
        <button className={drinkType === 'wine' ? 'active' : ''} onClick={() => changeDrinkType('wine')} type="button">
          와인
        </button>
      </div>

      {isFilterOpen ? (
        <FilterPanel
          activeFilterCount={activeFilterCount}
          drinkType={drinkType}
          filters={filters}
          onFilterChange={updateFilter}
          onReset={resetFilters}
        />
      ) : null}

      <div className="search-summary">
        <strong>{query ? `“${query}” 검색` : drinkType === 'wine' ? '보강된 와인' : '추천 칵테일'}</strong>
        <span>{status === 'ready' ? `전체 ${totalCount}개 · ${currentPage}/${totalPages}페이지` : status === 'loading' ? '불러오는 중' : '결과 없음'}</span>
      </div>

      {status === 'error' ? (
        <div className="state-panel">
          <strong>{drinkType === 'wine' ? '와인 데이터를 불러오지 못했어요.' : '칵테일 데이터를 불러오지 못했어요.'}</strong>
          <p>Supabase 권한이나 네트워크 상태를 확인한 뒤 다시 시도해주세요.</p>
        </div>
      ) : null}

      {status === 'empty' ? (
        <div className="state-panel">
          <strong>검색 결과가 없어요.</strong>
          <p>{drinkType === 'wine' ? '와인 이름, 와이너리, 국가 이름으로 조금 더 넓게 입력해보세요.' : '영문 이름이나 재료, 글라스 이름으로 조금 더 넓게 입력해보세요.'}</p>
        </div>
      ) : null}

      <div className="search-results">
        {results.map((drink) => (
          <article
            className={`search-result-card ${drink.type === 'Wine' ? 'wine-result' : ''}`}
            key={drink.id}
            onClick={() => onOpenDrinkDetail(drink)}
          >
            <div className="search-result-art" aria-hidden="true">
              {drink.imageUrl ? <img alt="" src={drink.imageUrl} /> : null}
            </div>
            <div>
              <span>{drink.meta}</span>
              <h2>{drink.name}</h2>
              <p>{drink.note}</p>
            </div>
            <button
              className={savedDrinkIds.includes(drink.id) ? 'save-button saved' : 'save-button'}
              aria-pressed={savedDrinkIds.includes(drink.id)}
              onClick={(event) => {
                event.stopPropagation()
                onSaveDrink(drink)
              }}
              type="button"
              aria-label={savedDrinkIds.includes(drink.id) ? `${drink.name} 저장 해제` : `${drink.name} 저장`}
            >
              <HeartIcon />
            </button>
          </article>
        ))}
      </div>

      {totalPages > 1 ? (
        <Pagination currentPage={currentPage} onPageChange={setCurrentPage} totalPages={totalPages} />
      ) : null}
    </section>
  )
}

import { useEffect, useState } from 'react'
import { SectionHeader } from '../components/common'
import { HeartIcon, NoteIcon } from '../components/icons'
import { categories, fallbackCocktailDrink, featuredWineDrink, savedNotes } from '../constants/appData'
import { fetchFeaturedCocktails } from '../services/cocktailService'

export function HomeScreen({ onCategorySelect, onOpenDrinkDetail, onSaveDrink, savedDrinkIds }) {
  const [featuredCocktails, setFeaturedCocktails] = useState([fallbackCocktailDrink])

  useEffect(() => {
    let isMounted = true

    fetchFeaturedCocktails(1)
      .then((cocktails) => {
        if (isMounted && cocktails.length > 0) {
          setFeaturedCocktails(cocktails)
        }
      })
      .catch(() => {
        if (isMounted) {
          setFeaturedCocktails([fallbackCocktailDrink])
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const featuredDrinks = [...featuredCocktails, featuredWineDrink]
  return (
    <>
      <section className="top-panel">
        <div className="hero-copy">
          <span className="eyebrow">Tonight&apos;s glass</span>
          <h1>오늘 마실 한 잔을 기록하고 발견하세요</h1>
        </div>

        <div className="glass-scene" aria-hidden="true">
          <span className="stem-glass" />
          <span className="tumbler" />
          <span className="lime" />
        </div>
      </section>

      <section className="content-panel">
        <SectionHeader title="추천 리스트" action="전체보기" onAction={() => onCategorySelect('search')} />
        <div className="featured-list">
          {featuredDrinks.map((drink) => (
            <article
              className={`drink-card ${drink.type.toLowerCase()}`}
              key={drink.id || drink.name}
              onClick={() => drink.type === 'Cocktail' && onOpenDrinkDetail(drink)}
            >
              <div className="drink-art" aria-hidden="true">
                {drink.imageUrl ? <img alt="" src={drink.imageUrl} /> : null}
              </div>
              <div>
                <span>{drink.type}</span>
                <h2>{drink.name}</h2>
                <p>{drink.note}</p>
                <small>{drink.meta}</small>
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

        <SectionHeader title="탐색 카테고리" action="필터" />
        <div className="category-strip">
          {categories.map((category) => {
            const isActiveCategory = category.title === 'Cocktail'

            return (
              <button
                aria-disabled={!isActiveCategory}
                className={`category-tile ${category.accent} ${isActiveCategory ? 'active' : 'disabled'}`}
                key={category.title}
                onClick={isActiveCategory ? () => onCategorySelect('search') : undefined}
                type="button"
              >
                <strong>{category.title}</strong>
                <span>{category.count}</span>
              </button>
            )
          })}
        </div>


        <section className="note-panel">
          <SectionHeader title="최근 기록" action="추가" />
          {savedNotes.map((note) => (
            <article className="note-row" key={note}>
              <NoteIcon />
              <p>{note}</p>
            </article>
          ))}
        </section>
      </section>
    </>
  )
}

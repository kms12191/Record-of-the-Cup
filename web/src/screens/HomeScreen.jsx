import { useEffect, useState } from 'react'
import { SectionHeader } from '../components/common'
import { HeartIcon, NoteIcon } from '../components/icons'
import { categories, fallbackCocktailDrink } from '../constants/appData'
import { fetchFeaturedCocktails } from '../services/cocktailService'
import { fetchRecentDrinkNotes } from '../services/noteService'
import { fetchFeaturedWines } from '../services/wineService'

export function HomeScreen({ onCategorySelect, onOpenDrinkDetail, onOpenNotes, onSaveDrink, savedDrinkIds, session }) {
  const [featuredCocktails, setFeaturedCocktails] = useState([fallbackCocktailDrink])
  const [featuredWines, setFeaturedWines] = useState([])
  const [recentNote, setRecentNote] = useState(null)
  const [recentNoteStatus, setRecentNoteStatus] = useState('loading')

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

    fetchFeaturedWines(1)
      .then((wines) => {
        if (isMounted) {
          setFeaturedWines(wines)
        }
      })
      .catch(() => {
        if (isMounted) {
          setFeaturedWines([])
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!session?.user) {
      return undefined
    }

    let isMounted = true

    fetchRecentDrinkNotes(session.user.id, 1)
      .then((notes) => {
        if (!isMounted) {
          return
        }

        setRecentNote(notes[0] || null)
        setRecentNoteStatus(notes.length > 0 ? 'ready' : 'empty')
      })
      .catch(() => {
        if (isMounted) {
          setRecentNote(null)
          setRecentNoteStatus('error')
        }
      })

    return () => {
      isMounted = false
    }
  }, [session])

  const featuredDrinks = [...featuredCocktails, ...featuredWines]
  const resolvedRecentNoteStatus = session?.user ? recentNoteStatus : 'signedOut'

  function handleOpenFeaturedDrink(drink) {
    onOpenDrinkDetail(drink)
  }

  function handleFeaturedCardKeyDown(event, drink) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    handleOpenFeaturedDrink(drink)
  }

  function handleOpenRecentNote() {
    if (!recentNote?.drink?.id) {
      onOpenNotes()
      return
    }

    onOpenDrinkDetail(recentNote.drink)
  }

  function renderRecentNoteContent() {
    if (resolvedRecentNoteStatus === 'signedOut') {
      return '로그인 후 상세 페이지에서 남긴 노트를 확인할 수 있습니다.'
    }

    if (resolvedRecentNoteStatus === 'loading') {
      return '최근 노트를 불러오는 중입니다.'
    }

    if (resolvedRecentNoteStatus === 'error') {
      return '최근 노트를 불러오지 못했습니다.'
    }

    if (resolvedRecentNoteStatus === 'empty') {
      return '상세 페이지에서 내 노트를 남기면 여기에 표시됩니다.'
    }

    return recentNote.note
  }

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


        <section className="note-panel">
          <SectionHeader title="최근 노트" action="전체보기" onAction={onOpenNotes} />
          <article
            className={recentNote ? 'note-row interactive' : 'note-row'}
            onClick={recentNote ? handleOpenRecentNote : undefined}
          >
            <NoteIcon />
            <div>
              {recentNote ? <strong>{recentNote.drinkName}</strong> : null}
              <p>{renderRecentNoteContent()}</p>
            </div>
          </article>
        </section>
      </section>

      <section className="content-panel">
        <SectionHeader title="추천 리스트" action="전체보기" onAction={() => onCategorySelect('cocktail')} />
        <div className="featured-list">
          {featuredDrinks.map((drink) => (
            <article
              className={`drink-card ${drink.type.toLowerCase()}`}
              key={drink.id || drink.name}
              onClick={() => handleOpenFeaturedDrink(drink)}
              onKeyDown={(event) => handleFeaturedCardKeyDown(event, drink)}
              role="button"
              tabIndex={0}
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
            const drinkType = category.title.toLowerCase()
            const isActiveCategory = ['cocktail', 'wine'].includes(drinkType)

            return (
              <button
                aria-disabled={!isActiveCategory}
                className={`category-tile ${category.accent} ${isActiveCategory ? 'active' : 'disabled'}`}
                key={category.title}
                onClick={isActiveCategory ? () => onCategorySelect(drinkType) : undefined}
                type="button"
              >
                <strong>{category.title}</strong>
                <span>{category.count}</span>
              </button>
            )
          })}
        </div>
      </section>
    </>
  )
}

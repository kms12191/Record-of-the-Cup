import { useEffect, useState } from 'react'
import { DrinkNotePanel } from '../components/DrinkNotePanel'
import { BackIcon } from '../components/icons'
import { fetchCocktailById } from '../services/cocktailService'

export function CocktailDetailPage({ cocktailId, onBack, session }) {
  const [drink, setDrink] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let isMounted = true

    fetchCocktailById(cocktailId)
      .then((cocktail) => {
        if (!isMounted) {
          return
        }

        setDrink(cocktail)
        setStatus(cocktail ? 'ready' : 'empty')
      })
      .catch(() => {
        if (isMounted) {
          setStatus('error')
        }
      })

    return () => {
      isMounted = false
    }
  }, [cocktailId])

  const detail = drink?.detail

  return (
    <section className="cocktail-detail-screen">
      <header className="detail-page-header">
        <button className="detail-back-button" type="button" aria-label="이전 화면으로 돌아가기" onClick={onBack}>
          <BackIcon />
        </button>
        <div>
          <span className="eyebrow dark">Cocktail detail</span>
          <h1>상세보기</h1>
        </div>
      </header>

      {status === 'loading' ? (
        <div className="state-panel">
          <strong>칵테일 정보를 불러오는 중입니다.</strong>
          <p>저장된 DB에서 상세 정보를 확인하고 있어요.</p>
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="state-panel">
          <strong>상세 정보를 불러오지 못했어요.</strong>
          <p>Supabase 연결 상태를 확인한 뒤 다시 시도해주세요.</p>
        </div>
      ) : null}

      {status === 'empty' ? (
        <div className="state-panel">
          <strong>칵테일을 찾지 못했어요.</strong>
          <p>목록으로 돌아가 다른 칵테일을 선택해주세요.</p>
        </div>
      ) : null}

      {drink && detail ? (
        <section className="detail-sheet detail-page-card" aria-label={`${drink.name} 상세 정보`}>
          <div className="detail-hero">
            {drink.imageUrl ? <img alt="" src={drink.imageUrl} /> : null}
          </div>

          <div className="detail-copy">
            <span className="eyebrow dark">Recipe note</span>
            <h2>{drink.name}</h2>
            <p>{detail.sourceName !== drink.name ? detail.sourceName : detail.category}</p>
          </div>

          <div className="detail-meta-grid">
            <span><strong>분류</strong>{detail.category}</span>
            <span><strong>글라스</strong>{detail.glass}</span>
            <span><strong>타입</strong>{detail.alcoholic}</span>
          </div>

          <section className="detail-section">
            <h3>재료</h3>
            <div className="ingredient-list">
              {detail.ingredients.length > 0 ? detail.ingredients.map((item, index) => (
                <div className="ingredient-row" key={`${item.ingredient}-${index}`}>
                  <span>{item.ingredient}</span>
                  <strong>{item.measure || '적당량'}</strong>
                </div>
              )) : <p>재료 정보가 아직 준비되지 않았습니다.</p>}
            </div>
          </section>

          <section className="detail-section">
            <h3>제조법</h3>
            <p>{detail.instructions}</p>
          </section>

          <DrinkNotePanel drink={drink} session={session} />
        </section>
      ) : null}
    </section>
  )
}

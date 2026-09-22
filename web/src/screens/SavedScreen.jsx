import { useEffect, useState } from 'react'
import { HeartIcon } from '../components/icons'
import { fetchFavoriteDrinks } from '../services/favoriteService'

export function SavedScreen({ onOpenDrinkDetail, onSaveDrink, refreshKey, session }) {
  const [favorites, setFavorites] = useState([])
  const [status, setStatus] = useState('loading')
  const viewStatus = session?.user ? status : 'signedOut'

  useEffect(() => {
    if (!session?.user) {
      return undefined
    }

    let isMounted = true

    fetchFavoriteDrinks()
      .then((favoriteDrinks) => {
        if (isMounted) {
          setFavorites(favoriteDrinks)
          setStatus(favoriteDrinks.length > 0 ? 'ready' : 'empty')
        }
      })
      .catch(() => {
        if (isMounted) {
          setFavorites([])
          setStatus('error')
        }
      })

    return () => {
      isMounted = false
    }
  }, [refreshKey, session])

  return (
    <section className="search-screen saved-screen">
      <header className="page-header">
        <span className="eyebrow dark">Saved drinks</span>
        <h1>관심 저장</h1>
        <p>하트로 저장한 칵테일 레시피를 계정별로 모아봅니다.</p>
      </header>

      {viewStatus === 'signedOut' ? (
        <div className="state-panel">
          <strong>로그인이 필요합니다.</strong>
          <p>계정으로 로그인하면 관심 목록을 저장하고 다시 확인할 수 있습니다.</p>
        </div>
      ) : null}

      {viewStatus === 'loading' ? (
        <div className="state-panel">
          <strong>관심 목록을 불러오는 중입니다.</strong>
          <p>내 계정에 저장된 칵테일을 확인하고 있어요.</p>
        </div>
      ) : null}

      {viewStatus === 'empty' ? (
        <div className="state-panel">
          <strong>아직 저장한 칵테일이 없어요.</strong>
          <p>홈이나 탐색 화면에서 마음에 드는 레시피의 하트를 눌러보세요.</p>
        </div>
      ) : null}

      {viewStatus === 'error' ? (
        <div className="state-panel">
          <strong>관심 목록을 불러오지 못했어요.</strong>
          <p>Supabase 권한이나 네트워크 상태를 확인한 뒤 다시 시도해주세요.</p>
        </div>
      ) : null}

      <div className="search-results">
        {favorites.map((drink) => (
          <article className="search-result-card" key={drink.favoriteId} onClick={() => onOpenDrinkDetail(drink)}>
            <div className="search-result-art" aria-hidden="true">
              {drink.imageUrl ? <img alt="" src={drink.imageUrl} /> : null}
            </div>
            <div>
              <span>{drink.meta}</span>
              <h2>{drink.name}</h2>
              <p>{drink.note}</p>
            </div>
            <button
              className="save-button saved"
              aria-pressed="true"
              onClick={(event) => {
                event.stopPropagation()
                onSaveDrink(drink)
              }}
              type="button"
              aria-label={`${drink.name} 저장 해제`}
            >
              <HeartIcon />
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

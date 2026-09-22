import { useEffect, useState } from 'react'
import { BackIcon } from '../components/icons'
import { fetchWineById } from '../services/wineService'

export function WineDetailPage({ onBack, wineId }) {
  const [wine, setWine] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let isMounted = true

    fetchWineById(wineId)
      .then((nextWine) => {
        if (!isMounted) {
          return
        }

        setWine(nextWine)
        setStatus(nextWine ? 'ready' : 'empty')
      })
      .catch(() => {
        if (isMounted) {
          setStatus('error')
        }
      })

    return () => {
      isMounted = false
    }
  }, [wineId])

  const detail = wine?.detail
  const pairings = Array.isArray(detail?.pairings) ? detail.pairings : []
  const grapes = Array.isArray(detail?.grapes) ? detail.grapes : []

  return (
    <section className="cocktail-detail-screen wine-detail-screen">
      <header className="detail-page-header">
        <button className="detail-back-button" type="button" aria-label="이전 화면으로 돌아가기" onClick={onBack}>
          <BackIcon />
        </button>
        <div>
          <span className="eyebrow dark">Wine detail</span>
          <h1>와인 상세보기</h1>
        </div>
      </header>

      {status === 'loading' ? (
        <div className="state-panel">
          <strong>와인 정보를 불러오는 중입니다.</strong>
          <p>Supabase에 저장된 와인 상세 정보를 확인하고 있어요.</p>
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
          <strong>와인을 찾지 못했어요.</strong>
          <p>목록으로 돌아가 다른 와인을 선택해주세요.</p>
        </div>
      ) : null}

      {wine && detail ? (
        <section className="detail-sheet detail-page-card" aria-label={`${wine.name} 상세 정보`}>
          <div className="detail-hero">
            {wine.imageUrl ? <img alt="" src={wine.imageUrl} /> : null}
          </div>

          <div className="detail-copy">
            <span className="eyebrow dark">Tasting note</span>
            <h2>{wine.name}</h2>
            <p>{detail.winery}</p>
          </div>

          <div className="detail-meta-grid">
            <span><strong>지역</strong>{[detail.country, detail.region].filter(Boolean).join(' · ') || '지역 정보 없음'}</span>
            <span><strong>바디감</strong>{detail.body || '정보 없음'}</span>
            <span><strong>산미</strong>{detail.acidity || '정보 없음'}</span>
          </div>

          <section className="detail-section">
            <h3>와인 설명</h3>
            <p>{detail.description || wine.note || '와인 설명이 아직 준비되지 않았습니다.'}</p>
          </section>

          <section className="detail-section">
            <h3>포도 품종</h3>
            <div className="ingredient-list">
              {grapes.length > 0 ? grapes.map((grape, index) => (
                <div className="ingredient-row" key={`${String(grape)}-${index}`}>
                  <span>{formatDetailItem(grape)}</span>
                  <strong>Grape</strong>
                </div>
              )) : <p>포도 품종 정보가 아직 준비되지 않았습니다.</p>}
            </div>
          </section>

          <section className="detail-section">
            <h3>페어링</h3>
            <div className="ingredient-list">
              {pairings.length > 0 ? pairings.map((pairing, index) => (
                <div className="ingredient-row" key={`${String(pairing)}-${index}`}>
                  <span>{formatPairingItem(pairing)}</span>
                  <strong>Pairing</strong>
                </div>
              )) : <p>페어링 정보가 아직 준비되지 않았습니다.</p>}
            </div>
          </section>
        </section>
      ) : null}
    </section>
  )
}

const pairingKoMap = {
  beef: '소고기',
  pasta: '파스타',
  lamb: '양고기',
  'game meat': '진한 육류',
  'maturated cheese': '숙성 치즈',
  'hard cheese': '하드 치즈',
  poultry: '가금류',
  pork: '돼지고기',
  seafood: '해산물',
  fish: '생선',
  shellfish: '조개류',
  dessert: '디저트',
}

function formatDetailItem(item) {
  if (typeof item === 'string') {
    return item
  }

  if (item?.name) {
    return item.name
  }

  if (item?.label) {
    return item.label
  }

  return '정보 없음'
}

function formatPairingItem(item) {
  if (typeof item === 'string') {
    return pairingKoMap[item.toLowerCase()] || item
  }

  if (item?.food) {
    const food = String(item.food)
    const translatedFood = pairingKoMap[food.toLowerCase()] || food
    return item.notes ? `${translatedFood} · ${item.notes}` : translatedFood
  }

  return formatDetailItem(item)
}

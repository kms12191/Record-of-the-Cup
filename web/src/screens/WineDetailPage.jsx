import { useEffect, useState } from 'react'
import { DrinkNotePanel } from '../components/DrinkNotePanel'
import { BackIcon } from '../components/icons'
import { fetchWineById, translateWineGrape, translateWinePairing } from '../services/wineService'

export function WineDetailPage({ onBack, session, wineId }) {
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
            <div className="detail-meta-card"><strong>지역</strong>{[detail.country, detail.region].filter(Boolean).join(' · ') || '지역 정보 없음'}</div>
            <div className="detail-meta-card"><strong>바디감</strong>{renderIntensity(detail.body)}</div>
            <div className="detail-meta-card"><strong>산미</strong>{renderIntensity(detail.acidity)}</div>
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
                  <span>{translateWineGrape(grape)}</span>
                  <strong>품종</strong>
                </div>
              )) : <p>포도 품종 정보가 아직 준비되지 않았습니다.</p>}
            </div>
          </section>

          <section className="detail-section">
            <h3>페어링</h3>
            <div className="ingredient-list">
              {pairings.length > 0 ? pairings.map((pairing, index) => (
                <div className="ingredient-row" key={`${String(pairing)}-${index}`}>
                  <span>{translateWinePairing(pairing)}</span>
                  <strong>페어링</strong>
                </div>
              )) : <p>페어링 정보가 아직 준비되지 않았습니다.</p>}
            </div>
          </section>

          <DrinkNotePanel drink={wine} session={session} />
        </section>
      ) : null}
    </section>
  )
}

function renderIntensity(profile) {
  if (!profile) {
    return '정보 없음'
  }

  if (!profile.score) {
    return profile.label || '정보 없음'
  }

  const score = normalizeIntensityScore(profile.score)

  return (
    <span className="wine-rating-stars" aria-label={`${profile.label}, 5점 만점에 ${score}점`}>
      <span className="wine-stars-meter" aria-hidden="true">
        <span className="wine-stars-base">★★★★★</span>
        <span className="wine-stars-fill" style={{ width: `${(score / 5) * 100}%` }}>★★★★★</span>
      </span>
      <em>{profile.label} · {score}/5</em>
    </span>
  )
}

function normalizeIntensityScore(score) {
  const numericScore = Number(score) || 0
  const halfStepScore = Math.round(numericScore * 2) / 2
  return Math.max(0, Math.min(5, halfStepScore))
}

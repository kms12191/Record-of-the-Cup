import { supabase } from '../lib/supabaseClient'

const wineColumns = `
  id,
  external_id,
  wine_type,
  wine_type_ko,
  name,
  name_ko,
  winery,
  winery_ko,
  country,
  region,
  rating_average,
  rating_reviews,
  image_url,
  wineapi_status,
  body,
  acidity,
  description,
  grapes,
  pairings
`

const wineTypeMap = {
  레드: 'red',
  화이트: 'white',
  스파클링: 'sparkling',
  로제: 'rose',
  디저트: 'dessert',
  포트: 'port',
}

const wineRatingMap = {
  '5.0 이상': 5,
  '4.5 이상': 4.5,
  '4.0 이상': 4,
  '3.5 이상': 3.5,
  '3.0 이상': 3,
  '2.5 이상': 2.5,
  '2.0 이상': 2,
  '1.5 이상': 1.5,
  '1.0 이상': 1,
  '0.5 이상': 0.5,
}

const wineBodyFilterMap = {
  '바디감 2/5': 'light-bodied',
  '바디감 3/5': 'medium-bodied',
  '바디감 4/5': 'full-bodied',
  '바디감 5/5': 'very full-bodied',
}

const wineAcidityFilterMap = {
  '산미 2/5': 'low',
  '산미 3/5': 'medium',
  '산미 5/5': 'high',
}


export async function fetchFeaturedWines(limit = 1) {
  const { count, error: countError } = await supabase
    .from('wines')
    .select('id', { count: 'exact', head: true })
    .eq('wineapi_status', 'matched')
    .not('image_url', 'is', null)

  if (countError) {
    throw countError
  }

  const total = count || 0

  if (total === 0) {
    return []
  }

  const start = Math.max(0, Math.floor(Math.random() * Math.max(1, total - limit + 1)))
  const end = start + limit - 1

  const { data, error } = await supabase
    .from('wines')
    .select(wineColumns)
    .eq('wineapi_status', 'matched')
    .not('image_url', 'is', null)
    .order('id', { ascending: true })
    .range(start, end)

  if (error) {
    throw error
  }

  return data.map(toWineCard)
}

export async function searchWines(query = '', page = 1, pageSize = 20, filters = {}) {
  const normalizedQuery = query.trim()
  const currentPage = Math.max(1, page)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize - 1
  let request = supabase
    .from('wines')
    .select(wineColumns, { count: 'exact' })
    .eq('wineapi_status', 'matched')
    .order('rating_average', { ascending: false, nullsFirst: false })
    .range(start, end)

  if (normalizedQuery) {
    const escapedQuery = normalizedQuery.replaceAll(',', ' ')
    request = request.or([
      `name.ilike.%${escapedQuery}%`,
      `name_ko.ilike.%${escapedQuery}%`,
      `winery.ilike.%${escapedQuery}%`,
      `winery_ko.ilike.%${escapedQuery}%`,
      `country.ilike.%${escapedQuery}%`,
      `region.ilike.%${escapedQuery}%`,
      `description.ilike.%${escapedQuery}%`,
    ].join(','))
  }

  if (filters.wineType) {
    request = request.eq('wine_type', wineTypeMap[filters.wineType] || filters.wineType)
  }

  if (filters.rating) {
    request = request.gte('rating_average', wineRatingMap[filters.rating] || Number(filters.rating))
  }

  if (filters.body && wineBodyFilterMap[filters.body]) {
    request = request.eq('body', wineBodyFilterMap[filters.body])
  }

  if (filters.acidity && wineAcidityFilterMap[filters.acidity]) {
    request = request.eq('acidity', wineAcidityFilterMap[filters.acidity])
  }

  const { count, data, error } = await request

  if (error) {
    throw error
  }

  return {
    items: data.map(toWineCard),
    totalCount: count || 0,
  }
}


export async function fetchWineById(wineId) {
  const { data, error } = await supabase
    .from('wines')
    .select(wineColumns)
    .eq('id', wineId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? toWineCard(data) : null
}

function toWineCard(wine) {
  const displayName = wine.name_ko || wine.name
  const winery = wine.winery_ko || wine.winery || '와이너리 정보 없음'
  const location = [wine.country, wine.region].filter(Boolean).join(' · ') || '지역 정보 없음'
  const rating = wine.rating_average ? `평점 ${wine.rating_average}` : '평점 정보 없음'
  const bodyProfile = getIntensityProfile(wine.body, bodyProfileMap)
  const acidityProfile = getIntensityProfile(wine.acidity, acidityProfileMap)
  const grapes = Array.isArray(wine.grapes) ? wine.grapes : []
  const pairings = Array.isArray(wine.pairings) ? wine.pairings : []
  const tasteNotes = [bodyProfile?.summary, acidityProfile?.summary].filter(Boolean).join(' · ')
  const note = wine.description || buildFallbackNote(wine, winery, location, { bodyProfile, acidityProfile, grapes, pairings })

  return {
    id: wine.id,
    name: displayName,
    type: 'Wine',
    note: truncateText(note, 76),
    meta: `${wine.wine_type_ko || '와인'} · ${rating} · ${tasteNotes || location}`,
    imageUrl: wine.image_url,
    detail: {
      acidity: acidityProfile,
      body: bodyProfile,
      country: wine.country,
      description: note,
      grapes,
      pairings,
      rating,
      region: wine.region,
      source: 'sampleapis',
      winery,
    },
  }
}

const bodyProfileMap = {
  'light-bodied': { label: '가벼움', score: 2, summary: '바디감 2/5' },
  'medium-bodied': { label: '중간', score: 3, summary: '바디감 3/5' },
  'full-bodied': { label: '묵직함', score: 4, summary: '바디감 4/5' },
  'very full-bodied': { label: '매우 묵직함', score: 5, summary: '바디감 5/5' },
}

const acidityProfileMap = {
  low: { label: '낮음', score: 2, summary: '산미 2/5' },
  medium: { label: '중간', score: 3, summary: '산미 3/5' },
  high: { label: '높음', score: 5, summary: '산미 5/5' },
}

const grapeKoMap = {
  'Cabernet Sauvignon': '카베르네 소비뇽',
  Malbec: '말벡',
  'Syrah/Shiraz': '시라 / 쉬라즈',
  Syrah: '시라',
  Shiraz: '쉬라즈',
  'Petit Verdot': '쁘띠 베르도',
  Merlot: '메를로',
  'Pinot Noir': '피노 누아',
  Nebbiolo: '네비올로',
  Chardonnay: '샤르도네',
  Riesling: '리슬링',
  'Sauvignon Blanc': '소비뇽 블랑',
  Sangiovese: '산지오베제',
  Tempranillo: '템프라니요',
  Grenache: '그르나슈',
  Moscato: '모스카토',
  Zinfandel: '진판델',
}

const pairingKoMap = {
  beef: '소고기',
  pasta: '파스타',
  lamb: '양고기',
  'game meat': '진한 육류',
  'maturated cheese': '숙성 치즈',
  'hard cheese': '하드 치즈',
  poultry: '가금류',
  'spicy food': '매운 음식',
  veal: '송아지 고기',
  pork: '돼지고기',
  seafood: '해산물',
  fish: '생선',
  shellfish: '조개류',
  dessert: '디저트',
}

function buildFallbackNote(wine, winery, location, { acidityProfile, bodyProfile, grapes, pairings }) {
  const wineType = wine.wine_type_ko || '와인'
  const grapeText = formatList(getTranslatedGrapes(grapes).slice(0, 2))
  const pairingText = formatList(getTranslatedPairings(pairings).slice(0, 3))
  const bodyText = bodyProfile ? `${bodyProfile.label} 바디감(${bodyProfile.score}/5)` : '바디감 정보는 준비 중'
  const acidityText = acidityProfile ? `${acidityProfile.label} 산미(${acidityProfile.score}/5)` : '산미 정보는 준비 중'
  const grapeSentence = grapeText ? `${grapeText} 품종의 특징이 중심이 됩니다.` : '품종 정보는 아직 보강 중입니다.'
  const pairingSentence = pairingText ? `${pairingText}와 잘 어울리는 편입니다.` : '페어링 정보는 아직 보강 중입니다.'

  return `${winery}의 ${wineType}입니다. ${location} 지역 기반의 와인으로, ${bodyText}과 ${acidityText}을 참고해 고르면 좋습니다. ${grapeSentence} ${pairingSentence}`
}

function getIntensityProfile(value, profileMap) {
  if (!value) {
    return null
  }

  const key = value.toLowerCase().trim()
  return profileMap[key] || { label: value, score: null, summary: value }
}

function getTranslatedGrapes(grapes) {
  return grapes
    .map((grape) => typeof grape === 'string' ? grape : grape?.name)
    .filter(Boolean)
    .map((grape) => grapeKoMap[grape] || grape)
}

function getTranslatedPairings(pairings) {
  return pairings
    .map((pairing) => typeof pairing === 'string' ? pairing : pairing?.food || pairing?.name)
    .filter(Boolean)
    .map((pairing) => pairingKoMap[String(pairing).toLowerCase()] || pairing)
}

function formatList(items) {
  return items.filter(Boolean).join(', ')
}

export function translateWineGrape(grape) {
  const grapeName = typeof grape === 'string' ? grape : grape?.name
  return grapeName ? grapeKoMap[grapeName] || grapeName : '정보 없음'
}

export function translateWinePairing(pairing) {
  const pairingName = typeof pairing === 'string' ? pairing : pairing?.food || pairing?.name
  return pairingName ? pairingKoMap[String(pairingName).toLowerCase()] || pairingName : '정보 없음'
}

function truncateText(value, maxLength) {
  if (!value || value.length <= maxLength) {
    return value || '와인 설명이 아직 준비되지 않았습니다.'
  }

  return `${value.slice(0, maxLength).trim()}...`
}

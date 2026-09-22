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
  const tasteNotes = [wine.body, wine.acidity].filter(Boolean).join(' · ')
  const note = wine.description || buildFallbackNote(wine, winery, location)

  return {
    id: wine.id,
    name: displayName,
    type: 'Wine',
    note: truncateText(note, 76),
    meta: `${wine.wine_type_ko || '와인'} · ${rating} · ${tasteNotes || location}`,
    imageUrl: wine.image_url,
    detail: {
      acidity: wine.acidity,
      body: wine.body,
      country: wine.country,
      description: note,
      grapes: Array.isArray(wine.grapes) ? wine.grapes : [],
      pairings: Array.isArray(wine.pairings) ? wine.pairings : [],
      rating,
      region: wine.region,
      source: 'sampleapis',
      winery,
    },
  }
}

function buildFallbackNote(wine, winery, location) {
  return `${winery}의 ${wine.wine_type_ko || '와인'}입니다. ${location} 기반의 와인 정보와 평점 데이터를 확인할 수 있습니다.`
}

function truncateText(value, maxLength) {
  if (!value || value.length <= maxLength) {
    return value || '와인 설명이 아직 준비되지 않았습니다.'
  }

  return `${value.slice(0, maxLength).trim()}...`
}

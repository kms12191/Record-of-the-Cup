import { supabase } from '../lib/supabaseClient'

const cocktailColumns = `
  external_id,
  name,
  name_ko,
  category,
  category_ko,
  alcoholic,
  alcoholic_ko,
  glass,
  glass_ko,
  instructions,
  instructions_ko,
  image_url,
  ingredients,
  ingredients_ko
`

export async function fetchFeaturedCocktails(limit = 1) {
  const { count, error: countError } = await supabase
    .from('cocktails')
    .select('external_id', { count: 'exact', head: true })
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
    .from('cocktails')
    .select(cocktailColumns)
    .not('image_url', 'is', null)
    .order('external_id', { ascending: true })
    .range(start, end)

  if (error) {
    throw error
  }

  return data.map(toDrinkCard)
}

function toDrinkCard(cocktail) {
  const displayName = cocktail.name_ko || cocktail.name
  const category = cocktail.category_ko || cocktail.category || '칵테일'
  const glass = cocktail.glass_ko || cocktail.glass || '글라스 정보 없음'
  const alcoholic = cocktail.alcoholic_ko || cocktail.alcoholic || '도수 정보 없음'
  const instructions = cocktail.instructions_ko || cocktail.instructions || '제조법 정보가 아직 준비되지 않았습니다.'

  return {
    id: cocktail.external_id,
    name: displayName,
    type: 'Cocktail',
    note: truncateText(instructions, 54),
    meta: `${category} · ${glass} · ${alcoholic}`,
    imageUrl: cocktail.image_url,
    detail: {
      alcoholic,
      category,
      glass,
      ingredients: getDisplayIngredients(cocktail),
      instructions,
      sourceName: cocktail.name,
    },
  }
}

function getDisplayIngredients(cocktail) {
  const translatedIngredients = Array.isArray(cocktail.ingredients_ko) ? cocktail.ingredients_ko : []
  const originalIngredients = Array.isArray(cocktail.ingredients) ? cocktail.ingredients : []
  const source = translatedIngredients.length > 0 ? translatedIngredients : originalIngredients

  return source.map((item, index) => {
    const originalItem = originalIngredients[index] || {}
    const ingredient = item.ingredient || originalItem.ingredient || '재료 정보 없음'
    const measure = item.measure || originalItem.measure || ''

    return {
      ingredient,
      measure,
    }
  })
}

function truncateText(value, maxLength) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength).trim()}...`
}

export async function fetchCocktailById(cocktailId) {
  const { data, error } = await supabase
    .from('cocktails')
    .select(cocktailColumns)
    .eq('external_id', cocktailId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? toDrinkCard(data) : null
}

export async function searchCocktails(query = '', page = 1, pageSize = 20, filters = {}) {
  const normalizedQuery = query.trim()
  const currentPage = Math.max(1, page)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize - 1
  let request = supabase
    .from('cocktails')
    .select(cocktailColumns, { count: 'exact' })
    .order('name', { ascending: true })
    .range(start, end)

  if (normalizedQuery) {
    const escapedQuery = normalizedQuery.replaceAll(',', ' ')
    request = request.or([
      `name.ilike.%${escapedQuery}%`,
      `name_ko.ilike.%${escapedQuery}%`,
      `category.ilike.%${escapedQuery}%`,
      `category_ko.ilike.%${escapedQuery}%`,
      `glass.ilike.%${escapedQuery}%`,
      `glass_ko.ilike.%${escapedQuery}%`,
    ].join(','))
  }

  if (filters.alcoholic) {
    request = request.eq('alcoholic_ko', filters.alcoholic)
  }

  if (filters.category) {
    request = request.eq('category_ko', filters.category)
  }

  const { count, data, error } = await request

  if (error) {
    throw error
  }

  return {
    items: data.map(toDrinkCard),
    totalCount: count || 0,
  }
}

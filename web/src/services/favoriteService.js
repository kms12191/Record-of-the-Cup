import { supabase } from '../lib/supabaseClient'

export async function saveFavoriteDrink(userId, drink) {
  const favorite = {
    user_id: userId,
    drink_type: drink.type.toLowerCase(),
    source: drink.type === 'Cocktail' ? 'cocktaildb' : drink.detail?.source || 'manual',
    external_id: drink.id || null,
    drink_name: drink.name,
    image_url: drink.imageUrl || null,
  }

  if (favorite.external_id) {
    const { data: existingFavorite, error: selectError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('drink_type', favorite.drink_type)
      .eq('source', favorite.source)
      .eq('external_id', favorite.external_id)
      .maybeSingle()

    if (selectError) {
      throw selectError
    }

    if (existingFavorite) {
      return existingFavorite
    }
  }

  const { data, error } = await supabase
    .from('favorites')
    .insert(favorite)
    .select('id, user_id, drink_type, source, external_id, drink_name, image_url, created_at')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function deleteFavoriteDrink(userId, drink) {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('drink_type', drink.type.toLowerCase())
    .eq('source', drink.type === 'Cocktail' ? 'cocktaildb' : drink.detail?.source || 'manual')
    .eq('external_id', drink.id)

  if (error) {
    throw error
  }
}

export async function fetchFavoriteDrinkIds() {
  const { data, error } = await supabase
    .from('favorites')
    .select('external_id')
    .in('drink_type', ['cocktail', 'wine'])
    .not('external_id', 'is', null)

  if (error) {
    throw error
  }

  return data.map((favorite) => favorite.external_id)
}

export async function fetchFavoriteDrinks() {
  const { data, error } = await supabase
    .from('favorites')
    .select('id, drink_type, source, external_id, drink_name, image_url, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  const favorites = data || []
  const catalogByKey = await fetchCatalogSummaries(favorites)

  return favorites.map((favorite) => toFavoriteCard(favorite, catalogByKey))
}

async function fetchCatalogSummaries(items) {
  const cocktailIds = getExternalIdsByType(items, 'cocktail')
  const wineIds = getExternalIdsByType(items, 'wine')
  const [cocktails, wines] = await Promise.all([
    fetchCocktailSummaries(cocktailIds),
    fetchWineSummaries(wineIds),
  ])

  return [...cocktails, ...wines].reduce((catalogByKey, drink) => {
    catalogByKey[getCatalogKey(drink.type, drink.id)] = drink
    return catalogByKey
  }, {})
}

async function fetchCocktailSummaries(ids) {
  if (ids.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('cocktails')
    .select('external_id, name, name_ko, image_url')
    .in('external_id', ids)

  if (error) {
    throw error
  }

  return (data || []).map((cocktail) => ({
    id: cocktail.external_id,
    imageUrl: cocktail.image_url,
    name: cocktail.name_ko || cocktail.name,
    type: 'cocktail',
  }))
}

async function fetchWineSummaries(ids) {
  if (ids.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('wines')
    .select('id, name, name_ko, image_url')
    .in('id', ids)

  if (error) {
    throw error
  }

  return (data || []).map((wine) => ({
    id: wine.id,
    imageUrl: wine.image_url,
    name: wine.name_ko || wine.name,
    type: 'wine',
  }))
}

function getExternalIdsByType(items, drinkType) {
  return [...new Set(items
    .filter((item) => item.drink_type === drinkType && item.external_id)
    .map((item) => item.external_id))]
}

function toFavoriteCard(favorite, catalogByKey) {
  const catalogDrink = catalogByKey[getCatalogKey(favorite.drink_type, favorite.external_id)]
  const drinkName = catalogDrink?.name || favorite.drink_name

  return {
    id: favorite.external_id || favorite.id,
    favoriteId: favorite.id,
    imageUrl: catalogDrink?.imageUrl || favorite.image_url,
    meta: `${toDrinkTypeLabel(favorite.drink_type)} · 저장됨`,
    name: drinkName,
    note: '관심 목록에 저장한 한 잔입니다.',
    type: toDrinkTypeLabel(favorite.drink_type),
  }
}

function getCatalogKey(drinkType, externalId) {
  return `${drinkType}:${externalId}`
}

function toDrinkTypeLabel(drinkType) {
  if (drinkType === 'cocktail') {
    return 'Cocktail'
  }

  if (drinkType === 'wine') {
    return 'Wine'
  }

  return 'Whiskey'
}

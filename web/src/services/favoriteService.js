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

  return data.map(toFavoriteCard)
}

function toFavoriteCard(favorite) {
  return {
    id: favorite.external_id || favorite.id,
    favoriteId: favorite.id,
    imageUrl: favorite.image_url,
    meta: `${toDrinkTypeLabel(favorite.drink_type)} · 저장됨`,
    name: favorite.drink_name,
    note: '관심 목록에 저장한 한 잔입니다.',
    type: toDrinkTypeLabel(favorite.drink_type),
  }
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

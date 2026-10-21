import { supabase } from '../lib/supabaseClient'

export async function fetchRecentDrinkNotes(userId, limit = 1) {
  const { data, error } = await supabase
    .from('drink_notes')
    .select('id, drink_type, source, external_id, drink_name, note, updated_at, created_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return hydrateDrinkNotes(data || [])
}

export async function fetchDrinkNotes(userId) {
  const { data, error } = await supabase
    .from('drink_notes')
    .select('id, drink_type, source, external_id, drink_name, note, updated_at, created_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    throw error
  }

  return hydrateDrinkNotes(data || [])
}

export async function fetchDrinkNote(userId, drink) {
  const identity = getDrinkNoteIdentity(userId, drink)

  const { data, error } = await supabase
    .from('drink_notes')
    .select('id, note, updated_at')
    .eq('user_id', identity.user_id)
    .eq('drink_type', identity.drink_type)
    .eq('source', identity.source)
    .eq('external_id', identity.external_id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function saveDrinkNote(userId, drink, note, noteId = null) {
  const identity = getDrinkNoteIdentity(userId, drink)
  const payload = {
    ...identity,
    drink_name: drink.name,
    note: note.trim(),
  }

  if (noteId) {
    const { data, error } = await supabase
      .from('drink_notes')
      .update(payload)
      .eq('id', noteId)
      .eq('user_id', userId)
      .select('id, note, updated_at')
      .single()

    if (error) {
      throw error
    }

    return data
  }

  const existingNote = await fetchDrinkNote(userId, drink)

  if (existingNote?.id) {
    return saveDrinkNote(userId, drink, note, existingNote.id)
  }

  const { data, error } = await supabase
    .from('drink_notes')
    .insert(payload)
    .select('id, note, updated_at')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function deleteDrinkNote(userId, noteId) {
  if (!noteId) {
    return
  }

  const { error } = await supabase
    .from('drink_notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}

async function hydrateDrinkNotes(notes) {
  const catalogByKey = await fetchCatalogSummaries(notes)
  return notes.map((note) => toDrinkNoteCard(note, catalogByKey))
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
    .select('external_id, name, name_ko')
    .in('external_id', ids)

  if (error) {
    throw error
  }

  return (data || []).map((cocktail) => ({
    id: cocktail.external_id,
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
    .select('id, name, name_ko')
    .in('id', ids)

  if (error) {
    throw error
  }

  return (data || []).map((wine) => ({
    id: wine.id,
    name: wine.name_ko || wine.name,
    type: 'wine',
  }))
}

function getExternalIdsByType(items, drinkType) {
  return [...new Set(items
    .filter((item) => item.drink_type === drinkType && item.external_id)
    .map((item) => item.external_id))]
}

function getDrinkNoteIdentity(userId, drink) {
  return {
    user_id: userId,
    drink_type: drink.type.toLowerCase(),
    source: drink.type === 'Cocktail' ? 'cocktaildb' : drink.detail?.source || 'manual',
    external_id: drink.id || null,
  }
}

function toDrinkNoteCard(note, catalogByKey) {
  const catalogDrink = catalogByKey[getCatalogKey(note.drink_type, note.external_id)]
  const drinkName = catalogDrink?.name || note.drink_name

  return {
    id: note.id,
    createdAt: note.created_at,
    drink: {
      id: note.external_id,
      name: drinkName,
      type: toDrinkTypeLabel(note.drink_type),
    },
    drinkName,
    drinkType: toDrinkTypeLabel(note.drink_type),
    note: note.note,
    updatedAt: note.updated_at,
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

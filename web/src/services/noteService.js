import { supabase } from '../lib/supabaseClient'

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

function getDrinkNoteIdentity(userId, drink) {
  return {
    user_id: userId,
    drink_type: drink.type.toLowerCase(),
    source: drink.type === 'Cocktail' ? 'cocktaildb' : drink.detail?.source || 'manual',
    external_id: drink.id || null,
  }
}

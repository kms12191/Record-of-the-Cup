import { supabase } from '../lib/supabaseClient'

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return data.session
}

export function subscribeToAuthChanges(handleSession) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    handleSession(session)
  })

  return () => data.subscription.unsubscribe()
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

export async function signUpWithEmail(email, password, nickname) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nickname,
      },
    },
  })

  if (error) {
    throw error
  }

  if (data.user) {
    await saveProfile(data.user.id, {
      nickname: nickname || email.split('@')[0],
      email,
    })
  }

  return data
}

export async function signInWithKakao() {
  const redirectTo = window.location.origin

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo,
    },
  })

  if (error) {
    throw error
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

export async function ensureProfileForSession(session) {
  if (!session?.user) {
    return null
  }

  const existingProfile = await getProfile(session.user.id)

  if (existingProfile) {
    return existingProfile
  }

  const metadata = session.user.user_metadata || {}
  const email = session.user.email || ''
  const nickname = metadata.nickname || metadata.name || metadata.full_name || email.split('@')[0] || 'Record user'

  return saveProfile(session.user.id, {
    avatar_url: metadata.avatar_url || metadata.picture || null,
    nickname,
  })
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url, preferred_types, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function saveProfile(userId, values) {
  const profile = {
    id: userId,
    nickname: values.nickname,
    avatar_url: values.avatar_url ?? null,
    preferred_types: values.preferred_types ?? [],
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select('id, nickname, avatar_url, preferred_types, created_at, updated_at')
    .single()

  if (error) {
    throw error
  }

  return data
}

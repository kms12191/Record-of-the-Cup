import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { cocktailTranslations } from '../data/cocktailTranslations.js'

loadEnvFile(resolve(process.cwd(), '.env'))

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in web/.env')
}

if (!Array.isArray(cocktailTranslations) || cocktailTranslations.length === 0) {
  console.log('No cocktail translations found. Nothing to import.')
  process.exit(0)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

let updatedCount = 0

for (const translation of cocktailTranslations) {
  if (!translation.external_id) {
    throw new Error('Every cocktail translation needs an external_id')
  }

  const updates = {
    name_ko: translation.name_ko || null,
    instructions_ko: translation.instructions_ko || null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('cocktails')
    .update(updates)
    .eq('external_id', translation.external_id)

  if (error) {
    throw new Error(
      `Failed to update ${translation.name || translation.external_id}: ${error.message}`,
    )
  }

  updatedCount += 1
}

console.log(`Updated ${updatedCount} cocktail translations.`)

function loadEnvFile(envPath) {
  let envContent

  try {
    envContent = readFileSync(envPath, 'utf8')
  } catch {
    return
  }

  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue
    }

    const [key, ...valueParts] = trimmed.split('=')
    const value = valueParts.join('=').trim().replace(/^['"]|['"]$/g, '')

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

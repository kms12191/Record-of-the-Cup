import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const wineEndpoints = [
  { type: 'red', typeKo: '레드', url: 'https://api.sampleapis.com/wines/reds' },
  { type: 'white', typeKo: '화이트', url: 'https://api.sampleapis.com/wines/whites' },
  { type: 'sparkling', typeKo: '스파클링', url: 'https://api.sampleapis.com/wines/sparkling' },
  { type: 'rose', typeKo: '로제', url: 'https://api.sampleapis.com/wines/rose' },
  { type: 'dessert', typeKo: '디저트', url: 'https://api.sampleapis.com/wines/dessert' },
  { type: 'port', typeKo: '포트', url: 'https://api.sampleapis.com/wines/port' },
]

const isDryRun = process.argv.includes('--dry-run')
const importedAt = new Date().toISOString()
const wines = []

for (const endpoint of wineEndpoints) {
  const endpointWines = await fetchWines(endpoint)
  wines.push(...endpointWines)
  console.log(`${endpoint.typeKo}: ${endpointWines.length} wines fetched`)
}

if (wines.length === 0) {
  console.log('No wines found. Nothing to import.')
  process.exit(0)
}

if (isDryRun) {
  console.log(`Dry run complete. ${wines.length} wines are ready to import.`)
  console.log('Sample:', JSON.stringify(wines[0], null, 2))
  process.exit(0)
}

loadEnvFile(resolve(process.cwd(), '.env'))

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in web/.env')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const { error } = await supabase
  .from('wines')
  .upsert(wines, { onConflict: 'source,external_id,wine_type' })

if (error) {
  throw error
}

console.log(`Imported ${wines.length} wines into Supabase.`)

async function fetchWines(endpoint) {
  const response = await fetch(endpoint.url)

  if (!response.ok) {
    throw new Error(`Wine API request failed for ${endpoint.type} with ${response.status}`)
  }

  const data = await response.json()

  if (!Array.isArray(data)) {
    return []
  }

  return data.map((wine) => normalizeWine(wine, endpoint))
}

function normalizeWine(wine, endpoint) {
  const locationParts = parseLocation(wine.location)

  return {
    external_id: String(wine.id),
    wine_type: endpoint.type,
    wine_type_ko: endpoint.typeKo,
    name: cleanValue(wine.wine) || 'Unknown wine',
    name_ko: null,
    winery: cleanValue(wine.winery),
    winery_ko: null,
    location: cleanValue(wine.location),
    country: locationParts.country,
    region: locationParts.region,
    rating_average: parseRatingAverage(wine.rating?.average),
    rating_reviews: cleanValue(wine.rating?.reviews),
    image_url: cleanValue(wine.image),
    source: 'sampleapis',
    raw_data: wine,
    updated_at: importedAt,
  }
}

function parseLocation(location) {
  const normalized = cleanValue(location)

  if (!normalized) {
    return { country: null, region: null }
  }

  const [country, ...regionParts] = normalized
    .split('·')
    .map((part) => part.trim())
    .filter(Boolean)

  return {
    country: country || null,
    region: regionParts.join(' · ') || null,
  }
}

function parseRatingAverage(value) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

function cleanValue(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

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

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const wineApiBaseUrl = 'https://api.wineapi.io'
const defaultLimit = 5
const maxLimit = 40
const isDryRun = process.argv.includes('--dry-run')
const limit = getNumberArg('--limit', defaultLimit, maxLimit)

loadEnvFile(resolve(process.cwd(), '.env'))

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const wineApiKey = process.env.WINE_API_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in web/.env')
}

if (!wineApiKey) {
  throw new Error('Missing WINE_API_KEY in web/.env')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const wines = await fetchPendingWines(limit)

if (wines.length === 0) {
  console.log('No wines need WineAPI enrichment.')
  process.exit(0)
}

console.log(`Preparing to enrich ${wines.length} wines with WineAPI.`)

let updatedCount = 0
let skippedCount = 0

for (const wine of wines) {
  const searchQuery = buildSearchQuery(wine)
  const searchData = await requestWineApi(`/wines/search?q=${encodeURIComponent(searchQuery)}&limit=5&offset=0`)
  const match = pickBestMatch(wine, searchData.results || [])

  if (!match) {
    skippedCount += 1
    await markWineAttempt(wine, {
      status: 'skipped',
      error: 'No confident WineAPI match',
    })
    console.log(`Skipped: ${wine.name} - no confident WineAPI match`)
    continue
  }

  let detail

  try {
    detail = await requestWineApi(`/wines/${match.id}`)
  } catch (error) {
    skippedCount += 1
    await markWineAttempt(wine, {
      status: 'error',
      error: error.message,
    })
    console.log(`Error: ${wine.name} - ${error.message}`)
    continue
  }

  const updates = normalizeWineApiDetail(detail, match)

  if (isDryRun) {
    console.log(`Dry run: ${wine.name} -> ${detail.name || match.name}`)
    continue
  }

  const { error } = await supabase
    .from('wines')
    .update(updates)
    .eq('id', wine.id)

  if (error) {
    throw new Error(`Failed to update ${wine.name}: ${error.message}`)
  }

  updatedCount += 1
  console.log(`Updated: ${wine.name} -> ${detail.name || match.name}`)
}

if (isDryRun) {
  console.log(`Dry run complete. ${wines.length - skippedCount} wines matched, ${skippedCount} skipped.`)
} else {
  console.log(`WineAPI enrichment complete. ${updatedCount} updated, ${skippedCount} skipped.`)
}

async function fetchPendingWines(rowLimit) {
  const { data, error } = await supabase
    .from('wines')
    .select('id, name, winery, country, region, rating_average, wineapi_status')
    .eq('wineapi_status', 'pending')
    .order('rating_average', { ascending: false, nullsFirst: false })
    .limit(rowLimit)

  if (error) {
    throw error
  }

  return data || []
}

async function markWineAttempt(wine, { status, error }) {
  if (isDryRun) {
    return
  }

  const { error: updateError } = await supabase
    .from('wines')
    .update({
      wineapi_status: status,
      wineapi_attempt_count: 1,
      wineapi_attempted_at: new Date().toISOString(),
      wineapi_error: error || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', wine.id)

  if (updateError) {
    throw new Error(`Failed to mark ${wine.name} as ${status}: ${updateError.message}`)
  }
}

async function requestWineApi(path) {
  const response = await fetch(`${wineApiBaseUrl}${path}`, {
    headers: {
      'X-API-Key': wineApiKey,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`WineAPI request failed with ${response.status}: ${message}`)
  }

  return response.json()
}

function buildSearchQuery(wine) {
  return [wine.winery, wine.name, wine.region, wine.country]
    .filter(Boolean)
    .join(' ')
}

function pickBestMatch(wine, results) {
  if (!Array.isArray(results) || results.length === 0) {
    return null
  }

  const scoredResults = results.map((result) => ({
    ...result,
    localScore: scoreWineMatch(wine, result),
  }))

  scoredResults.sort((a, b) => b.localScore - a.localScore)

  const bestMatch = scoredResults[0]
  return bestMatch.localScore >= 2 ? bestMatch : null
}

function scoreWineMatch(wine, result) {
  const wineName = normalizeText(wine.name)
  const resultName = normalizeText(result.name)
  const wineWinery = normalizeText(wine.winery)
  const resultWinery = normalizeText(result.winery)
  const wineCountry = normalizeText(wine.country)
  const resultCountry = normalizeText(result.country)
  let score = Number(result.confidence || 0)

  if (wineName && resultName && (resultName.includes(wineName) || wineName.includes(resultName))) {
    score += 2
  }

  if (wineWinery && resultWinery && (resultWinery.includes(wineWinery) || wineWinery.includes(resultWinery))) {
    score += 2
  }

  if (wineCountry && resultCountry && wineCountry === resultCountry) {
    score += 1
  }

  return score
}

function normalizeWineApiDetail(detail, match) {
  return {
    wineapi_id: detail.id || match.id,
    wineapi_status: 'matched',
    wineapi_attempt_count: 1,
    wineapi_attempted_at: new Date().toISOString(),
    wineapi_error: null,
    wineapi_confidence: toNumberOrNull(match.confidence),
    body: cleanValue(detail.body),
    acidity: cleanValue(detail.acidity),
    elaborate: cleanValue(detail.elaborate),
    classification: cleanValue(detail.classification),
    alcohol_content: cleanValue(detail.alcoholContent),
    description: cleanValue(detail.description),
    grapes: Array.isArray(detail.grapes) ? detail.grapes : [],
    pairings: Array.isArray(detail.pairings) ? detail.pairings : [],
    scores: Array.isArray(detail.scores) ? detail.scores : [],
    price_range: detail.priceRange || null,
    prices: Array.isArray(detail.prices) ? detail.prices : [],
    wineapi_raw_data: detail,
    wineapi_updated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function normalizeText(value) {
  return typeof value === 'string'
    ? value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, ' ').replace(/\s+/g, ' ').trim()
    : ''
}

function cleanValue(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function toNumberOrNull(value) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getNumberArg(name, fallback, max) {
  const index = process.argv.indexOf(name)

  if (index === -1) {
    return fallback
  }

  const parsed = Number.parseInt(process.argv[index + 1], 10)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback
  }

  return Math.min(parsed, max)
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

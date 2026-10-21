import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const defaultLimit = 20
const maxLimit = 100
const limit = getNumberArg('--limit', defaultLimit, maxLimit)

loadEnvFile(resolve(process.cwd(), '.env'))

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in web/.env')
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const { data, error } = await supabase
  .from('wines')
  .select('name, winery, country, region, rating_average, wineapi_status, wineapi_error, wineapi_attempt_count, wineapi_attempted_at')
  .in('wineapi_status', ['skipped', 'error'])
  .order('wineapi_status', { ascending: true })
  .order('rating_average', { ascending: false, nullsFirst: false })
  .limit(limit)

if (error) {
  throw error
}

const wines = data || []
const skipped = wines.filter((wine) => wine.wineapi_status === 'skipped')
const failed = wines.filter((wine) => wine.wineapi_status === 'error')

console.log(`WineAPI issues: ${wines.length} shown (limit ${limit})`)
console.log(`skipped: ${skipped.length}`)
console.log(`error:   ${failed.length}`)

printIssueGroup('Skipped wines', skipped)
printIssueGroup('Error wines', failed)

function printIssueGroup(title, items) {
  if (items.length === 0) {
    return
  }

  console.log(`\n${title}`)

  items.forEach((wine, index) => {
    const location = [wine.country, wine.region].filter(Boolean).join(' · ') || 'location unknown'
    const winery = wine.winery || 'winery unknown'
    const attempts = wine.wineapi_attempt_count || 0
    const errorMessage = wine.wineapi_error || 'No error message'

    console.log(`${index + 1}. ${wine.name}`)
    console.log(`   winery: ${winery}`)
    console.log(`   place:  ${location}`)
    console.log(`   rating: ${wine.rating_average || 'unknown'} · attempts: ${attempts}`)
    console.log(`   reason: ${errorMessage}`)
  })
}

function getNumberArg(name, fallback, max) {
  const index = process.argv.indexOf(name)

  if (index === -1) {
    return fallback
  }

  const value = Number.parseInt(process.argv[index + 1], 10)

  if (!Number.isFinite(value) || value <= 0) {
    return fallback
  }

  return Math.min(value, max)
}

function loadEnvFile(filePath) {
  let contents

  try {
    contents = readFileSync(filePath, 'utf8')
  } catch {
    return
  }

  contents.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim()

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return
    }

    const separatorIndex = trimmedLine.indexOf('=')

    if (separatorIndex === -1) {
      return
    }

    const key = trimmedLine.slice(0, separatorIndex).trim()
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/g, '')

    if (!process.env[key]) {
      process.env[key] = value
    }
  })
}

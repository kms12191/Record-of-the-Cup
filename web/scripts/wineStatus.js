import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

loadEnvFile(resolve(process.cwd(), '.env'))

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in web/.env')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const statuses = ['matched', 'pending', 'skipped', 'error']
const counts = {}

for (const status of statuses) {
  counts[status] = await countWinesByStatus(status)
}

const total = await countAllWines()
const processed = total - counts.pending
const matchedProgress = formatPercent(counts.matched, total)
const processedProgress = formatPercent(processed, total)

console.log('Wine enrichment status')
console.log('----------------------')
console.log(`total:     ${total}`)
console.log(`matched:   ${counts.matched}`)
console.log(`pending:   ${counts.pending}`)
console.log(`skipped:   ${counts.skipped}`)
console.log(`error:     ${counts.error}`)
console.log(`processed: ${processed} (${processedProgress})`)
console.log(`app-ready: ${counts.matched} (${matchedProgress})`)
console.log('')
console.log(`remaining pending wines: ${counts.pending}`)
console.log(`estimated days at 50/day: ${formatDays(counts.pending, 50)}`)
console.log(`estimated days at 60/day: ${formatDays(counts.pending, 60)}`)

async function countAllWines() {
  const { count, error } = await supabase
    .from('wines')
    .select('id', { count: 'exact', head: true })

  if (error) {
    throw error
  }

  return count || 0
}

async function countWinesByStatus(status) {
  const { count, error } = await supabase
    .from('wines')
    .select('id', { count: 'exact', head: true })
    .eq('wineapi_status', status)

  if (error) {
    throw error
  }

  return count || 0
}

function formatPercent(value, total) {
  if (!total) {
    return '0.0%'
  }

  return `${((value / total) * 100).toFixed(1)}%`
}

function formatDays(total, dailyCount) {
  if (!total) {
    return '0 days'
  }

  return `${Math.ceil(total / dailyCount)} days`
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

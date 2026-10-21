import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

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

const total = await countCocktails()
const withKoreanName = await countCocktailsWith('name_ko')
const withKoreanCategory = await countCocktailsWith('category_ko')
const withKoreanGlass = await countCocktailsWith('glass_ko')
const withKoreanInstructions = await countCocktailsWith('instructions_ko')
const ingredientRows = await fetchIngredientRows()
const withKoreanIngredients = ingredientRows.filter(hasKoreanIngredients).length

console.log('Cocktail DB status')
console.log(`total:             ${total}`)
console.log(`name_ko:           ${withKoreanName} / ${total}`)
console.log(`category_ko:       ${withKoreanCategory} / ${total}`)
console.log(`glass_ko:          ${withKoreanGlass} / ${total}`)
console.log(`instructions_ko:   ${withKoreanInstructions} / ${total}`)
console.log(`ingredients_ko:    ${withKoreanIngredients} / ${total}`)
console.log(`missing name_ko:   ${Math.max(0, total - withKoreanName)}`)
console.log(`missing recipe ko: ${Math.max(0, total - withKoreanInstructions)}`)

async function countCocktails() {
  const { count, error } = await supabase
    .from('cocktails')
    .select('id', { count: 'exact', head: true })

  if (error) {
    throw error
  }

  return count || 0
}

async function countCocktailsWith(columnName) {
  const { count, error } = await supabase
    .from('cocktails')
    .select('id', { count: 'exact', head: true })
    .not(columnName, 'is', null)

  if (error) {
    throw error
  }

  return count || 0
}

async function fetchIngredientRows() {
  const { data, error } = await supabase
    .from('cocktails')
    .select('ingredients_ko')

  if (error) {
    throw error
  }

  return data || []
}

function hasKoreanIngredients(row) {
  return Array.isArray(row.ingredients_ko) && row.ingredients_ko.length > 0
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

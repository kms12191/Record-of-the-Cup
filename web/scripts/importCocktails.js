import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const cocktailLetters = 'abcdefghijklmnopqrstuvwxyz'.split('')
const cocktailDbBaseUrl = 'https://www.thecocktaildb.com/api/json/v1/1/search.php?f='

const drinkNameKoMap = {
  Margarita: '마가리타',
  'Blue Margarita': '블루 마가리타',
  "Tommy's Margarita": '토미스 마가리타',
  Mojito: '모히토',
  Daiquiri: '다이키리',
  Negroni: '네그로니',
  'Old Fashioned': '올드 패션드',
  Manhattan: '맨해튼',
  Martini: '마티니',
  'Espresso Martini': '에스프레소 마티니',
  'Dry Martini': '드라이 마티니',
  'French Martini': '프렌치 마티니',
  'Dirty Martini': '더티 마티니',
  Cosmopolitan: '코스모폴리탄',
  'Whiskey Sour': '위스키 사워',
  'Amaretto Sour': '아마레토 사워',
  'Pisco Sour': '피스코 사워',
  'Gin Sour': '진 사워',
  'Gin Fizz': '진 피즈',
  'Ramos Gin Fizz': '라모스 진 피즈',
  'Tom Collins': '톰 콜린스',
  'John Collins': '존 콜린스',
  'Long Island Iced Tea': '롱아일랜드 아이스티',
  'Bloody Mary': '블러디 메리',
  'Moscow Mule': '모스코 뮬',
  'Dark and Stormy': '다크 앤 스토미',
  'Mai Tai': '마이타이',
  'Pina Colada': '피나 콜라다',
  'White Russian': '화이트 러시안',
  'Black Russian': '블랙 러시안',
  Sidecar: '사이드카',
  Sazerac: '사제락',
  Gimlet: '김렛',
  Aviation: '에비에이션',
  Boulevardier: '불바디에',
  'French 75': '프렌치 75',
  'Aperol Spritz': '아페롤 스프리츠',
  'Tequila Sunrise': '테킬라 선라이즈',
  'Cuba Libre': '쿠바 리브레',
  'Mint Julep': '민트 줄렙',
  'Singapore Sling': '싱가포르 슬링',
  'Planter’s Punch': '플랜터스 펀치',
  "Planter's Punch": '플랜터스 펀치',
  Caipirinha: '카이피리냐',
  Caipiroska: '카이피로스카',
  Bellini: '벨리니',
  Mimosa: '미모사',
  'Sex on the Beach': '섹스 온 더 비치',
  'Zombie': '좀비',
  'B-52': 'B-52',
  'Irish Coffee': '아이리시 커피',
}

const categoryKoMap = {
  'Ordinary Drink': '칵테일',
  Cocktail: '칵테일',
  Shake: '셰이크',
  'Other / Unknown': '기타',
  Cocoa: '코코아',
  Shot: '샷',
  'Coffee / Tea': '커피 / 차',
  'Homemade Liqueur': '홈메이드 리큐르',
  Punch: '펀치',
  Beer: '맥주',
  'Soft Drink': '무알코올 음료',
}

const alcoholicKoMap = {
  Alcoholic: '알코올',
  'Non alcoholic': '논알코올',
  'Optional alcohol': '알코올 선택 가능',
}

const glassKoMap = {
  'Highball glass': '하이볼 글라스',
  'Cocktail glass': '칵테일 글라스',
  'Old-fashioned glass': '올드 패션드 글라스',
  'Whiskey Glass': '위스키 글라스',
  'Collins glass': '콜린스 글라스',
  'Pousse cafe glass': '푸스 카페 글라스',
  'Champagne flute': '샴페인 플루트',
  'Whiskey sour glass': '위스키 사워 글라스',
  'Cordial glass': '코디얼 글라스',
  'Brandy snifter': '브랜디 스니프터',
  'White wine glass': '화이트 와인 글라스',
  'Nick and Nora Glass': '닉 앤 노라 글라스',
  'Hurricane glass': '허리케인 글라스',
  'Coffee mug': '커피 머그',
  'Shot glass': '샷 글라스',
  'Jar': '자',
  'Irish coffee cup': '아이리시 커피 컵',
  'Punch bowl': '펀치 볼',
  'Pitcher': '피처',
  'Pint glass': '파인트 글라스',
  'Copper Mug': '구리 머그',
  'Wine Glass': '와인 글라스',
  'Beer mug': '맥주 머그',
  'Margarita/Coupette glass': '마가리타 / 쿠페 글라스',
  'Beer pilsner': '필스너 글라스',
  'Beer Glass': '맥주 글라스',
  'Parfait glass': '파르페 글라스',
  'Mason jar': '메이슨 자',
  'Margarita glass': '마가리타 글라스',
  'Martini Glass': '마티니 글라스',
  'Balloon Glass': '벌룬 글라스',
  'Coupe Glass': '쿠페 글라스',
}

const ingredientKoMap = {
  Vodka: '보드카',
  Gin: '진',
  Rum: '럼',
  'Light rum': '라이트 럼',
  'Dark rum': '다크 럼',
  Tequila: '테킬라',
  Whiskey: '위스키',
  Bourbon: '버번',
  Scotch: '스카치',
  Brandy: '브랜디',
  Cognac: '코냑',
  'Triple sec': '트리플 섹',
  'Dry Vermouth': '드라이 베르무트',
  'Sweet Vermouth': '스위트 베르무트',
  Vermouth: '베르무트',
  Campari: '캄파리',
  'Coffee liqueur': '커피 리큐르',
  'Orange liqueur': '오렌지 리큐르',
  'Irish cream': '아이리시 크림',
  Absinthe: '압생트',
  Grenadine: '그레나딘',
  'Simple syrup': '심플 시럽',
  Sugar: '설탕',
  'Sugar syrup': '설탕 시럽',
  Honey: '꿀',
  Milk: '우유',
  Cream: '크림',
  'Heavy cream': '생크림',
  Egg: '달걀',
  'Egg white': '달걀 흰자',
  Lemon: '레몬',
  Lime: '라임',
  Orange: '오렌지',
  Pineapple: '파인애플',
  Cranberries: '크랜베리',
  'Lemon juice': '레몬 주스',
  'Lime juice': '라임 주스',
  'Orange juice': '오렌지 주스',
  'Pineapple juice': '파인애플 주스',
  'Cranberry juice': '크랜베리 주스',
  'Grapefruit juice': '자몽 주스',
  'Tomato juice': '토마토 주스',
  'Soda water': '소다수',
  'Tonic water': '토닉 워터',
  'Ginger ale': '진저 에일',
  'Ginger beer': '진저 비어',
  Cola: '콜라',
  Coffee: '커피',
  Espresso: '에스프레소',
  Chocolate: '초콜릿',
  Cocoa: '코코아',
  Mint: '민트',
  Basil: '바질',
  Salt: '소금',
  Pepper: '후추',
  Bitters: '비터스',
  'Angostura bitters': '앙고스투라 비터스',
  Ice: '얼음',
  Water: '물',
  Wine: '와인',
  Champagne: '샴페인',
  Beer: '맥주',
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

const drinksById = new Map()

for (const letter of cocktailLetters) {
  const drinks = await fetchCocktailsByLetter(letter)

  for (const drink of drinks) {
    drinksById.set(drink.idDrink, normalizeDrink(drink))
  }

  console.log(`${letter.toUpperCase()}: ${drinks.length} drinks fetched`)
}

const cocktails = [...drinksById.values()]

if (cocktails.length === 0) {
  console.log('No cocktails found. Nothing to import.')
  process.exit(0)
}

const { error } = await supabase
  .from('cocktails')
  .upsert(cocktails, { onConflict: 'external_id' })

if (error) {
  throw error
}

console.log(`Imported ${cocktails.length} cocktails into Supabase.`)

async function fetchCocktailsByLetter(letter) {
  const response = await fetch(`${cocktailDbBaseUrl}${letter}`)

  if (!response.ok) {
    throw new Error(`TheCocktailDB request failed for "${letter}" with ${response.status}`)
  }

  const data = await response.json()

  return Array.isArray(data.drinks) ? data.drinks : []
}

function normalizeDrink(drink) {
  const category = cleanValue(drink.strCategory)
  const alcoholic = cleanValue(drink.strAlcoholic)
  const glass = cleanValue(drink.strGlass)
  const ingredients = getIngredients(drink)

  return {
    external_id: drink.idDrink,
    name: drink.strDrink,
    name_ko: translateValue(drink.strDrink, drinkNameKoMap),
    category,
    category_ko: translateValue(category, categoryKoMap),
    alcoholic,
    alcoholic_ko: translateValue(alcoholic, alcoholicKoMap),
    glass,
    glass_ko: translateValue(glass, glassKoMap),
    instructions: drink.strInstructions || null,
    instructions_ko: null,
    image_url: drink.strDrinkThumb || null,
    source: 'cocktaildb',
    ingredients,
    ingredients_ko: translateIngredients(ingredients),
    raw_data: drink,
    updated_at: new Date().toISOString(),
  }
}

function getIngredients(drink) {
  return Array.from({ length: 15 }, (_, index) => {
    const number = index + 1
    const ingredient = cleanValue(drink[`strIngredient${number}`])
    const measure = cleanValue(drink[`strMeasure${number}`])

    return ingredient ? { ingredient, measure } : null
  }).filter(Boolean)
}

function translateIngredients(ingredients) {
  return ingredients.map(({ ingredient, measure }) => ({
    ingredient: translateValue(ingredient, ingredientKoMap),
    measure: translateMeasure(measure),
  }))
}

function translateValue(value, map) {
  if (!value) {
    return null
  }

  return map[value] || null
}

function translateMeasure(value) {
  if (!value) {
    return null
  }

  return value
    .replace(/\bcups\b/gi, '컵')
    .replace(/\bcup\b/gi, '컵')
    .replace(/\bdashes\b/gi, '대시')
    .replace(/\bdash\b/gi, '대시')
    .replace(/\bparts\b/gi, '파트')
    .replace(/\bpart\b/gi, '파트')
    .replace(/\bshots\b/gi, '샷')
    .replace(/\bshot\b/gi, '샷')
    .replace(/\btbsp\b/gi, '큰술')
    .replace(/\btsp\b/gi, '작은술')
    .replace(/\boz\b/gi, '온스')
    .replace(/\bcl\b/gi, 'cl')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanValue(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function loadEnvFile(path) {
  const envText = readFileSync(path, 'utf8')

  for (const line of envText.split('\n')) {
    const trimmedLine = line.trim()

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmedLine.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = trimmedLine.slice(0, separatorIndex).trim()
    const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '')

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

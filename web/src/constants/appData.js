export const fallbackCocktailDrink = {
  name: 'Basil Gin Sour',
  type: 'Cocktail',
  note: '라임 산미와 바질 향이 먼저 올라오는 산뜻한 한 잔.',
  meta: '5분 · Shake · 중간 도수',
}

export const featuredWineDrink = {
  name: 'Pinot Noir',
  type: 'Wine',
  note: '체리, 흙내음, 낮은 탄닌. 가벼운 저녁 식사와 잘 맞습니다.',
  meta: 'Red · Light body · Pairing',
}

export const categories = [
  { title: 'Cocktail', count: 'Recipe 124', accent: 'teal' },
  { title: 'Wine', count: 'Bottle 86', accent: 'wine' },
  { title: 'Whiskey', count: 'Coming soon', accent: 'gold' },
]

export const savedNotes = [
  '라임은 조금 더 줄이고 바질은 2장 추가',
  '피노 누아는 버섯 리조또와 다시 테스트',
]

export const appTabs = ['home', 'search', 'saved', 'notes', 'settings']
export const themeModes = ['light', 'dark', 'system']
export const activeTabStorageKey = 'record-of-the-cup:active-tab'
export const themeModeStorageKey = 'record-of-the-cup:theme-mode'
export const noteDraftStorageKey = 'record-of-the-cup:note-draft'
export const detailRoutePattern = /^#\/cocktails\/([^/?#]+)$/
export const wineDetailRoutePattern = /^#\/wines\/([^/?#]+)$/
export const cocktailPageSize = 20
export const cocktailAlcoholFilters = ['알코올', '논알코올', '알코올 선택 가능']
export const cocktailCategoryFilters = ['칵테일', '샷', '펀치', '커피 / 차', '셰이크', '기타']
export const cocktailColorFilters = ['투명', '붉은색', '노란색', '초록색', '갈색', '크림색', '기타']
export const wineTypeFilters = ['레드', '화이트', '스파클링', '로제', '디저트', '포트']

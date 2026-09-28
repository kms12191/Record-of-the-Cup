import { useEffect, useState } from 'react'
import './App.css'
import { BottomTabs } from './components/common'
import { appTabs, activeTabStorageKey, detailRoutePattern, themeModeStorageKey, themeModes, wineDetailRoutePattern } from './constants/appData'
import { CocktailDetailPage } from './screens/CocktailDetailPage'
import { HomeScreen } from './screens/HomeScreen'
import { NotesScreen } from './screens/NotesScreen'
import { SavedScreen } from './screens/SavedScreen'
import { SearchScreen } from './screens/SearchScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { WineDetailPage } from './screens/WineDetailPage'
import {
  ensureProfileForSession,
  getCurrentSession,
  subscribeToAuthChanges,
} from './services/authService'
import { deleteFavoriteDrink, fetchFavoriteDrinkIds, saveFavoriteDrink } from './services/favoriteService'

function App() {
  const [activeTab, setActiveTab] = useState(() => getStoredActiveTab())
  const [route, setRoute] = useState(() => getCurrentRoute())
  const [themeMode, setThemeMode] = useState(() => getStoredThemeMode())
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [saveNotice, setSaveNotice] = useState('')
  const [searchDrinkType, setSearchDrinkType] = useState('cocktail')
  const [savedDrinkIds, setSavedDrinkIds] = useState([])
  const [savedRefreshKey, setSavedRefreshKey] = useState(0)


  useEffect(() => {
    const handleRouteChange = () => setRoute(getCurrentRoute())

    window.addEventListener('hashchange', handleRouteChange)

    return () => window.removeEventListener('hashchange', handleRouteChange)
  }, [])

  useEffect(() => {
    let isMounted = true

    getCurrentSession()
      .then((currentSession) => {
        if (isMounted) {
          setSession(currentSession)
          if (!currentSession) {
            setProfile(null)
            setSavedDrinkIds([])
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setSession(null)
        }
      })

    const unsubscribe = subscribeToAuthChanges((currentSession) => {
      setSession(currentSession)
      if (!currentSession) {
        setProfile(null)
        setSavedDrinkIds([])
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])


  useEffect(() => {
    if (!session?.user) {
      return undefined
    }

    let isMounted = true

    fetchFavoriteDrinkIds()
      .then((favoriteIds) => {
        if (isMounted) {
          setSavedDrinkIds(favoriteIds)
        }
      })
      .catch(() => {
        if (isMounted) {
          setSavedDrinkIds([])
        }
      })

    return () => {
      isMounted = false
    }
  }, [savedRefreshKey, session])

  useEffect(() => {
    if (!session?.user) {
      return
    }

    let isMounted = true

    ensureProfileForSession(session)
      .then((currentProfile) => {
        if (isMounted) {
          setProfile(currentProfile)
        }
      })
      .catch(() => {
        if (isMounted) {
          setProfile(null)
        }
      })

    return () => {
      isMounted = false
    }
  }, [session])

  useEffect(() => {
    window.sessionStorage.setItem(activeTabStorageKey, activeTab)
  }, [activeTab])

  useEffect(() => {
    if (!saveNotice) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setSaveNotice(''), 2200)

    return () => window.clearTimeout(timeoutId)
  }, [saveNotice])

  useEffect(() => {
    const applyTheme = () => {
      const resolvedThemeMode = getResolvedThemeMode(themeMode)

      document.documentElement.dataset.theme = resolvedThemeMode
      document.documentElement.style.colorScheme = resolvedThemeMode
      window.localStorage.setItem(themeModeStorageKey, themeMode)
    }

    applyTheme()

    if (themeMode !== 'system') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', applyTheme)

    return () => mediaQuery.removeEventListener('change', applyTheme)
  }, [themeMode])

  function openSearchTab(nextDrinkType = 'cocktail') {
    setSearchDrinkType(nextDrinkType)
    setActiveTab('search')
  }

  async function handleSaveDrink(drink) {
    if (!session?.user) {
      setSaveNotice('로그인 후 관심 목록에 저장할 수 있습니다.')
      setActiveTab('settings')
      return
    }

    const isSaved = savedDrinkIds.includes(drink.id)

    try {
      if (isSaved) {
        await deleteFavoriteDrink(session.user.id, drink)
        setSavedDrinkIds((currentIds) => currentIds.filter((drinkId) => drinkId !== drink.id))
        setSaveNotice('관심 목록에서 해제했습니다.')
      } else {
        await saveFavoriteDrink(session.user.id, drink)
        setSavedDrinkIds((currentIds) => currentIds.includes(drink.id) ? currentIds : [...currentIds, drink.id])
        setSaveNotice('관심 목록에 저장했습니다.')
      }

      setSavedRefreshKey((currentKey) => currentKey + 1)
    } catch (error) {
      console.error('Failed to update favorite drink:', error)
      setSaveNotice(getFavoriteErrorMessage(error))
    }
  }

  const isDetailRoute = route.name === 'cocktailDetail' || route.name === 'wineDetail'

  return (
    <main className={`app-shell ${activeTab === 'settings' ? 'settings-mode' : ''} ${isDetailRoute ? 'detail-mode' : ''}`} aria-label="Record of the Cup app">
      {route.name === 'cocktailDetail' ? (
        <CocktailDetailPage key={route.cocktailId} cocktailId={route.cocktailId} onBack={goBackFromDetail} session={session} />
      ) : route.name === 'wineDetail' ? (
        <WineDetailPage key={route.wineId} wineId={route.wineId} onBack={goBackFromDetail} session={session} />
      ) : (
        <>
          {activeTab === 'home' ? <HomeScreen onCategorySelect={openSearchTab} onOpenDrinkDetail={navigateToDrinkDetail} onSaveDrink={handleSaveDrink} savedDrinkIds={savedDrinkIds} /> : null}
          {activeTab === 'search' ? <SearchScreen initialDrinkType={searchDrinkType} key={searchDrinkType} onOpenDrinkDetail={navigateToDrinkDetail} onSaveDrink={handleSaveDrink} savedDrinkIds={savedDrinkIds} /> : null}
          {activeTab === 'saved' ? <SavedScreen onOpenDrinkDetail={navigateToDrinkDetail} onSaveDrink={handleSaveDrink} refreshKey={savedRefreshKey} session={session} /> : null}
          {activeTab === 'notes' ? <NotesScreen /> : null}
          {activeTab === 'settings' ? <SettingsScreen onThemeModeChange={setThemeMode} profile={profile} session={session} themeMode={themeMode} /> : null}

          <BottomTabs activeTab={activeTab} onTabChange={setActiveTab} />
          {saveNotice ? <div className="app-toast" role="status">{saveNotice}</div> : null}
        </>
      )}
    </main>
  )
}



function getFavoriteErrorMessage(error) {
  const message = error?.message || ''

  if (message.includes('permission denied') || message.includes('row-level security')) {
    return '저장 권한 설정을 확인해야 합니다. Supabase favorites 권한이 막혀 있어요.'
  }

  if (message.includes('duplicate key')) {
    return '이미 관심 목록에 저장된 항목입니다.'
  }

  return '저장하지 못했습니다. 잠시 후 다시 시도해주세요.'
}

function getCurrentRoute() {
  const detailMatch = window.location.hash.match(detailRoutePattern)

  if (detailMatch) {
    return {
      name: 'cocktailDetail',
      cocktailId: decodeURIComponent(detailMatch[1]),
    }
  }

  const wineDetailMatch = window.location.hash.match(wineDetailRoutePattern)

  if (wineDetailMatch) {
    return {
      name: 'wineDetail',
      wineId: decodeURIComponent(wineDetailMatch[1]),
    }
  }

  return { name: 'main' }
}

function navigateToDrinkDetail(drink) {
  if (!drink?.id) {
    return
  }

  if (drink.type === 'Wine') {
    window.location.hash = `/wines/${encodeURIComponent(drink.id)}`
    return
  }

  window.location.hash = `/cocktails/${encodeURIComponent(drink.id)}`
}

function goBackFromDetail() {
  if (window.history.length > 1) {
    window.history.back()
    return
  }

  window.location.hash = ''
}

function getStoredActiveTab() {
  if (!isPageReload()) {
    return 'home'
  }

  const storedTab = window.sessionStorage.getItem(activeTabStorageKey)

  return appTabs.includes(storedTab) ? storedTab : 'home'
}

function isPageReload() {
  const [navigationEntry] = window.performance.getEntriesByType('navigation')

  return navigationEntry?.type === 'reload'
}

function getStoredThemeMode() {
  const storedThemeMode = window.localStorage.getItem(themeModeStorageKey)

  return themeModes.includes(storedThemeMode) ? storedThemeMode : 'system'
}

function getResolvedThemeMode(themeMode) {
  if (themeMode !== 'system') {
    return themeMode
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default App

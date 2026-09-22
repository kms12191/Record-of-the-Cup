import { useState } from 'react'
import {
  BellIcon,
  BackIcon,
  CheckIcon,
  ChevronIcon,
  DocumentIcon,
  InfoIcon,
  KakaoIcon,
  MoonIcon,
  NoteIcon,
  ShieldIcon,
  SunIcon,
  SystemIcon,
  ThemeIcon,
  UserIcon,
  UserPlusIcon,
} from '../components/icons'
import {
  signInWithEmail,
  signInWithKakao,
  signOut,
  signUpWithEmail,
} from '../services/authService'

const signUpPasswordMessage = '비밀번호는 영문, 숫자, 특수기호를 포함한 8자 이상이어야 합니다.'

const settingsSections = [
  {
    title: '계정',
    items: [
      { label: '회원가입', description: '이메일로 새 계정을 만들고 기록을 시작합니다.', icon: UserPlusIcon, authMode: 'signUp' },
      { label: '프로필 관리', description: '닉네임과 취향 정보를 설정합니다.', icon: NoteIcon },
    ],
  },
  {
    title: '앱 설정',
    items: [
      { label: '알림', description: '추천과 기록 리마인더를 관리합니다.', icon: BellIcon },
      { label: '화면 모드', description: '라이트, 다크, 시스템 설정을 선택합니다.', icon: ThemeIcon, setting: 'themeMode' },
    ],
  },
  {
    title: '정보 및 보호',
    items: [
      { label: '개인정보보호방침', description: '개인 기록과 계정 정보 처리 기준입니다.', icon: ShieldIcon },
      { label: '서비스 이용약관', description: '앱 사용에 관한 기본 약속입니다.', icon: DocumentIcon },
      { label: '앱 정보', description: 'Record of the Cup 버전과 안내를 확인합니다.', icon: InfoIcon },
    ],
  },
]

function isValidSignUpPassword(value) {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value)
}

export function SettingsScreen({ onThemeModeChange, profile, session, themeMode }) {
  const [authMode, setAuthMode] = useState(null)
  const [settingsWindow, setSettingsWindow] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSignedIn = Boolean(session?.user)

  function openAuthWindow(nextAuthMode) {
    setSettingsWindow(null)
    setAuthMode(nextAuthMode)
    setStatusMessage('')
    setErrorMessage('')
  }

  function closeAuthWindow() {
    setAuthMode(null)
    setStatusMessage('')
    setErrorMessage('')
  }

  function openSettingsWindow(nextSettingsWindow) {
    setAuthMode(null)
    setSettingsWindow(nextSettingsWindow)
  }

  function closeSettingsWindow() {
    setSettingsWindow(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setStatusMessage('')
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      if (authMode === 'signUp') {
        if (!isValidSignUpPassword(password)) {
          setErrorMessage(signUpPasswordMessage)
          return
        }

        const data = await signUpWithEmail(email, password, nickname)

        if (data.session) {
          setStatusMessage('회원가입과 로그인이 완료됐습니다.')
        } else {
          setStatusMessage('가입 확인 메일을 보냈습니다. 메일함을 확인해주세요.')
        }
      } else {
        await signInWithEmail(email, password)
        setStatusMessage('로그인되었습니다.')
      }
    } catch (error) {
      setErrorMessage(error.message || '로그인 처리 중 문제가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleKakaoSignIn() {
    setStatusMessage('')
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await signInWithKakao()
    } catch (error) {
      setErrorMessage(error.message || '카카오 로그인 처리 중 문제가 발생했습니다.')
      setIsSubmitting(false)
    }
  }

  async function handleSignOut() {
    setStatusMessage('')
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await signOut()
      setStatusMessage('로그아웃되었습니다.')
    } catch (error) {
      setErrorMessage(error.message || '로그아웃 처리 중 문제가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="settings-screen">
      <header className="page-header">
        <span className="eyebrow dark">Settings</span>
        <h1>설정</h1>
        <p>계정, 알림, 개인정보와 앱 기본 설정을 관리합니다.</p>
      </header>

      {authMode ? (
        <section className="auth-window">
          <header className="auth-window-header">
            <button className="auth-back-button" onClick={closeAuthWindow} type="button" aria-label="설정으로 돌아가기">
              <BackIcon />
            </button>
            <div>
              <span>{authMode === 'signUp' ? 'Create account' : 'Sign in'}</span>
              <h2>{authMode === 'signUp' ? '회원가입' : '로그인'}</h2>
            </div>
          </header>

          <div className="auth-window-body">
            <div className="login-icon" aria-hidden="true">
              <UserIcon />
            </div>
            {isSignedIn ? (
              <div className="account-panel">
                <span>Record 계정</span>
                <h2>{profile?.nickname || session.user.email}</h2>
                <p>{session.user.email} 계정으로 로그인되어 있습니다.</p>
                <button className="secondary-action" disabled={isSubmitting} onClick={handleSignOut} type="button">
                  로그아웃
                </button>
              </div>
            ) : (
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-window-copy">
                  <span>Record 계정</span>
                  <h2>{authMode === 'signUp' ? '계정을 만들고 기록을 시작하세요' : '로그인하고 기록을 안전하게 보관하세요'}</h2>
                  <p>즐겨찾기, 노트, 취향 데이터를 내 계정에 저장할 수 있습니다.</p>
                </div>
                <button className="kakao-action" disabled={isSubmitting} onClick={handleKakaoSignIn} type="button">
                  <KakaoIcon />
                  {authMode === 'signUp' ? '카카오로 연결하기' : '카카오로 로그인'}
                </button>
                <div className="auth-divider"><span>{authMode === 'signUp' ? '또는 이메일로 가입' : '또는 이메일로 계속'}</span></div>
                {authMode === 'signUp' ? (
                  <label className="auth-field">
                    <span>닉네임</span>
                    <input autoComplete="nickname" onChange={(event) => setNickname(event.target.value)} value={nickname} />
                  </label>
                ) : null}
                <label className="auth-field">
                  <span>이메일</span>
                  <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder={authMode === 'signUp' ? undefined : 'you@example.com'} required type="email" value={email} />
                </label>
                <label className="auth-field">
                  <span>비밀번호</span>
                  <input autoComplete={authMode === 'signUp' ? 'new-password' : 'current-password'} minLength={authMode === 'signUp' ? 8 : 6} onChange={(event) => setPassword(event.target.value)} placeholder={authMode === 'signUp' ? undefined : '6자 이상'} required type="password" value={password} />
                </label>
                {authMode === 'signUp' ? <small className="auth-help">{signUpPasswordMessage}</small> : null}
                <button className="primary-action" disabled={isSubmitting} type="submit">
                  {isSubmitting ? '처리 중...' : authMode === 'signUp' ? '회원가입' : '로그인'}
                </button>
              </form>
            )}
            {statusMessage ? <p className="auth-message success">{statusMessage}</p> : null}
            {errorMessage ? <p className="auth-message error">{errorMessage}</p> : null}
          </div>
        </section>
      ) : settingsWindow === 'themeMode' ? (
        <ThemeModeWindow onBack={closeSettingsWindow} onThemeModeChange={onThemeModeChange} themeMode={themeMode} />
      ) : (
        <div className="settings-list">
          <ProfileCard
            isSubmitting={isSubmitting}
            onSignIn={() => openAuthWindow('signIn')}
            onSignOut={handleSignOut}
            profile={profile}
            session={session}
          />
          {settingsSections.map((section) => {
            const visibleItems = section.items.filter((item) => !(isSignedIn && item.authMode === 'signUp'))

            return (
            <section className="settings-group" key={section.title}>
              <h2>{section.title}</h2>
              {visibleItems.map((item) => {
                const Icon = item.icon

                return (
                  <button
                    className="settings-row"
                    key={item.label}
                    onClick={item.authMode ? () => openAuthWindow(item.authMode) : item.setting ? () => openSettingsWindow(item.setting) : undefined}
                    type="button"
                  >
                    <span className="settings-row-icon"><Icon /></span>
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                    <ChevronIcon />
                  </button>
                )
              })}
            </section>
            )
          })}
        </div>
      )}
    </section>
  )
}

function ThemeModeWindow({ onBack, onThemeModeChange, themeMode }) {
  const options = [
    { id: 'light', title: '라이트 모드', description: '밝은 배경으로 앱을 고정합니다.', icon: SunIcon },
    { id: 'dark', title: '다크 모드', description: '어두운 배경으로 앱을 고정합니다.', icon: MoonIcon },
    { id: 'system', title: '시스템 설정 모드', description: '모바일 디바이스나 브라우저의 화면 설정을 따라갑니다.', icon: SystemIcon },
  ]

  return (
    <section className="settings-window">
      <header className="auth-window-header">
        <button className="auth-back-button" onClick={onBack} type="button" aria-label="설정으로 돌아가기">
          <BackIcon />
        </button>
        <div>
          <span>Display</span>
          <h2>화면 모드</h2>
        </div>
      </header>

      <div className="theme-mode-list">
        {options.map((option) => {
          const Icon = option.icon
          const isActive = themeMode === option.id

          return (
            <button
              aria-pressed={isActive}
              className={isActive ? 'theme-mode-option active' : 'theme-mode-option'}
              key={option.id}
              onClick={() => onThemeModeChange(option.id)}
              type="button"
            >
              <span className="settings-row-icon"><Icon /></span>
              <span>
                <strong>{option.title}</strong>
                <small>{option.description}</small>
              </span>
              {isActive ? <CheckIcon /> : <ChevronIcon />}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function ProfileCard({ isSubmitting, onSignIn, onSignOut, profile, session }) {
  const isSignedIn = Boolean(session?.user)
  const email = session?.user?.email || '카카오 계정'
  const displayName = isSignedIn
    ? profile?.nickname || session?.user?.user_metadata?.nickname || session?.user?.user_metadata?.name || email
    : '로그인이 필요합니다'
  const avatarUrl = profile?.avatar_url || session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture
  const initial = isSignedIn ? displayName.trim().charAt(0).toUpperCase() || 'R' : 'R'

  return (
    <section className="profile-card" aria-label="내 프로필">
      <div className="profile-avatar" aria-hidden="true">
        {avatarUrl ? <img alt="" src={avatarUrl} /> : <span>{initial}</span>}
      </div>
      <div className="profile-copy">
        <span>{isSignedIn ? 'My record' : 'Record account'}</span>
        <h2>{displayName}</h2>
        <p>{isSignedIn ? email : '로그인하고 기록을 안전하게 저장하세요'}</p>
      </div>
      <button
        className={isSignedIn ? 'profile-action logout' : 'profile-action'}
        disabled={isSubmitting}
        onClick={isSignedIn ? onSignOut : onSignIn}
        type="button"
      >
        {isSignedIn ? '로그아웃' : '로그인'}
      </button>
    </section>
  )
}

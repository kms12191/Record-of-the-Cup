import { HeartIcon, HomeIcon, NoteIcon, SearchIcon, SettingsIcon } from './icons'

export function SectionHeader({ title, action, onAction }) {
  return (
    <div className="section-header">
      <strong>{title}</strong>
      {action ? (
        <button onClick={onAction} type="button">
          {action}
        </button>
      ) : null}
    </div>
  )
}

export function BottomTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'home', label: '홈', icon: HomeIcon },
    { id: 'search', label: '탐색', icon: SearchIcon },
    { id: 'saved', label: '저장', icon: HeartIcon },
    { id: 'notes', label: '노트', icon: NoteIcon },
    { id: 'settings', label: '설정', icon: SettingsIcon },
  ]

  return (
    <nav className="bottom-tabs" aria-label="하단 탭">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            aria-current={isActive ? 'page' : undefined}
            className={isActive ? 'active' : ''}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            <Icon />
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}


export function Pagination({ currentPage, onPageChange, totalPages }) {
  const visiblePageCount = Math.min(5, totalPages)
  const maxStartPage = Math.max(1, totalPages - visiblePageCount + 1)
  const startPage = Math.min(Math.max(1, currentPage - 2), maxStartPage)
  const pages = Array.from({ length: visiblePageCount }, (_, index) => startPage + index)
  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  return (
    <nav className="pagination" aria-label="칵테일 검색 페이지">
      <button disabled={isFirstPage} onClick={() => onPageChange(1)} type="button" aria-label="첫 페이지">
        {'<<'}
      </button>
      <button disabled={isFirstPage} onClick={() => onPageChange(currentPage - 1)} type="button" aria-label="이전 페이지">
        {'<'}
      </button>
      {pages.map((page) => (
        <button
          aria-current={currentPage === page ? 'page' : undefined}
          className={currentPage === page ? 'active' : ''}
          key={page}
          onClick={() => onPageChange(page)}
          type="button"
        >
          {page}
        </button>
      ))}
      <button disabled={isLastPage} onClick={() => onPageChange(currentPage + 1)} type="button" aria-label="다음 페이지">
        {'>'}
      </button>
      <button disabled={isLastPage} onClick={() => onPageChange(totalPages)} type="button" aria-label="마지막 페이지">
        {'>>'}
      </button>
    </nav>
  )
}

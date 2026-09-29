import { useEffect, useState } from 'react'
import { NoteIcon } from '../components/icons'
import { fetchDrinkNotes } from '../services/noteService'

export function NotesScreen({ onOpenDrinkDetail, session }) {
  const [notes, setNotes] = useState([])
  const [status, setStatus] = useState('loading')
  const resolvedStatus = session?.user ? status : 'signedOut'

  useEffect(() => {
    if (!session?.user) {
      return undefined
    }

    let isMounted = true

    fetchDrinkNotes(session.user.id)
      .then((nextNotes) => {
        if (!isMounted) {
          return
        }

        setNotes(nextNotes)
        setStatus(nextNotes.length > 0 ? 'ready' : 'empty')
      })
      .catch(() => {
        if (isMounted) {
          setNotes([])
          setStatus('error')
        }
      })

    return () => {
      isMounted = false
    }
  }, [session])

  function openNoteDrink(note) {
    if (!note.drink.id) {
      return
    }

    onOpenDrinkDetail(note.drink)
  }

  return (
    <section className="notes-screen">
      <header className="notes-list-header">
        <div>
          <span className="eyebrow dark">Notes</span>
          <h1>노트</h1>
          <p>상세 페이지에서 남긴 개인 노트를 모아봅니다.</p>
        </div>
      </header>

      {resolvedStatus === 'signedOut' ? (
        <div className="state-panel">
          <strong>로그인이 필요합니다.</strong>
          <p>로그인 후 칵테일과 와인 상세 페이지에서 남긴 노트를 확인할 수 있습니다.</p>
        </div>
      ) : null}

      {resolvedStatus === 'loading' ? (
        <div className="state-panel">
          <strong>노트를 불러오는 중입니다.</strong>
          <p>저장된 개인 노트를 확인하고 있어요.</p>
        </div>
      ) : null}

      {resolvedStatus === 'error' ? (
        <div className="state-panel">
          <strong>노트를 불러오지 못했어요.</strong>
          <p>Supabase 연결 상태를 확인한 뒤 다시 시도해주세요.</p>
        </div>
      ) : null}

      {resolvedStatus === 'empty' ? (
        <div className="state-panel">
          <strong>아직 저장한 노트가 없어요.</strong>
          <p>칵테일이나 와인 상세 페이지에서 내 노트를 남겨보세요.</p>
        </div>
      ) : null}

      {resolvedStatus === 'ready' ? (
        <div className="notes-list">
          {notes.map((note) => (
            <article className="note-card" key={note.id} onClick={() => openNoteDrink(note)}>
              <div className="note-card-icon" aria-hidden="true">
                <NoteIcon />
              </div>
              <div>
                <span>{note.drinkType} · {formatNoteDate(note.updatedAt)}</span>
                <h2>{note.drinkName}</h2>
                <p>{note.note}</p>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function formatNoteDate(value) {
  if (!value) {
    return '날짜 없음'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

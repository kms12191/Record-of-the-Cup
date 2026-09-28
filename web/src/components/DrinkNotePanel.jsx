import { useEffect, useState } from 'react'
import { deleteDrinkNote, fetchDrinkNote, saveDrinkNote } from '../services/noteService'

export function DrinkNotePanel({ drink, session }) {
  const [isEditing, setIsEditing] = useState(false)
  const [noteId, setNoteId] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [savedNoteText, setSavedNoteText] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const userId = session?.user?.id
  const hasSavedNote = Boolean(noteId && savedNoteText.trim())
  const isBusy = status === 'loading' || status === 'saving'

  useEffect(() => {
    if (!userId || !drink?.id) {
      return undefined
    }

    let isMounted = true

    fetchDrinkNote(userId, drink)
      .then((note) => {
        if (!isMounted) {
          return
        }

        const nextNoteText = note?.note || ''

        setNoteId(note?.id || null)
        setNoteText(nextNoteText)
        setSavedNoteText(nextNoteText)
        setIsEditing(false)
        setStatus('idle')
      })
      .catch(() => {
        if (isMounted) {
          setStatus('error')
          setMessage('노트를 불러오지 못했습니다.')
        }
      })

    return () => {
      isMounted = false
    }
  }, [drink, userId])

  async function handleSaveNote() {
    if (!userId) {
      return
    }

    if (!noteText.trim()) {
      setMessage('노트 내용을 입력해주세요.')
      return
    }

    setStatus('saving')
    setMessage('')

    try {
      const savedNote = await saveDrinkNote(userId, drink, noteText, noteId)
      setNoteId(savedNote.id)
      setNoteText(savedNote.note)
      setSavedNoteText(savedNote.note)
      setIsEditing(false)
      setStatus('idle')
      setMessage('노트를 저장했습니다.')
    } catch (error) {
      console.error('Failed to save drink note:', error)
      setStatus('error')
      setMessage('노트를 저장하지 못했습니다.')
    }
  }

  async function handleClearNote() {
    if (!userId) {
      return
    }

    if (!noteId) {
      setNoteText('')
      setSavedNoteText('')
      setIsEditing(false)
      setMessage('입력 내용을 비웠습니다.')
      return
    }

    setStatus('saving')
    setMessage('')

    try {
      await deleteDrinkNote(userId, noteId)
      setNoteId(null)
      setNoteText('')
      setSavedNoteText('')
      setIsEditing(false)
      setStatus('idle')
      setMessage('노트를 삭제했습니다.')
    } catch (error) {
      console.error('Failed to delete drink note:', error)
      setStatus('error')
      setMessage('노트를 삭제하지 못했습니다.')
    }
  }

  function handleStartEditing() {
    setNoteText(savedNoteText)
    setIsEditing(true)
    setMessage('')
  }

  function handleCancelEditing() {
    setNoteText(savedNoteText)
    setIsEditing(false)
    setMessage('')
  }

  return (
    <section className="drink-note-panel" aria-label="내 노트">
      <div className="drink-note-header">
        <div>
          <span className="eyebrow dark">Private note</span>
          <h3>내 노트</h3>
        </div>
        {status === 'loading' ? <span>불러오는 중</span> : null}
      </div>

      {!userId ? (
        <p className="drink-note-help">로그인 후 이 술에 대한 개인 노트를 남길 수 있습니다.</p>
      ) : isEditing ? (
        <>
          <textarea
            aria-label={`${drink.name} 개인 노트`}
            disabled={isBusy}
            onChange={(event) => setNoteText(event.target.value)}
            placeholder="향, 맛, 분위기, 다시 마실 때 기억할 점을 적어보세요."
            value={noteText}
          />
          <div className="drink-note-actions">
            <button className="secondary-button" disabled={isBusy} onClick={handleCancelEditing} type="button">
              취소
            </button>
            <button className="primary-button" disabled={isBusy} onClick={handleSaveNote} type="button">
              {status === 'saving' ? '저장 중' : '저장하기'}
            </button>
          </div>
        </>
      ) : (
        <div className={hasSavedNote ? 'drink-note-card has-note' : 'drink-note-card'}>
          <p>{hasSavedNote ? savedNoteText : '이 잔에 대한 기억을 짧게 남겨보세요.'}</p>
          <div className="drink-note-card-actions">
            {hasSavedNote ? (
              <button className="note-text-button muted" disabled={isBusy} onClick={handleClearNote} type="button">
                삭제
              </button>
            ) : null}
            <button className="note-text-button" disabled={isBusy} onClick={handleStartEditing} type="button">
              {hasSavedNote ? '수정' : '작성하기'}
            </button>
          </div>
        </div>
      )}

      {message ? <p className="drink-note-message" role="status">{message}</p> : null}
    </section>
  )
}

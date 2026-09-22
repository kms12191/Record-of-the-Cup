import { useState } from 'react'
import { BackIcon, PlusIcon } from '../components/icons'
import { noteDraftStorageKey } from '../constants/appData'

export function NotesScreen() {
  const [isWriting, setIsWriting] = useState(false)
  const [draftTitle, setDraftTitle] = useState(() => getStoredNoteDraft().title)
  const [draftBody, setDraftBody] = useState(() => getStoredNoteDraft().body)
  const [draftMessage, setDraftMessage] = useState('')

  function saveDraft() {
    window.localStorage.setItem(noteDraftStorageKey, JSON.stringify({
      body: draftBody,
      savedAt: new Date().toISOString(),
      title: draftTitle,
    }))
    setDraftMessage('임시저장했습니다.')
  }

  if (isWriting) {
    return (
      <section className="notes-screen">
        <header className="detail-page-header notes-write-header">
          <button className="detail-back-button" type="button" aria-label="노트 목록으로 돌아가기" onClick={() => setIsWriting(false)}>
            <BackIcon />
          </button>
          <div>
            <span className="eyebrow dark">New note</span>
            <h1>노트 추가</h1>
          </div>
        </header>

        <section className="note-editor">
          <label className="note-field">
            <span>제목</span>
            <input
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder="오늘 마신 한 잔"
              value={draftTitle}
            />
          </label>
          <label className="note-field">
            <span>내용</span>
            <textarea
              onChange={(event) => setDraftBody(event.target.value)}
              placeholder="향, 맛, 분위기, 다음에 바꿔볼 점을 적어보세요."
              rows="10"
              value={draftBody}
            />
          </label>
          <div className="note-editor-actions">
            <button className="secondary-action" onClick={saveDraft} type="button">
              임시저장
            </button>
            <button className="primary-action" disabled type="button">
              저장 준비 중
            </button>
          </div>
          {draftMessage ? <p className="note-draft-message">{draftMessage}</p> : null}
        </section>
      </section>
    )
  }

  return (
    <section className="notes-screen">
      <header className="notes-list-header">
        <div>
          <span className="eyebrow dark">Notes</span>
          <h1>노트</h1>
          <p>개인 시음 기록과 메모를 정리할 화면입니다.</p>
        </div>
        <button className="add-note-button" onClick={() => setIsWriting(true)} type="button" aria-label="노트 추가">
          <PlusIcon />
        </button>
      </header>

      <div className="state-panel">
        <strong>아직 작성한 노트가 없어요.</strong>
        <p>+ 버튼으로 새 노트를 추가할 수 있습니다.</p>
      </div>
    </section>
  )
}

function getStoredNoteDraft() {
  try {
    const storedDraft = window.localStorage.getItem(noteDraftStorageKey)

    if (!storedDraft) {
      return { body: '', title: '' }
    }

    const parsedDraft = JSON.parse(storedDraft)

    return {
      body: parsedDraft.body || '',
      title: parsedDraft.title || '',
    }
  } catch {
    return { body: '', title: '' }
  }
}

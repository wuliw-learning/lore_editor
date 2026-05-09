import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { createBlock, createPage, deleteBlockApi, listBlocks, reorderBlocks, updateBlock, updatePage } from '../api/pages'
import { useDebouncedEffect } from '../hooks/useDebouncedEffect'
import type { Block, Page } from '../types'
import { Button } from '../components/Button'
import { SlashMenu } from './SlashMenu'

type Props = {
  pageId: number
  pages: Page[]
  onRefreshPages: () => Promise<void>
  onSavingState: (state: string) => void
}

type SlashState = {
  blockId: number
  query: string
} | null

function emptyMetadataForType(type: string): Record<string, unknown> {
  if (type === 'todo') return { checked: false }
  if (type === 'toggle') return { expanded: false, body: '' }
  if (type === 'callout') return { icon: 'i' }
  return {}
}

function stripSlashCommand(value: string): string {
  return value.replace(/\\[^\\s]*$/, '').trim()
}

function isListLikeBlock(type: string): boolean {
  return type === 'todo' || type === 'bulleted_list' || type === 'numbered_list'
}

function splitIntoParagraphBlocks(value: string): string[] {
  return value
    .split(/\r?\n\s*\r?\n+/)
    .map((part) => part.replace(/\r?\n/g, ' ').trim())
    .filter(Boolean)
}

export function BlockEditor({ pageId, pages, onRefreshPages, onSavingState }: Props) {
  const navigate = useNavigate()
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [slash, setSlash] = useState<SlashState>(null)
  const [focusBlockId, setFocusBlockId] = useState<number | null>(null)
  const [pageLinkDrafts, setPageLinkDrafts] = useState<Record<number, string>>({})
  const inputRefs = useRef<Record<number, HTMLTextAreaElement | null>>({})
  const pageLinkTitleRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const sortedBlocks = useMemo(() => [...blocks].sort((a, b) => a.sort_order - b.sort_order), [blocks])
  const pageTitleMap = useMemo(() => new Map(pages.map((page) => [page.id, page.title])), [pages])

  const syncHeight = (element: HTMLTextAreaElement | null) => {
    if (!element) return
    element.style.height = '0px'
    element.style.height = `${Math.max(element.scrollHeight, 42)}px`
  }

  const focusTextarea = (element: HTMLTextAreaElement | null, caretPosition: 'start' | 'end') => {
    if (!element) return
    element.focus({ preventScroll: true })
    const offset = caretPosition === 'start' ? 0 : element.value.length
    element.setSelectionRange(offset, offset)
    syncHeight(element)
    element.scrollIntoView({ block: 'nearest' })
  }

  const focusPageLinkTitle = (element: HTMLInputElement | null, caretPosition: 'start' | 'end') => {
    if (!element) return
    element.focus({ preventScroll: true })
    const offset = caretPosition === 'start' ? 0 : element.value.length
    element.setSelectionRange(offset, offset)
    element.scrollIntoView({ block: 'nearest' })
  }

  const findNavigableBlock = (startIndex: number, direction: -1 | 1) => {
    for (let candidateIndex = startIndex + direction; candidateIndex >= 0 && candidateIndex < sortedBlocks.length; candidateIndex += direction) {
      const candidate = sortedBlocks[candidateIndex]
      if (candidate.type !== 'divider') {
        return { candidate, candidateIndex }
      }
    }
    return null
  }

  const focusAdjacentBlock = (currentIndex: number, direction: -1 | 1, caretPosition: 'start' | 'end') => {
    const targetEntry = findNavigableBlock(currentIndex, direction)
    if (!targetEntry) return false

    const { candidate } = targetEntry
    if (candidate.type === 'page_link') {
      focusPageLinkTitle(pageLinkTitleRefs.current[candidate.id], caretPosition)
      return true
    }

    focusTextarea(inputRefs.current[candidate.id], caretPosition)
    return true
  }

  useEffect(() => {
    setPageLinkDrafts((current) => {
      const next = { ...current }
      for (const page of pages) {
        next[page.id] = page.title
      }
      return next
    })
  }, [pages])

  useEffect(() => {
    if (focusBlockId === null) return
    const target = inputRefs.current[focusBlockId]
    const pageLinkTarget = pageLinkTitleRefs.current[focusBlockId]
    if (target) {
      focusTextarea(target, 'end')
    } else if (pageLinkTarget) {
      focusPageLinkTitle(pageLinkTarget, 'end')
    } else {
      return
    }
    setFocusBlockId(null)
  }, [focusBlockId, sortedBlocks])

  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      setBlocks(await listBlocks(pageId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blocks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [pageId])

  useDebouncedEffect(
    () => {
      const dirty = blocks.filter((block) => block.updated_at === 'local')
      if (dirty.length === 0) return
      onSavingState('Saving...')
      Promise.all(
        dirty.map(async (block) => {
          const saved = await updateBlock(block.id, {
            type: block.type,
            content: block.content,
            metadata: block.metadata,
            sort_order: block.sort_order,
          })
          return saved
        }),
      )
        .then((savedBlocks) => {
          setBlocks((current) => current.map((block) => savedBlocks.find((item) => item.id === block.id) ?? block))
          onSavingState('Saved')
        })
        .catch(() => onSavingState('Save failed'))
    },
    [blocks],
    500,
  )

  const patchBlock = (blockId: number, patch: Partial<Block>) => {
    setBlocks((current) =>
      current.map((block) => (block.id === blockId ? { ...block, ...patch, updated_at: 'local' } : block)),
    )
  }

  const appendBlock = async (afterSortOrder: number, type = 'text') => {
    const moved = sortedBlocks.map((block) =>
      block.sort_order > afterSortOrder ? { ...block, sort_order: block.sort_order + 1 } : block,
    )
    setBlocks(moved)
    const created = await createBlock(pageId, {
      type,
      content: '',
      metadata: emptyMetadataForType(type),
      sort_order: afterSortOrder + 1,
    })
    const nextBlocks = [...moved, created].sort((a, b) => a.sort_order - b.sort_order)
    setBlocks(nextBlocks)
    setFocusBlockId(created.id)
    await reorderBlocks(
      pageId,
      nextBlocks.map((block) => ({ id: block.id, sort_order: block.sort_order })),
    )
  }

  const insertTextBlocksAfter = async (afterSortOrder: number, contents: string[]) => {
    if (contents.length === 0) return [] as Block[]

    const moved = sortedBlocks.map((block) =>
      block.sort_order > afterSortOrder ? { ...block, sort_order: block.sort_order + contents.length } : block,
    )
    setBlocks(moved)

    const createdBlocks: Block[] = []
    for (const [offset, content] of contents.entries()) {
      const created = await createBlock(pageId, {
        type: 'text',
        content,
        metadata: {},
        sort_order: afterSortOrder + offset + 1,
      })
      createdBlocks.push(created)
    }

    const nextBlocks = [...moved, ...createdBlocks].sort((a, b) => a.sort_order - b.sort_order)
    setBlocks(nextBlocks)
    setFocusBlockId(createdBlocks[createdBlocks.length - 1]?.id ?? null)

    await reorderBlocks(
      pageId,
      nextBlocks.map((block) => ({ id: block.id, sort_order: block.sort_order })),
    )

    return createdBlocks
  }

  const removeBlock = async (blockId: number) => {
    if (sortedBlocks.length <= 1) return
    const currentIndex = sortedBlocks.findIndex((block) => block.id === blockId)
    const fallbackBlockId = sortedBlocks[currentIndex - 1]?.id ?? sortedBlocks[currentIndex + 1]?.id ?? null
    await deleteBlockApi(blockId)
    setBlocks((current) => current.filter((block) => block.id !== blockId))
    setFocusBlockId(fallbackBlockId)
  }

  const saveLinkedPageTitle = async (blockId: number, linkedPageId: number, value: string) => {
    const nextTitle = value.trim() || 'Untitled page'
    setPageLinkDrafts((current) => ({ ...current, [linkedPageId]: nextTitle }))
    patchBlock(blockId, { content: nextTitle })
    await updatePage(linkedPageId, { title: nextTitle })
    await onRefreshPages()
  }

  const selectSlashType = async (blockId: number, type: string) => {
    const block = blocks.find((item) => item.id === blockId)
    if (!block) return

    if (type === 'page_link') {
      const nextTitle = stripSlashCommand(block.content) || 'Untitled page'
      const child = await createPage(nextTitle, pageId)
      patchBlock(blockId, {
        type,
        content: child.title,
        metadata: { linked_page_id: child.id },
      })
      await onRefreshPages()
      setSlash(null)
      return
    }

    patchBlock(blockId, {
      type,
      content: type === 'divider' ? '' : block.content.replace(/\\[^\\s]*$/, ''),
      metadata: emptyMetadataForType(type),
    })
    setSlash(null)
  }

  if (loading) return <div className="page-state">Loading blocks...</div>
  if (error) return <div className="page-state error-box">{error}</div>

  return (
    <div className="editor-shell">
      {sortedBlocks.length === 0 ? <div className="empty-editor">Start typing or enter \ to choose a block</div> : null}
      {sortedBlocks.map((block, index) => {
        const toggleExpanded = Boolean(block.metadata.expanded)
        const linkedPageId = typeof block.metadata.linked_page_id === 'number' ? Number(block.metadata.linked_page_id) : null
        const linkedPageTitle = linkedPageId ? pageLinkDrafts[linkedPageId] ?? pageTitleMap.get(linkedPageId) ?? block.content ?? 'Untitled page' : block.content ?? 'Untitled page'
        const lineNumber = block.type === 'numbered_list'
          ? 1 + sortedBlocks.slice(0, index).reduce((count, item) => (item.type === 'numbered_list' ? count + 1 : 0), 0)
          : null

        return (
          <div key={block.id} className={`editor-block block-${block.type}`}>
            <button className="block-handle" onClick={() => void appendBlock(block.sort_order - 1, 'text')} aria-label="Insert block above">
              +
            </button>
            {block.type === 'todo' ? (
              <input
                className="todo-checkbox"
                type="checkbox"
                checked={Boolean(block.metadata.checked)}
                onChange={(event) => patchBlock(block.id, { metadata: { ...block.metadata, checked: event.target.checked } })}
              />
            ) : null}
            {block.type === 'toggle' ? (
              <button
                className="toggle-button marker-column"
                onClick={() => patchBlock(block.id, { metadata: { ...block.metadata, expanded: !toggleExpanded } })}
              >
                {toggleExpanded ? 'v' : '>'}
              </button>
            ) : null}
            {block.type === 'bulleted_list' ? <span className="list-marker marker-column">•</span> : null}
            {lineNumber ? <span className="list-marker marker-column numbered-marker">{lineNumber}.</span> : null}
            {block.type === 'quote' ? <span className="quote-bar" /> : null}
            {block.type === 'callout' ? <span className="callout-icon">{String(block.metadata.icon ?? 'i')}</span> : null}
            {block.type === 'divider' ? <hr className="divider" /> : null}
            {block.type === 'page_link' && linkedPageId ? (
              <div className="page-link">
                <span className="page-link-icon">+</span>
                <span className="page-link-copy">
                  <input
                    ref={(element) => {
                      pageLinkTitleRefs.current[block.id] = element
                    }}
                    className="page-link-title"
                    value={linkedPageTitle || 'Untitled page'}
                    onChange={(event) => setPageLinkDrafts((current) => ({ ...current, [linkedPageId]: event.target.value }))}
                    onBlur={() => void saveLinkedPageTitle(block.id, linkedPageId, linkedPageTitle || 'Untitled page')}
                    onKeyDown={(event) => {
                      if (event.altKey && event.key === 'ArrowUp') {
                        event.preventDefault()
                        focusAdjacentBlock(index, -1, 'end')
                        return
                      }
                      if (event.altKey && event.key === 'ArrowDown') {
                        event.preventDefault()
                        focusAdjacentBlock(index, 1, 'start')
                        return
                      }
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        event.currentTarget.blur()
                      }
                    }}
                  />
                  <span>Nested page</span>
                </span>
                <button className="page-link-open" onClick={() => navigate(`/pages/${linkedPageId}`)}>
                  Open
                </button>
              </div>
            ) : null}
            {block.type !== 'divider' && block.type !== 'page_link' ? (
              <div className="block-input-wrap">
                <textarea
                  ref={(element) => {
                    inputRefs.current[block.id] = element
                    syncHeight(element)
                  }}
                  className={`block-input input-${block.type}${block.type === 'todo' && Boolean(block.metadata.checked) ? ' todo-complete' : ''}`}
                  value={block.content}
                  placeholder={index === 0 ? 'Start typing or enter \\ to choose a block' : ''}
                  onChange={(event) => {
                    const value = event.target.value
                    patchBlock(block.id, { content: value })
                    syncHeight(event.target)
                    const match = value.match(/\\([^\\s]*)$/)
                    if (match) {
                      setSlash({ blockId: block.id, query: match[1] })
                    } else if (slash?.blockId === block.id) {
                      setSlash(null)
                    }
                  }}
                  onPaste={async (event) => {
                    if (block.type !== 'text') return

                    const pastedText = event.clipboardData.getData('text/plain')
                    const paragraphs = splitIntoParagraphBlocks(pastedText)
                    if (paragraphs.length <= 1) return

                    event.preventDefault()

                    const textarea = event.currentTarget
                    const selectionStart = textarea.selectionStart ?? block.content.length
                    const selectionEnd = textarea.selectionEnd ?? block.content.length
                    const before = block.content.slice(0, selectionStart)
                    const after = block.content.slice(selectionEnd)

                    const firstContent = `${before}${paragraphs[0]}`
                    const middleContents = paragraphs.slice(1, -1)
                    const lastContent = `${paragraphs[paragraphs.length - 1]}${after}`

                    patchBlock(block.id, { content: firstContent })
                    await insertTextBlocksAfter(block.sort_order, [...middleContents, lastContent])
                  }}
                  onKeyDown={async (event) => {
                    if (event.key === 'Escape') {
                      setSlash(null)
                    }
                    if (event.altKey && event.key === 'ArrowUp') {
                      event.preventDefault()
                      focusAdjacentBlock(index, -1, 'end')
                      return
                    }
                    if (event.altKey && event.key === 'ArrowDown') {
                      event.preventDefault()
                      focusAdjacentBlock(index, 1, 'start')
                      return
                    }
                    if (event.key === 'Enter' && !event.shiftKey && slash?.blockId !== block.id) {
                      event.preventDefault()
                      if (isListLikeBlock(block.type) && !block.content.trim()) {
                        patchBlock(block.id, { type: 'text', metadata: {} })
                        return
                      }
                      await appendBlock(block.sort_order, block.type === 'todo' ? 'todo' : block.type === 'numbered_list' ? 'numbered_list' : block.type === 'bulleted_list' ? 'bulleted_list' : 'text')
                    }
                    if (event.key === 'ArrowUp' && event.currentTarget.selectionStart === 0) {
                      if (focusAdjacentBlock(index, -1, 'end')) {
                        event.preventDefault()
                      }
                    }
                    if (event.key === 'ArrowDown' && event.currentTarget.selectionStart === event.currentTarget.value.length) {
                      if (focusAdjacentBlock(index, 1, 'start')) {
                        event.preventDefault()
                      }
                    }
                    if (event.key === 'Backspace' && !block.content && sortedBlocks.length > 1) {
                      event.preventDefault()
                      await removeBlock(block.id)
                    }
                  }}
                />
                {block.type === 'toggle' && toggleExpanded ? (
                  <textarea
                    className="toggle-body"
                    placeholder="Hidden content"
                    value={String(block.metadata.body ?? '')}
                    onChange={(event) => {
                      patchBlock(block.id, { metadata: { ...block.metadata, body: event.target.value } })
                      syncHeight(event.target)
                    }}
                  />
                ) : null}
              </div>
            ) : null}
            {slash?.blockId === block.id ? (
              <SlashMenu query={slash.query} onSelect={(type) => void selectSlashType(block.id, type)} onClose={() => setSlash(null)} />
            ) : null}
          </div>
        )
      })}
      <div className="editor-actions">
        <Button onClick={() => void appendBlock(sortedBlocks[sortedBlocks.length - 1]?.sort_order ?? 0)}>Add block</Button>
      </div>
    </div>
  )
}

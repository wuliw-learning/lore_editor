import { useEffect, useMemo, useRef, useState } from 'react'
import type { DragEvent, KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  createBlock,
  createPage,
  deleteBlockApi,
  getFileContentUrl,
  listBlocks,
  listFiles,
  reorderBlocks,
  updateBlock,
  updatePage,
  uploadFile,
} from '../api/pages'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { useDebouncedEffect } from '../hooks/useDebouncedEffect'
import type { Block, Page, UploadedFile } from '../types'
import { getMatchingBlockOptions } from './blockTypes'
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
  activeIndex: number
} | null

type DropIndicator = {
  blockId: number
  position: 'before' | 'after'
} | null

const SLASH_COMMAND_REGEX = /\\([^\s]*)$/

function emptyMetadataForType(type: string): Record<string, unknown> {
  if (type === 'todo') return { checked: false }
  if (type === 'toggle') return { expanded: false, body: '' }
  if (type === 'callout') return { icon: 'i' }
  if (type === 'image') return { file_id: null }
  return {}
}

function stripSlashCommand(value: string): string {
  return value.replace(SLASH_COMMAND_REGEX, '').trimEnd()
}

function getSlashQuery(value: string): string | null {
  const match = value.match(SLASH_COMMAND_REGEX)
  return match ? match[1] : null
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

function getBlockPlaceholder(type: string, isFirstBlock: boolean): string {
  if (type === 'heading_1') return 'Heading 1'
  if (type === 'heading_2') return 'Heading 2'
  if (type === 'heading_3') return 'Heading 3'
  if (type === 'quote') return 'Quote'
  if (type === 'callout') return 'Callout'
  if (type === 'toggle') return 'Toggle title'
  if (type === 'todo') return 'To-do'
  if (type === 'bulleted_list') return 'List item'
  if (type === 'numbered_list') return 'List item'
  if (type === 'image') return 'Write a caption'
  return isFirstBlock ? 'Start typing or enter \\ to choose a block' : ''
}

function resequenceBlocks(items: Block[]): Block[] {
  return items.map((block, index) => ({ ...block, sort_order: index }))
}

function buildReorderPayload(items: Block[]) {
  return items.map((block) => ({ id: block.id, sort_order: block.sort_order }))
}

function isImageFile(file: UploadedFile): boolean {
  return file.mime_type.startsWith('image/')
}

export function BlockEditor({ pageId, pages, onRefreshPages, onSavingState }: Props) {
  const navigate = useNavigate()
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [slash, setSlash] = useState<SlashState>(null)
  const [focusBlockId, setFocusBlockId] = useState<number | null>(null)
  const [skipNextEnterBlockId, setSkipNextEnterBlockId] = useState<number | null>(null)
  const [pageLinkDrafts, setPageLinkDrafts] = useState<Record<number, string>>({})
  const [draggedBlockId, setDraggedBlockId] = useState<number | null>(null)
  const [dropIndicator, setDropIndicator] = useState<DropIndicator>(null)
  const [imagePickerBlockId, setImagePickerBlockId] = useState<number | null>(null)
  const [imageFiles, setImageFiles] = useState<UploadedFile[]>([])
  const [imagePickerLoading, setImagePickerLoading] = useState(false)
  const [imagePickerError, setImagePickerError] = useState('')
  const inputRefs = useRef<Record<number, HTMLTextAreaElement | null>>({})
  const pageLinkTitleRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const imageInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

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
      setBlocks(resequenceBlocks(await listBlocks(pageId)))
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

  const insertBlockAt = async (index: number, type = 'text') => {
    const created = await createBlock(pageId, {
      type,
      content: '',
      metadata: emptyMetadataForType(type),
      sort_order: index,
    })
    const nextBlocks = resequenceBlocks([...sortedBlocks.slice(0, index), created, ...sortedBlocks.slice(index)])
    setBlocks(nextBlocks)
    setFocusBlockId(created.id)
    await reorderBlocks(pageId, buildReorderPayload(nextBlocks))
  }

  const insertTextBlocksAfter = async (afterSortOrder: number, contents: string[]) => {
    if (contents.length === 0) return [] as Block[]

    const insertIndex = afterSortOrder + 1
    const createdBlocks: Block[] = []
    for (const [offset, content] of contents.entries()) {
      const created = await createBlock(pageId, {
        type: 'text',
        content,
        metadata: {},
        sort_order: insertIndex + offset,
      })
      createdBlocks.push(created)
    }

    const nextBlocks = resequenceBlocks([
      ...sortedBlocks.slice(0, insertIndex),
      ...createdBlocks,
      ...sortedBlocks.slice(insertIndex),
    ])
    setBlocks(nextBlocks)
    setFocusBlockId(createdBlocks[createdBlocks.length - 1]?.id ?? null)
    await reorderBlocks(pageId, buildReorderPayload(nextBlocks))
    return createdBlocks
  }

  const persistReorder = async (nextBlocks: Block[]) => {
    setBlocks(nextBlocks)
    await reorderBlocks(pageId, buildReorderPayload(nextBlocks))
  }

  const moveBlock = async (blockId: number, targetIndex: number) => {
    const currentIndex = sortedBlocks.findIndex((block) => block.id === blockId)
    if (currentIndex === -1 || currentIndex === targetIndex) return

    const ordered = [...sortedBlocks]
    const [moved] = ordered.splice(currentIndex, 1)
    ordered.splice(targetIndex, 0, moved)
    await persistReorder(resequenceBlocks(ordered))
  }

  const removeBlock = async (blockId: number) => {
    if (sortedBlocks.length <= 1) return
    const currentIndex = sortedBlocks.findIndex((block) => block.id === blockId)
    const fallbackBlockId = sortedBlocks[currentIndex - 1]?.id ?? sortedBlocks[currentIndex + 1]?.id ?? null
    await deleteBlockApi(blockId)
    const remainingBlocks = resequenceBlocks(sortedBlocks.filter((block) => block.id !== blockId))
    setBlocks(remainingBlocks)
    setFocusBlockId(fallbackBlockId)
    await reorderBlocks(pageId, buildReorderPayload(remainingBlocks))
  }

  const saveLinkedPageTitle = async (blockId: number, linkedPageId: number, value: string) => {
    const nextTitle = value.trim() || 'Untitled page'
    setPageLinkDrafts((current) => ({ ...current, [linkedPageId]: nextTitle }))
    patchBlock(blockId, { content: nextTitle })
    await updatePage(linkedPageId, { title: nextTitle })
    await onRefreshPages()
  }

  const convertPageLinkToText = (blockId: number, fallbackContent: string) => {
    patchBlock(blockId, {
      type: 'text',
      content: fallbackContent.trim() || 'Deleted page',
      metadata: {},
    })
  }

  const loadImageFiles = async () => {
    setImagePickerLoading(true)
    setImagePickerError('')
    try {
      const files = await listFiles()
      setImageFiles(files.filter(isImageFile))
    } catch (err) {
      setImagePickerError(err instanceof Error ? err.message : 'Failed to load images')
    } finally {
      setImagePickerLoading(false)
    }
  }

  const openImagePicker = async (blockId: number) => {
    setImagePickerBlockId(blockId)
    await loadImageFiles()
  }

  const applyImageToBlock = (blockId: number, file: UploadedFile) => {
    patchBlock(blockId, {
      type: 'image',
      content: '',
      metadata: {
        file_id: file.id,
        original_name: file.original_name,
        mime_type: file.mime_type,
        size: file.size,
      },
    })
    setImagePickerBlockId(null)
  }

  const handleInlineImageUpload = async (blockId: number, file: File) => {
    try {
      setImagePickerError('')
      const uploaded = await uploadFile(file)
      if (!isImageFile(uploaded)) {
        throw new Error('Please select an image file')
      }
      setImageFiles((current) => [uploaded, ...current.filter((item) => item.id !== uploaded.id)])
      applyImageToBlock(blockId, uploaded)
    } catch (err) {
      setImagePickerError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  const selectSlashType = async (blockId: number, type: string, sourceContent?: string) => {
    const block = blocks.find((item) => item.id === blockId)
    if (!block) return
    const currentContent = sourceContent ?? block.content

    if (type === 'page_link') {
      const nextTitle = stripSlashCommand(currentContent).trim() || 'Untitled page'
      const child = await createPage(nextTitle, pageId)
      patchBlock(blockId, {
        type,
        content: child.title,
        metadata: { linked_page_id: child.id },
      })
      await onRefreshPages()
      setSkipNextEnterBlockId(blockId)
      setFocusBlockId(blockId)
      setSlash(null)
      return
    }

    if (type === 'image') {
      patchBlock(blockId, {
        type,
        content: '',
        metadata: emptyMetadataForType(type),
      })
      setSlash(null)
      await openImagePicker(blockId)
      return
    }

    patchBlock(blockId, {
      type,
      content: type === 'divider' ? '' : stripSlashCommand(currentContent),
      metadata: emptyMetadataForType(type),
    })
    setSkipNextEnterBlockId(blockId)
    setFocusBlockId(blockId)
    setSlash(null)
  }

  const getDropTarget = (event: DragEvent<HTMLDivElement>, blockId: number) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const position = event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after'
    return { blockId, position } as const
  }

  const handleBlockDragOver = (event: DragEvent<HTMLDivElement>, blockId: number) => {
    if (draggedBlockId === null || draggedBlockId === blockId) return
    event.preventDefault()
    const nextIndicator = getDropTarget(event, blockId)
    setDropIndicator((current) =>
      current?.blockId === nextIndicator.blockId && current.position === nextIndicator.position ? current : nextIndicator,
    )
  }

  const handleBlockDrop = async (event: DragEvent<HTMLDivElement>, blockId: number) => {
    if (draggedBlockId === null) return
    event.preventDefault()
    const target = getDropTarget(event, blockId)
    const targetIndex = sortedBlocks.findIndex((block) => block.id === blockId)
    if (targetIndex === -1) return

    const nextIndex = target.position === 'before' ? targetIndex : targetIndex + 1
    const currentIndex = sortedBlocks.findIndex((block) => block.id === draggedBlockId)
    const adjustedIndex = currentIndex < nextIndex ? nextIndex - 1 : nextIndex

    setDropIndicator(null)
    setDraggedBlockId(null)
    await moveBlock(draggedBlockId, adjustedIndex)
  }

  const handleTextBlockKeyDown = async (
    event: KeyboardEvent<HTMLTextAreaElement>,
    block: Block,
    index: number,
    enableSlashMenu: boolean,
  ) => {
    const slashQueryFromValue = enableSlashMenu ? getSlashQuery(event.currentTarget.value) : null
    const isSlashOpenForBlock = Boolean(slashQueryFromValue) || (enableSlashMenu && slash?.blockId === block.id)
    const currentSlash = isSlashOpenForBlock
      ? slash?.blockId === block.id
        ? slash
        : { blockId: block.id, query: slashQueryFromValue ?? '', activeIndex: 0 }
      : null
    const slashItems = currentSlash ? getMatchingBlockOptions(currentSlash.query) : []

    if (event.key === 'Escape') {
      if (isSlashOpenForBlock) {
        event.preventDefault()
        setSlash(null)
        return
      }
    }
    if (isSlashOpenForBlock && event.key === 'ArrowUp') {
      event.preventDefault()
      event.stopPropagation()
      setSlash((current) => {
        if (!current || current.blockId !== block.id) return current
        return { ...current, activeIndex: (current.activeIndex - 1 + Math.max(slashItems.length, 1)) % Math.max(slashItems.length, 1) }
      })
      return
    }
    if (isSlashOpenForBlock && event.key === 'ArrowDown') {
      event.preventDefault()
      event.stopPropagation()
      if (!slash || slash.blockId !== block.id) {
        setSlash({ blockId: block.id, query: slashQueryFromValue ?? '', activeIndex: 0 })
        return
      }
      setSlash((current) => {
        if (!current || current.blockId !== block.id) return current
        return { ...current, activeIndex: (current.activeIndex + 1) % Math.max(slashItems.length, 1) }
      })
      return
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

    if (event.key === 'Enter' && !event.shiftKey) {
      if (isSlashOpenForBlock) {
        event.preventDefault()
        event.stopPropagation()
        const selectedType = slashItems[currentSlash?.activeIndex ?? 0]?.type ?? slashItems[0]?.type ?? null
        if (selectedType) {
          await selectSlashType(block.id, selectedType, event.currentTarget.value)
        }
        return
      }

      event.preventDefault()
      if (skipNextEnterBlockId === block.id) {
        setSkipNextEnterBlockId(null)
        return
      }
      if (isListLikeBlock(block.type) && !block.content.trim()) {
        patchBlock(block.id, { type: 'text', metadata: {} })
        return
      }
      const nextType = block.type === 'todo'
        ? 'todo'
        : block.type === 'numbered_list'
          ? 'numbered_list'
          : block.type === 'bulleted_list'
            ? 'bulleted_list'
            : 'text'
      await insertBlockAt(index + 1, nextType)
      return
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
    const hasInlineImage = block.type === 'image' && typeof block.metadata.file_id === 'number'
    if (event.key === 'Backspace' && !block.content && sortedBlocks.length > 1 && !hasInlineImage) {
      event.preventDefault()
      await removeBlock(block.id)
    }
  }

  const activeImagePickerBlockId = imagePickerBlockId

  if (loading) return <div className="page-state">Loading blocks...</div>
  if (error) return <div className="page-state error-box">{error}</div>

  return (
    <>
      <div className="editor-shell">
        {sortedBlocks.length === 0 ? <div className="empty-editor">Start typing or enter \ to choose a block</div> : null}
        {sortedBlocks.map((block, index) => {
          const toggleExpanded = Boolean(block.metadata.expanded)
          const linkedPageId = typeof block.metadata.linked_page_id === 'number' ? Number(block.metadata.linked_page_id) : null
          const hasLinkedPage = linkedPageId ? pageTitleMap.has(linkedPageId) : false
          const isBrokenPageLink = block.type === 'page_link' && Boolean(linkedPageId) && !hasLinkedPage
          const linkedPageTitle = linkedPageId ? pageLinkDrafts[linkedPageId] ?? pageTitleMap.get(linkedPageId) ?? block.content ?? 'Untitled page' : block.content ?? 'Untitled page'
          const lineNumber = block.type === 'numbered_list'
            ? 1 + sortedBlocks.slice(0, index).reduce((count, item) => (item.type === 'numbered_list' ? count + 1 : 0), 0)
            : null
          const imageFileId = typeof block.metadata.file_id === 'number' ? Number(block.metadata.file_id) : null
          const showDropBefore = dropIndicator?.blockId === block.id && dropIndicator.position === 'before'
          const showDropAfter = dropIndicator?.blockId === block.id && dropIndicator.position === 'after'

          return (
            <div
              key={block.id}
              className={`editor-block block-${block.type}${draggedBlockId === block.id ? ' is-dragging' : ''}`}
              onDragOver={(event) => void handleBlockDragOver(event, block.id)}
              onDrop={(event) => void handleBlockDrop(event, block.id)}
            >
              {showDropBefore ? <div className="block-drop-indicator block-drop-indicator-top" /> : null}
              <button className="block-handle" onClick={() => void insertBlockAt(index, 'text')} aria-label="Insert block above">
                +
              </button>
              <button
                className="block-drag-handle"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move'
                  event.dataTransfer.setData('text/plain', String(block.id))
                  setDraggedBlockId(block.id)
                }}
                onDragEnd={() => {
                  setDraggedBlockId(null)
                  setDropIndicator(null)
                }}
                aria-label="Drag block"
                title="Drag block"
              >
                ::
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
              {block.type === 'page_link' && linkedPageId && !isBrokenPageLink ? (
                <button className="page-link" onClick={() => navigate(`/pages/${linkedPageId}`)}>
                  <span className="page-link-icon" aria-hidden="true">
                    <span className="page-link-icon-paper" />
                  </span>
                  <span className="page-link-copy">
                    <input
                      ref={(element) => {
                        pageLinkTitleRefs.current[block.id] = element
                      }}
                      className="page-link-title"
                      value={linkedPageTitle || 'Untitled page'}
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={(event) => event.stopPropagation()}
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
                  <span className="page-link-open">Open</span>
                </button>
              ) : null}
              {isBrokenPageLink ? (
                <div className="page-link page-link-broken">
                  <span className="page-link-icon" aria-hidden="true">
                    <span className="page-link-icon-paper" />
                  </span>
                  <span className="page-link-copy">
                    <input
                      className="page-link-title"
                      value={block.content || 'Deleted page'}
                      onChange={(event) => patchBlock(block.id, { content: event.target.value })}
                      onBlur={() => convertPageLinkToText(block.id, block.content || 'Deleted page')}
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
                    <span>Deleted page reference</span>
                  </span>
                  <button className="page-link-open" onClick={() => convertPageLinkToText(block.id, block.content || 'Deleted page')}>
                    Convert
                  </button>
                </div>
              ) : null}
              {block.type === 'image' ? (
                <div className="block-input-wrap image-block-wrap">
                  <div className="image-block-card">
                    {imageFileId ? (
                      <img className="inline-image" src={getFileContentUrl(imageFileId)} alt={block.content || 'Inline image'} />
                    ) : (
                      <div className="inline-image-placeholder">Choose an image to place it inline.</div>
                    )}
                    <div className="image-block-actions">
                      <input
                        ref={(element) => {
                          imageInputRefs.current[block.id] = element
                        }}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={async (event) => {
                          const file = event.target.files?.[0]
                          if (!file) return
                          await handleInlineImageUpload(block.id, file)
                          event.target.value = ''
                        }}
                      />
                      <Button className="image-action-button" onClick={() => imageInputRefs.current[block.id]?.click()}>
                        Upload image
                      </Button>
                      <Button className="image-action-button" onClick={() => void openImagePicker(block.id)}>
                        Choose from Files
                      </Button>
                    </div>
                  </div>
                  <textarea
                    ref={(element) => {
                      inputRefs.current[block.id] = element
                      syncHeight(element)
                    }}
                    className="block-input image-caption"
                    value={block.content}
                    placeholder={getBlockPlaceholder(block.type, index === 0)}
                    onChange={(event) => {
                      patchBlock(block.id, { content: event.target.value })
                      syncHeight(event.target)
                    }}
                    onKeyDown={(event) => void handleTextBlockKeyDown(event, block, index, false)}
                  />
                </div>
              ) : null}
              {block.type !== 'divider' && block.type !== 'page_link' && block.type !== 'image' ? (
                <div className="block-input-wrap">
                  <textarea
                    ref={(element) => {
                      inputRefs.current[block.id] = element
                      syncHeight(element)
                    }}
                    className={`block-input input-${block.type}${block.type === 'todo' && Boolean(block.metadata.checked) ? ' todo-complete' : ''}`}
                    value={block.content}
                    placeholder={getBlockPlaceholder(block.type, index === 0)}
                    onChange={(event) => {
                      const value = event.target.value
                      if (skipNextEnterBlockId === block.id) {
                        setSkipNextEnterBlockId(null)
                      }
                      patchBlock(block.id, { content: value })
                      syncHeight(event.target)
                      const slashQuery = getSlashQuery(value)
                      if (slashQuery !== null) {
                        setSlash((current) => {
                          if (current?.blockId === block.id) {
                            return { blockId: block.id, query: slashQuery, activeIndex: 0 }
                          }
                          return { blockId: block.id, query: slashQuery, activeIndex: 0 }
                        })
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
                    onKeyDown={(event) => void handleTextBlockKeyDown(event, block, index, true)}
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
                <SlashMenu
                  query={slash.query}
                  onSelect={(type) => void selectSlashType(block.id, type)}
                  activeIndex={slash.activeIndex}
                  onActiveIndexChange={(activeIndex) => setSlash((current) => (current && current.blockId === block.id ? { ...current, activeIndex } : current))}
                />
              ) : null}
              {showDropAfter ? <div className="block-drop-indicator block-drop-indicator-bottom" /> : null}
            </div>
          )
        })}
        <div className="editor-actions">
          <Button onClick={() => void insertBlockAt(sortedBlocks.length)}>Add block</Button>
        </div>
      </div>
      {activeImagePickerBlockId !== null ? (
        <Modal title="Insert image" onClose={() => setImagePickerBlockId(null)}>
          <div className="image-picker-content">
            <label className="upload-button image-picker-upload">
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  await handleInlineImageUpload(activeImagePickerBlockId, file)
                  event.target.value = ''
                }}
              />
              Upload new image
            </label>
            <div className="image-picker-actions">
              <Button onClick={() => void loadImageFiles()}>Refresh library</Button>
            </div>
            {imagePickerError ? <div className="error-box">{imagePickerError}</div> : null}
            {imagePickerLoading ? <div className="muted">Loading images...</div> : null}
            {!imagePickerLoading && imageFiles.length === 0 ? <div className="muted">No uploaded images yet.</div> : null}
            <div className="image-picker-grid">
              {imageFiles.map((file) => (
                <button key={file.id} className="image-picker-item" onClick={() => applyImageToBlock(activeImagePickerBlockId, file)}>
                  <img src={getFileContentUrl(file.id)} alt={file.original_name} />
                  <strong>{file.original_name}</strong>
                  <span className="muted">{(file.size / 1024).toFixed(1)} KB</span>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  )
}

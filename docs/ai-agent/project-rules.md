# AI Agent Project Rules

## Purpose

This document is the primary rule set for AI agents working on Lore. It consolidates product decisions, UX constraints, backend invariants, and implementation workflow expectations from the project history.

## Core Product Rules

1. Lore is a single-user, private notebook.
2. Authentication must protect both frontend access and all API routes except login.
3. The app remains compact and self-hosted.
4. The deployment model remains one container with Nginx, FastAPI, SQLite, and the built frontend.
5. Avoid introducing multi-user, collaborative, realtime, public-sharing, or enterprise-style complexity.

## Storage And Runtime Rules

1. Database path in Docker must remain `/app/data/lore.db`.
2. Upload path in Docker must remain `/app/storage/uploads`.
3. Do not reintroduce backend-relative storage paths like `/app/backend/...`.
4. Startup may migrate legacy storage from the old mistaken backend-relative location.
5. Changes touching storage must preserve host volume compatibility.

## Page Model Rules

1. Root pages have `parent_id = null`.
2. Deleting a page with child pages is blocked.
3. Nested pages are normal pages referenced by `metadata.linked_page_id` inside `page_link` blocks.
4. Deleting a linked nested page must not leave dead navigation behind.
5. Backend cleanup must convert matching `page_link` blocks into safe `text` blocks before deleting the target page.

## Block Editor Rules

1. The editor is page-like, not form-like.
2. Focus states must stay quiet and should not introduce aggressive form outlines.
3. New blocks inserted between existing blocks must remain visually obvious in place.
4. Empty structured blocks must show placeholders.
5. Slash menu insertion must not create an accidental extra block from the same Enter press.
6. Insertion order and focus retention are high-risk areas and must be tested carefully.

## Keyboard Interaction Rules

1. Slash menu uses `ArrowUp`, `ArrowDown`, `Enter`, and `Esc`.
2. Active slash-menu items must stay visible while navigating.
3. `Alt + ArrowUp` moves to the previous block.
4. `Alt + ArrowDown` moves to the next block.
5. Plain `ArrowUp` and `ArrowDown` may cross block boundaries when the caret is already at the start or end of a text block.
6. Any change to keyboard behavior requires updating hotkey documentation.

## Text And Paste Rules

1. Large pasted text in a text block is split into paragraph blocks using empty-line boundaries.
2. Height recalculation should stay local to affected textareas to avoid viewport jumps.
3. The editor should keep the currently edited block in view whenever practical.
4. The bottom of the editor should keep extra whitespace so the final block is comfortable to edit.

## List Rules

1. Pressing `Enter` on a non-empty list item creates the next item.
2. Pressing `Enter` on an empty `todo`, `bulleted_list`, or `numbered_list` exits list mode by converting the current block to `text`.
3. Checklist rows, list markers, and toggle markers should stay aligned in a shared left column.

## Nested Page Card Rules

1. Nested page cards should render as page references, not action buttons.
2. The full card is clickable except for the title input, which is reserved for inline rename.
3. The displayed title must be derived from current page state, not blindly trusted from stale block content.
4. Deleted nested page targets must render as broken references with a safe recovery path instead of dead navigation.

## Sidebar Rules

1. Desktop sidebar remains sticky while content scrolls.
2. Sidebar footer remains pinned to the bottom.
3. Page creation belongs to the `Pages` section, not the branding header.
4. Sidebar actions should stay visually lighter than primary document content.
5. Mobile keeps the slide-in drawer behavior.

## Error Recovery Rules

1. Deleted page routes must show a recovery UI, not only a raw error box.
2. Broken nested page references must be recoverable from the editor UI.
3. User-visible dead ends should be replaced by safe actions whenever feasible.

## Change Management Rules

1. Prefer the smallest correct change.
2. Preserve current interaction patterns unless there is a strong reason to change them.
3. When touching editor UX, test with:
   - dense paragraph content
   - inserted blocks between existing blocks
   - nested page cards
   - list exit behavior
   - keyboard block navigation
4. When touching deletion semantics, validate both backend cleanup and frontend recovery states.
5. When touching keyboard behavior, update:
   - `HotkeysModal`
   - `docs/user-guide.md`
   - `docs/frontend.md` when relevant
6. When touching product behavior, update docs in the same pass.

## Recommended Workflow For Agents

1. Inspect the current implementation before changing behavior.
2. Check `docs/ai-agent/architecture-map.md` for file ownership.
3. Check `docs/ai-agent/change-log.md` for prior product decisions.
4. Make focused changes in small batches.
5. Commit by module or behavior, not as one large mixed change.
6. After finishing a behavior change, review whether user docs and AI docs need to be updated.

## File Map For Common Work

1. Editor behavior: `frontend/src/editor/BlockEditor.tsx`
2. Slash menu: `frontend/src/editor/SlashMenu.tsx`
3. Page route behavior: `frontend/src/pages/PageView.tsx`
4. Shell and sidebar: `frontend/src/components/AppShell.tsx`
5. Global visual system: `frontend/src/styles/index.css`
6. Page deletion semantics: `backend/app/api/routes/pages.py`
7. Block API behavior: `backend/app/api/routes/blocks.py`

## Do Not Break

1. HttpOnly cookie authentication.
2. Sticky desktop sidebar and mobile drawer split.
3. Safe cleanup of nested page references on deletion.
4. Quiet page-like editor styling.
5. Paragraph-based paste splitting.
6. Keyboard block navigation and slash-menu keyboard support.

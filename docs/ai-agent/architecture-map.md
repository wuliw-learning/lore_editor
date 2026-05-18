# Architecture Map

## Backend Entry Points

- App bootstrap: `backend/app/main.py`
- API router registration: `backend/app/api/router.py`
- Auth dependency: `backend/app/api/deps.py`
- Settings and path resolution: `backend/app/core/config.py`
- DB init and legacy migration: `backend/app/db/init_db.py`

## Core Backend Features

- Page CRUD: `backend/app/api/routes/pages.py`
- Block CRUD and reorder: `backend/app/api/routes/blocks.py`
- Search: `backend/app/api/routes/search.py`
- Files: `backend/app/api/routes/files.py`
- Tasks: `backend/app/api/routes/tasks.py`

## Frontend Entry Points

- Session boot and routing: `frontend/src/App.tsx`
- App shell and sticky sidebar: `frontend/src/components/AppShell.tsx`
- Page route: `frontend/src/pages/PageView.tsx`
- Editor core: `frontend/src/editor/BlockEditor.tsx`
- Slash menu: `frontend/src/editor/SlashMenu.tsx`
- Global styling: `frontend/src/styles/index.css`
- Todo pages: `frontend/src/pages/TodoDayPage.tsx`, `frontend/src/pages/TodoBacklogPage.tsx`

## Feature To File Map

### Nested Pages

- create page blocks: `frontend/src/editor/BlockEditor.tsx`
- page CRUD: `backend/app/api/routes/pages.py`
- page title sync in editor: `frontend/src/editor/BlockEditor.tsx`
- deleted nested page cleanup: `backend/app/api/routes/pages.py`

### Keyboard Navigation

- global app hotkeys: `frontend/src/App.tsx`
- block navigation: `frontend/src/editor/BlockEditor.tsx`
- slash-menu navigation: `frontend/src/editor/SlashMenu.tsx`
- hotkeys help modal: `frontend/src/components/HotkeysModal.tsx`

### Long Text Handling

- paragraph split on paste: `frontend/src/editor/BlockEditor.tsx`
- textarea sizing: `frontend/src/editor/BlockEditor.tsx`

### Sidebar Layout

- structure: `frontend/src/components/AppShell.tsx`
- sticky behavior and footer pinning: `frontend/src/styles/index.css`

### Daily Tasks

- API and day sync: `backend/app/api/routes/tasks.py`, `backend/app/services/tasks.py`
- storage model: `backend/app/models/task.py`
- frontend day view: `frontend/src/pages/TodoDayPage.tsx`
- backlog view: `frontend/src/pages/TodoBacklogPage.tsx`
- route registration: `frontend/src/App.tsx`

## Recovery States

- page not found screen: `frontend/src/pages/PageView.tsx`
- deleted nested page references: `frontend/src/editor/BlockEditor.tsx`

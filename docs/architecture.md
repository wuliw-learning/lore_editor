# Architecture

## Overview

Lore is a single-container self-hosted application that combines:

- Nginx for HTTP entry and static frontend delivery
- React frontend built with Vite
- FastAPI backend for auth, pages, blocks, search, and files
- SQLite for structured data
- A mounted filesystem directory for uploads

## Why One Container

The project is designed for simple personal hosting on a VDS. One container reduces operational overhead, keeps setup close to one command, and matches the product scope: one user, one service, one local database.

## Runtime Flow

1. Nginx listens on port `80`.
2. Requests to `/api/*` are proxied to FastAPI on `127.0.0.1:8080`.
3. All other paths serve the built React SPA.
4. `supervisord` keeps both `nginx` and `uvicorn` running in the same container.

## Data Storage

- SQLite database path in container: `/app/data/lore.db`
- Upload directory in container: `/app/storage/uploads`

Both locations are mounted from the host with Docker volumes so data survives restarts.

If an older container wrote data into the mistaken legacy path under `/app/backend/...`, startup migration moves the database and uploads into the mounted directories automatically when the new target is empty.

## Authentication

- Login credentials come from `.env`.
- `POST /api/auth/login` validates them.
- FastAPI issues a signed JWT and stores it in an `HttpOnly` cookie.
- Protected endpoints check the cookie and return `401 Unauthorized` when missing or invalid.
- `POST /api/auth/logout` clears the cookie.

## Page and Block Model

- `Page` stores notebook hierarchy, favorites, and ordering.
- `Block` stores page content blocks and per-block metadata.
- Nested pages are normal pages with `parent_id` set.
- The `Page` block type stores the linked nested page id in block metadata.

## Nested Page References

- Creating a `Page` block creates a child page and stores its id in `metadata.linked_page_id`.
- The frontend renders nested page references as clickable cards with inline title editing.
- The card is clickable everywhere except the title input, which remains editable.
- The frontend resolves the displayed title from the current page list so parent cards stay in sync when a child page is renamed.

## Deletion Recovery

- Deleting a page is still blocked when child pages exist.
- Deleting a nested page target no longer leaves broken navigation behind.
- Before the page row is deleted, backend cleanup converts any `page_link` blocks pointing at that page into regular `text` blocks and marks them with `broken_page_reference` metadata.
- The frontend also contains a safety fallback for older data: orphan nested page references render as broken cards that can be converted to plain text.
- Navigating directly to a deleted page shows a recovery state with a route back to the workspace or the parent page when available.

## Editing Data Flow

1. Frontend loads a page and its blocks.
2. Each block is edited in place.
3. Typing `\` opens a slash menu in the editor.
4. `+` insert handles create new blocks between existing blocks.
5. Keyboard navigation supports moving between blocks with `Alt + ArrowUp` and `Alt + ArrowDown`.
6. Large pasted text is split into new paragraph blocks when separated by empty lines.
7. Edits are autosaved with debounce.
8. Backend persists block updates in SQLite.

## Sidebar Behavior

- The sidebar is sticky on desktop and remains visible while the editor scrolls.
- The page creation action lives inside the `Pages` section instead of the branding header.
- Sidebar navigation scrolls inside the sidebar panel while account actions remain pinned to the bottom.
- On mobile, the sidebar still switches to a slide-in drawer.

## Search

- Search is implemented through SQLite `LIKE` queries.
- It checks page titles and block content.
- Results return a page id, title, snippet, and match source.

## File Handling

- Uploaded files are written to `UPLOAD_DIR`.
- A generated unique filename is used on disk.
- File metadata is stored in SQLite.
- Downloads go through a protected API endpoint instead of a public static path.

## First Version Limits

- No multi-user support
- No collaborative editing
- No public links
- No WebSocket sync
- No rich nested block tree inside toggle blocks
- No advanced full-text ranking

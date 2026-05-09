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

- SQLite database path: `./data/lore.db`
- Upload directory: `./storage/uploads`

Both locations are mounted from the host with Docker volumes so data survives restarts.

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

## Editing Data Flow

1. Frontend loads a page and its blocks.
2. Each block is edited in place.
3. Typing `\` opens a slash menu in the editor.
4. Edits are autosaved with debounce.
5. Backend persists block updates in SQLite.

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

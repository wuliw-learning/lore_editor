# Lore

Lore is a compact self-hosted web notebook for one user. It combines page-based notes, a block editor, nested pages, favorites, exact-match search, and a protected file exchange area in one deployable container.

## Screenshot

Add a screenshot here after first launch:

`docs/screenshot-placeholder.png`

## Features

- Single-user password-protected access
- Root and nested pages
- Favorites in the sidebar
- Day-based todo list with backlog and calendar history
- Block editor with slash menu via `\`
- Supported blocks: text, page, to-do, H1/H2/H3, bulleted list, numbered list, toggle, quote, divider, callout
- Sticky sidebar with pages action embedded in the `Pages` section
- Keyboard block navigation and slash-menu navigation
- Large text paste split into paragraph blocks on empty-line boundaries
- Inline nested page rename with fully clickable nested page cards
- Recovery flow for deleted nested page references
- Exact-match search across page titles and block content
- File upload, download, and delete with auth checks
- Settings page and hotkeys help
- Past todo days available in read-only mode
- One-container deployment with Nginx, React, FastAPI, and SQLite

## Requirements

- Docker
- Docker Compose

## Quick Start

1. Copy `.env.example` to `.env`.
2. Update the credentials and secret key.
3. Start the app:

```bash
docker compose up --build
```

4. Open `http://server_ip/`.
5. Sign in with `LORE_USERNAME` and `LORE_PASSWORD` from `.env`.

Stop the stack with:

```bash
docker compose down
```

## Example .env

```env
LORE_USERNAME=admin
LORE_PASSWORD=change_me_strong_password
SECRET_KEY=change_me_secret_key
DATABASE_URL=sqlite:////app/data/lore.db
UPLOAD_DIR=/app/storage/uploads
MAX_UPLOAD_SIZE_MB=20
APP_HOST=0.0.0.0
APP_PORT=8080
```

## Project Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── editor/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── styles/
│   ├── package.json
│   └── vite.config.ts
├── nginx/
│   └── nginx.conf
├── docs/
│   ├── architecture.md
│   ├── backend.md
│   ├── frontend.md
│   └── user-guide.md
├── storage/
│   └── uploads/
├── data/
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── supervisord.conf
└── README.md
```

## Security Notes

- All API routes except login require authentication.
- Authentication uses a signed JWT stored in an `HttpOnly` cookie.
- Passwords are not stored in `localStorage`.
- Files are only downloadable through an authenticated API endpoint.
- The on-disk stored filename is replaced with a generated unique name.

## Data Storage

- SQLite DB in container: `/app/data/lore.db`
- Uploaded files in container: `/app/storage/uploads`
- Host volumes: `./data` and `./storage/uploads`
- Both are mounted as volumes in `docker-compose.yml`

## Main Commands

```bash
docker compose up --build
docker compose down
```

## Documentation

- `docs/architecture.md`
- `docs/backend.md`
- `docs/frontend.md`
- `docs/user-guide.md`
- `docs/ai-agent/`

## Notes

- Page deletion is blocked if the page has child pages.
- Deleting a nested page converts linked page-card references into safe text blocks instead of leaving broken navigation behind.
- The first version uses exact-match style `LIKE` search rather than full text indexing.
- Toggle blocks use a simple title/body model rather than nested block trees.
- On startup, Lore migrates legacy data from the old mistaken `/app/backend/...` storage path into `/app/data` and `/app/storage/uploads` when needed.

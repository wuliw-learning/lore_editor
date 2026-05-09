# Backend

## Stack

- FastAPI
- SQLAlchemy 2.x
- Pydantic v2
- SQLite
- JWT in `HttpOnly` cookie

## Structure

- `app/main.py`: FastAPI app entrypoint
- `app/api/`: routers and dependencies
- `app/core/`: settings and security helpers
- `app/db/`: engine, session, startup initialization
- `app/models/`: SQLAlchemy models
- `app/schemas/`: request and response schemas
- `app/services/`: small business helpers such as breadcrumbs

## Main Models

### Page

- `id`
- `title`
- `parent_id`
- `is_favorite`
- `sort_order`
- `created_at`
- `updated_at`

Deletion is blocked when child pages exist.

### Block

- `id`
- `page_id`
- `type`
- `content`
- `metadata`
- `sort_order`
- `created_at`
- `updated_at`

Metadata stores values such as checkbox state, toggle expansion state, callout icon, and linked nested page id.

### UploadedFile

- `id`
- `original_name`
- `stored_name`
- `size`
- `mime_type`
- `created_at`

## Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

All non-login routes require the auth dependency from `app/api/deps.py`.

## API Overview

### Pages

- `GET /api/pages`
- `POST /api/pages`
- `GET /api/pages/{page_id}`
- `PATCH /api/pages/{page_id}`
- `DELETE /api/pages/{page_id}`
- `POST /api/pages/{page_id}/favorite`
- `DELETE /api/pages/{page_id}/favorite`

### Blocks

- `GET /api/pages/{page_id}/blocks`
- `POST /api/pages/{page_id}/blocks`
- `PATCH /api/blocks/{block_id}`
- `DELETE /api/blocks/{block_id}`
- `PATCH /api/pages/{page_id}/blocks/reorder`

### Search

- `GET /api/search?q=...`

### Files

- `GET /api/files`
- `POST /api/files`
- `GET /api/files/{file_id}/download`
- `DELETE /api/files/{file_id}`

### App Info

- `GET /api/app/info`

## SQLite Notes

- The engine is configured with `check_same_thread=False` for SQLite.
- Tables are created on startup by `init_db()`.
- The default DB file path is configured through `DATABASE_URL`.

## File Upload Limits

- `MAX_UPLOAD_SIZE_MB` is read from `.env`.
- The backend reads the uploaded file into memory and rejects oversized payloads.
- Nginx also sets `client_max_body_size` to keep large uploads out early.

## Extending the Backend

1. Add or update a model in `app/models/`.
2. Add request/response schemas in `app/schemas/`.
3. Create or update a router in `app/api/routes/`.
4. Register the router in `app/api/router.py`.
5. Document the endpoint in this file and `README.md` if it is user-visible.

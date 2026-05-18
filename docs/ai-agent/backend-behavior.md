# Backend Behavior

## Auth Model

- Credentials come from `.env`.
- Login returns a JWT stored in an `HttpOnly` cookie.
- All non-login endpoints require auth.

## Page Deletion Rules

- A page cannot be deleted if it still has child pages.
- Before deleting a page, backend cleanup finds `page_link` blocks that reference that page.
- Matching blocks are converted into plain text blocks so documents do not keep dead navigation entries.

## Block Metadata Conventions

- `linked_page_id`: nested page target id
- `checked`: to-do completion state
- `expanded`: toggle open/closed state
- `body`: simple toggle body content
- `icon`: callout icon marker
- `broken_page_reference`: marker used when a deleted nested page link has been converted away from live page navigation

## Storage Rules

- Always use resolved storage paths from `backend/app/core/config.py`.
- Avoid reintroducing cwd-relative storage assumptions.
- Startup migration may copy the old DB and move old uploads from `/app/backend/...` into mounted directories.

## API Semantics That Matter To Agents

- `DELETE /api/pages/{page_id}` has side effects beyond deleting the row.
- `DELETE /api/blocks/{block_id}` cannot remove the final block on a page.
- `PATCH /api/pages/{page_id}/blocks/reorder` is the source of truth after insertions that shift ordering.
- `POST /api/tasks/sync` materializes missed day entries up to the provided local-date payload.
- Day carry-over only copies tasks whose status is `active`.
- `backlog` tasks are excluded from future daily lists and are retrieved through the dedicated backlog endpoint.

## Regression Risks

- Leaving orphan `page_link` references after deletion
- Breaking the “minimum one block per page” invariant
- Reintroducing non-persistent storage paths
- Returning a 200 on unauthorized routes instead of `401`
- Copying completed or backlog tasks into the next day by mistake

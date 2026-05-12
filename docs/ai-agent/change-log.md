# AI Agent Change Log

## Product Decisions Captured From Iterative Refinement

1. Storage paths were corrected to use `/app/data` and `/app/storage/uploads` and old backend-relative data may be migrated on startup.
2. Login form layout was rebuilt to use a clean vertical auth form.
3. Nested page cards now show real page titles and support inline rename.
4. Editor focus styling was softened to avoid bright form-like outlines.
5. Slash menu keeps the active keyboard selection visible.
6. Page toolbar actions were realigned into a quieter action group.
7. Checklist rows and the left marker column were normalized for better visual rhythm.
8. Sidebar and nested page cards were visually lightened so content remains dominant.
9. Lists can be exited by pressing Enter on an empty list item.
10. Large pasted text is split into paragraph blocks using empty-line boundaries.
11. The editor has extra bottom spacing to keep the last block comfortable to edit.
12. Keyboard block navigation was added via `Alt + ArrowUp` and `Alt + ArrowDown`.
13. Nested page cards are fully clickable except for the inline title editor.
14. The `New page` action was moved into the `Pages` section.
15. The desktop sidebar became sticky and keeps footer actions pinned at the bottom.
16. Deleting a nested page target cleans up page-link references on the backend.
17. Frontend now handles deleted nested page references and deleted page routes with explicit recovery states.
18. Slash-selected inserted blocks no longer create an accidental extra block from the same Enter press.
19. Empty structured blocks now expose placeholders so inserted headings and similar blocks stay visible.

## Guidance For Future Agents

- Prefer small UX changes that preserve the current editor interaction model.
- Treat nested page reference lifecycle as a cross-cutting concern touching backend cleanup and frontend rendering.
- When changing insertion behavior, test with dense paragraph content and with blocks inserted between existing blocks.
- When changing keyboard interactions, update `HotkeysModal` and user docs in the same pass.

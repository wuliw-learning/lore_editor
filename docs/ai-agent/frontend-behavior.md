# Frontend Behavior

## Sidebar

- Desktop sidebar is sticky and remains visible while the editor scrolls.
- The `Pages` section contains the page creation action (`+ New`).
- Sidebar footer stays pinned to the bottom.
- Sidebar account controls now live inside the account block, including logout.
- `Search`, `Files`, and `Settings` render as compact icon-text navigation rows.
- `Todo` and `Backlog` also live in that compact utility navigation area.
- Mobile uses a slide-in drawer instead of sticky desktop positioning.

## Todo Workspace

- `/todo/:date` is the main daily task view.
- The current day can create and edit tasks.
- Past days are read-only and must not expose edit actions.
- Completed tasks sort below active tasks.
- Tasks moved to backlog disappear from the daily list and appear in `/todo/backlog`.
- Active tasks older than 3 days are visually highlighted.
- The day screen includes a small month calendar for navigating historical task lists.
- Task descriptions can insert internal links to notebook pages through a page chooser.

## Themes

- The frontend supports `dark` and `light` themes.
- Theme state is stored in local storage with dark mode as the default starting theme.
- Theme switching is available from `Settings`.
- Global surfaces, cards, modals, and editor-adjacent UI should consume shared theme tokens from `frontend/src/styles/index.css` instead of hardcoded light-only colors.

## Search

- The main search field is embedded in the top bar instead of opening a dedicated modal shell.
- Search results appear in a dropdown directly below the top-bar field.
- `Ctrl + K` and the sidebar `Search` action should focus that same top-bar field.
- Clicking outside the search area or pressing `Esc` closes the dropdown.
- Keyboard result navigation remains `ArrowUp`, `ArrowDown`, and `Enter`.

## Editor Basics

- The editor works as a block list, not a markdown preview split.
- `+` handles insert new blocks between existing blocks.
- Typing `\` at the end of a text block opens the slash menu.
- Slash-selected blocks replace the current placeholder block in place and must not leave a stray `\` token or create an extra block from the same Enter press.

## Block Reordering

- Blocks can be reordered with the drag handle on desktop.
- Dragging shows an explicit drop indicator before or after the hovered block.
- Reordering persists through the existing block reorder API.

## Slash Menu

- `ArrowUp` and `ArrowDown` move the active option.
- Active option auto-scrolls into view.
- `Enter` applies the selected block type.
- `Esc` closes the menu.
- While the slash menu is open, its keyboard handling takes priority over normal block-to-block arrow navigation.

## Structured Block Visibility

- Empty structured blocks show explicit placeholders.
- This is important for inserted `heading`, `quote`, `callout`, `toggle`, and list blocks so they remain visible after insertion between dense text blocks.

## Lists

- Enter on non-empty list-like blocks creates the next list item.
- Enter on an empty `todo`, `bulleted_list`, or `numbered_list` exits list mode by converting the current block to `text`.

## Keyboard Block Navigation

- `Alt + ArrowUp` moves to the previous non-divider block.
- `Alt + ArrowDown` moves to the next non-divider block.
- Plain arrow keys also cross text blocks when the caret is already at a boundary.
- `page_link` title inputs participate in the same navigation model.

## Nested Page Cards

- Nested page cards are fully clickable except for the title input.
- The title is editable inline.
- The displayed title is resolved from the current page list, not trusted blindly from the block payload.
- Cards should read as linked document references inside the editor, not like primary call-to-action buttons.
- Deleted linked pages render as broken cards and can be converted back to text.

## Paste And Long Blocks

- Large text paste into a text block is split into paragraph blocks using empty-line boundaries.
- Height recalculation should stay local to affected textareas to avoid viewport jumps.

## Inline Images

- The editor supports an `image` block rendered inline in the document flow.
- Images can be uploaded directly from the editor or selected from the existing Files library.
- Image blocks keep a caption field in the normal block flow so block navigation remains consistent.
- Filled image blocks keep their upload/source buttons hidden until the image block is focused.

## Important UX Decisions

- Focus styling in the editor is intentionally soft and page-like.
- The editor has extra bottom spacing so the last block is not cramped against the viewport edge.
- Toolbar actions are intentionally quieter than the document content.
- Page-header actions are icon-first controls aligned to the upper-right area.
- Long page titles scale down by length so large headings stay readable without dominating the layout.

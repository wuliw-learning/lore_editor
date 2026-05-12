# Frontend Behavior

## Sidebar

- Desktop sidebar is sticky and remains visible while the editor scrolls.
- The `Pages` section contains the page creation action (`+ New`).
- Sidebar footer stays pinned to the bottom.
- Mobile uses a slide-in drawer instead of sticky desktop positioning.

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
- Deleted linked pages render as broken cards and can be converted back to text.

## Paste And Long Blocks

- Large text paste into a text block is split into paragraph blocks using empty-line boundaries.
- Height recalculation should stay local to affected textareas to avoid viewport jumps.

## Inline Images

- The editor supports an `image` block rendered inline in the document flow.
- Images can be uploaded directly from the editor or selected from the existing Files library.
- Image blocks keep a caption field in the normal block flow so block navigation remains consistent.

## Important UX Decisions

- Focus styling in the editor is intentionally soft and page-like.
- The editor has extra bottom spacing so the last block is not cramped against the viewport edge.
- Toolbar actions are intentionally quieter than the document content.

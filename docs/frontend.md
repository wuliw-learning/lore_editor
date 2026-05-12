# Frontend

## Stack

- React
- TypeScript
- Vite
- React Router

## Structure

- `src/App.tsx`: session bootstrapping, top-level routes, modals
- `src/api/`: frontend API wrappers
- `src/components/`: reusable UI pieces
- `src/editor/`: block editor and slash menu
- `src/hooks/`: debounce and hotkey hooks
- `src/pages/`: page view, files, settings, welcome screen
- `src/styles/`: global styling

## Main UI Areas

### Login Screen

The login form is the only unauthenticated screen. After success, the app reloads the current session and fetches page/app data.

### Sidebar

The left sidebar includes:

- Lore branding
- theme switcher on desktop
- page creation action inside the `Pages` section
- favorites list
- root pages list
- links to search, files, settings
- logout and hotkeys help actions

Desktop behavior:

- the sidebar stays sticky while the page editor scrolls
- the page list scrolls inside the sidebar panel
- account actions remain pinned to the bottom
- theme switching stays available in the shell without opening Settings

### Themes

- Lore supports both dark and light themes.
- The frontend stores the selected theme in local storage under `lore-theme`.
- First load defaults to dark mode unless the user explicitly switches to light mode.
- The current theme can be changed from the shell toggle or the `Settings` page.

### Page View

The page screen includes:

- breadcrumbs for nested pages
- title editing with debounce save
- favorite toggle
- delete action
- block editor

The page toolbar groups `Saved`, `Favorite`, and `Delete` into a quieter document header aligned with the title and breadcrumbs.

## Block Editor

The editor keeps the page in one reading/editing flow rather than using a separate preview.

Implemented block types:

- text
- page link
- to-do
- heading 1/2/3
- bulleted list
- numbered list
- toggle
- quote
- divider
- callout
- image

The editor supports insertion between existing blocks with the `+` handle shown next to each block row.
It also supports desktop drag-and-drop reordering through a dedicated drag handle on each block row.

### Slash Menu

- Typing `\` at the end of a block opens the slash menu.
- The menu filters by typed text.
- `ArrowUp` and `ArrowDown` move selection.
- `Enter` applies the selected block type.
- `Esc` closes the menu.
- The active menu option auto-scrolls into view during keyboard navigation.
- While the menu is open, slash-menu keyboard handling takes precedence over normal block navigation.
- Empty structured blocks show placeholders so inserted headings, quotes, callouts, toggles, and list items remain visible immediately after insertion.
- Slash-selected blocks replace the current placeholder block in place instead of leaving the raw `\` command behind.

### Autosave

- Block changes are stored locally in state first.
- A debounce hook batches save requests.
- The page header shows `Saving...`, `Saved`, or `Save failed`.

### Keyboard Navigation

- `Alt + ArrowUp` focuses the previous block.
- `Alt + ArrowDown` focuses the next block.
- Plain `ArrowUp` and `ArrowDown` also move between text blocks when the caret is already at the start or end of the current block.

### Lists

- Pressing `Enter` on a non-empty list item creates the next list item.
- Pressing `Enter` on an empty to-do, bulleted, or numbered item exits the list and converts the current block back to `text`.

### Long Text And Paste

- Pasting large text into a text block splits content into new paragraph blocks when empty lines separate paragraphs.
- Block height recalculation is kept local to the active editor, which reduces viewport jumps when editing below very large blocks.

### Nested Page Cards

- Nested pages render as page-like cards with an inline editable title.
- The full card is clickable except for the title input, which is reserved for rename.
- Cards use the same editorial surface language as the rest of the workspace instead of bright button styling.
- Deleted nested page references render as broken cards with a `Convert` action instead of navigating to a dead route.

### Inline Images

- `image` blocks render directly in the editor flow.
- The image picker supports both direct upload and selecting from the existing Files library.
- Image blocks keep a caption textarea so the block still participates in normal block navigation and autosave.

## Search

- Search opens in a modal.
- Results show the page title and either a title match or block snippet.
- Clicking a result opens the page.

## Files Page

- Lists uploaded files
- Uploads a new file
- Downloads through the backend endpoint
- Serves files inline through an authenticated content endpoint for embedded images
- Deletes an uploaded file

## Settings Page

- application name and version
- description
- current user
- upload limit
- shortcut help entry point
- logout

## Error And Recovery States

- Deleted page routes show a recovery screen with actions to return home or open the parent page.
- Broken nested page references can be converted back to plain text directly inside the editor.

## Adding a New Block Type

1. Add the block type to `src/editor/blockTypes.ts`.
2. Extend block rendering logic in `src/editor/BlockEditor.tsx`.
3. Define any metadata defaults in `emptyMetadataForType()`.
4. Ensure the backend accepts and stores the block type.
5. Document any new behavior here.

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
- create root page button
- favorites list
- root pages list
- links to search, files, settings
- logout and hotkeys help actions

### Page View

The page screen includes:

- breadcrumbs for nested pages
- title editing with debounce save
- favorite toggle
- delete action
- block editor

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

### Slash Menu

- Typing `\` at the end of a block opens the slash menu.
- The menu filters by typed text.
- `ArrowUp` and `ArrowDown` move selection.
- `Enter` applies the selected block type.
- `Esc` closes the menu.

### Autosave

- Block changes are stored locally in state first.
- A debounce hook batches save requests.
- The page header shows `Saving...`, `Saved`, or `Save failed`.

## Search

- Search opens in a modal.
- Results show the page title and either a title match or block snippet.
- Clicking a result opens the page.

## Files Page

- Lists uploaded files
- Uploads a new file
- Downloads through the backend endpoint
- Deletes an uploaded file

## Settings Page

- application name and version
- description
- current user
- upload limit
- shortcut help entry point
- logout

## Adding a New Block Type

1. Add the block type to `src/editor/blockTypes.ts`.
2. Extend block rendering logic in `src/editor/BlockEditor.tsx`.
3. Define any metadata defaults in `emptyMetadataForType()`.
4. Ensure the backend accepts and stores the block type.
5. Document any new behavior here.

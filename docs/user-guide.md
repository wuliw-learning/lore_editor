# User Guide

## Start Lore

1. Copy `.env.example` to `.env`.
2. Set your username, password, and secret key.
3. Keep the storage paths pointed at the mounted container directories:

```env
DATABASE_URL=sqlite:////app/data/lore.db
UPLOAD_DIR=/app/storage/uploads
```
4. Run:

```bash
docker compose up --build
```

5. Open `http://server_ip/`.

## Sign In

Use the values from:

- `LORE_USERNAME`
- `LORE_PASSWORD`

## Change Theme

- Open `Settings` and switch between dark and light mode there.
- Lore starts in dark mode until you explicitly switch to light mode.

## Daily Todo List

1. Open `Todo` in the sidebar.
2. Lore opens the current day and shows that day's active task list.
3. Use `Add task` to create a new task.
4. Open a task to edit its title and description.
5. Use the page picker inside the task modal to insert links to notebook pages into the description.

Daily carry-over rules:

- unfinished tasks move to the next day automatically
- completed tasks stay on the day where you completed them
- backlog tasks do not move forward
- tasks older than 3 days and still active are highlighted

Past days:

- Use the calendar on the right side of the todo page.
- Open any previous day to review that day's tasks.
- Previous days are read-only.

## Backlog

- Use the `Backlog` section in the sidebar to review tasks removed from the main daily list.
- Clicking `Backlog` on a task removes it from the day view and keeps it in the backlog list.

## Create a Root Page

- In the sidebar, open the `Pages` section and click `+ New`.
- Or use `Ctrl + N`.

## Rename a Page

- Open the page.
- Edit the large title field at the top.
- The title saves automatically.

## Create a Nested Page

1. Open a page.
2. In a block, type `\page` or type `\` and choose `Page`.
3. A child page is created and inserted as a page link block.
4. Click anywhere on the page card except the title field to open it.
5. Rename the nested page inline from the parent page if needed.

## Add Blocks

1. Click inside a block.
2. Type normally for text.
3. Press `Enter` to create the next block.
4. Type `\` to open the block picker.
5. Use the `+` handle beside a block to insert a new block between existing blocks.
6. Drag a block by its drag handle to move it to a new position.

Slash-selected blocks replace the current insertion point directly, so you can insert a heading, quote, image, or other block between two existing text blocks.

## Inline Images

1. Open the block picker with `\` and choose `Image`.
2. Upload an image directly, or pick one from the existing `Files` library.
3. The image appears inline in the page and can keep an optional caption below it.
4. After an image is placed, the image action buttons appear when the image block is selected.

## Lists

- Press `Enter` on a list item to create the next item.
- Press `Enter` again on an empty to-do, bulleted, or numbered item to stop the list and continue with a normal text block.

## Large Paste

- Pasting long text into a text block splits separate paragraphs into separate text blocks when they are separated by empty lines.

## Search

- Use the wide search bar at the top of the workspace.
- Or press `Ctrl + K` to focus that same search bar.
- Enter an exact query.
- Results appear directly below the search field.
- Click a result to jump to its page.

## Favorites

- Open a page.
- Click the star icon in the page header.
- Favorited pages appear in the sidebar section.

## Files

1. Open the `Files` section.
2. Upload a file.
3. Reuse uploaded images from inline image blocks inside pages.
4. Use `Download` to retrieve it.
5. Use `Delete` to remove it.

The upload limit is controlled by `MAX_UPLOAD_SIZE_MB` in `.env`.

## Hotkeys

- `Ctrl + K`: open search
- `Ctrl + N`: create root page
- `Ctrl + S`: keep the save interaction familiar while autosave is enabled
- `Ctrl + /`: open hotkeys help
- `Esc`: close modal or slash menu
- `ArrowUp / ArrowDown`: move inside slash menu while it is open
- `Alt + ArrowUp`: move to the previous block
- `Alt + ArrowDown`: move to the next block
- `Enter`: select slash item or create next block

## Deleted Nested Pages

- If a nested page is deleted, old links are converted into safe text references instead of staying broken navigation cards.
- If you open a deleted page route directly, Lore shows a recovery screen with actions to return home or go to the parent page.

## Change Credentials

Update `.env`:

- `LORE_USERNAME`
- `LORE_PASSWORD`
- `SECRET_KEY`

Then restart the container:

```bash
docker compose down
docker compose up --build
```

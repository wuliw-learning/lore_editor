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

## Create a Root Page

- Click `New page` in the sidebar.
- Or use `Ctrl + N`.

## Rename a Page

- Open the page.
- Edit the large title field at the top.
- The title saves automatically.

## Create a Nested Page

1. Open a page.
2. In a block, type `\page` or type `\` and choose `Page`.
3. A child page is created and inserted as a page link block.
4. Click the page link to open it.

## Add Blocks

1. Click inside a block.
2. Type normally for text.
3. Press `Enter` to create the next block.
4. Type `\` to open the block picker.

## Search

- Press `Ctrl + K`.
- Enter an exact query.
- Click a result to jump to its page.

## Favorites

- Open a page.
- Click `Favorite` in the page toolbar.
- Favorited pages appear in the sidebar section.

## Files

1. Open the `Files` section.
2. Upload a file.
3. Use `Download` to retrieve it.
4. Use `Delete` to remove it.

The upload limit is controlled by `MAX_UPLOAD_SIZE_MB` in `.env`.

## Hotkeys

- `Ctrl + K`: open search
- `Ctrl + N`: create root page
- `Ctrl + S`: keep the save interaction familiar while autosave is enabled
- `Ctrl + /`: open hotkeys help
- `Esc`: close modal or slash menu
- `ArrowUp / ArrowDown`: move inside slash menu
- `Enter`: select slash item or create next block

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

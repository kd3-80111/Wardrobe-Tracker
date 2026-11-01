# My Wardrobe

A mobile-first personal wardrobe tracker. Your clothing records and photos stay in this browser; there is no account, server, analytics, or photo upload.

## Features

- Five focused destinations: Home, Wardrobe, Add, Categories, and Settings
- Complete clothing CRUD with visible View, Edit, and Delete actions
- Items can belong to multiple categories; category icons provide image-free item placeholders
- Complete category CRUD with an icon picker, colour distribution bars, reordering, and safe deletion
- Complete usage CRUD with custom icons, colours, reordering, and safe item reassignment
- Preset/custom item colours and emoji preference selection with quick preference updates on cards
- Search, sorting, category, usage, preference, and rehoming filters in the Wardrobe page
- Compact live wardrobe totals on Home
- IndexedDB persistence through Dexie with schema migrations and one-time editable inventory seeding
- JSON backup and restore with photographs, merge or confirmed replace
- Installable PWA with an offline application shell, update prompt, and online status
- Responsive layout for phones and desktop
- Dark-first appearance with a persistent light-mode alternative

## Technology

Vue 3 Composition API, Vue Router hash history, Pinia, Vite, Dexie/IndexedDB, `vite-plugin-pwa`, and plain CSS. No backend or external service is required.

## Local setup

Install Node.js 20.19+ or 22.12+ and pnpm 10+ (Vite 8 requirement), then run:

```sh
pnpm install
pnpm dev
```

Open the local URL printed by Vite. The app seeds its initial sample wardrobe only once in a new browser database.

## Commands

```sh
pnpm dev       # development server
pnpm test      # focused logic tests
pnpm build     # production build and service worker
pnpm preview   # preview the production build
```

## Data, privacy, and backups

Records and compressed photographs are stored locally in IndexedDB on the current browser and device. Nothing is synchronized or uploaded. Use **Settings → Download backup** regularly; the JSON file includes clothing, categories, usages, settings, and photo data. Restore accepts a valid My Wardrobe JSON backup and offers merge or replace. Merge uses record IDs to update existing entries instead of duplicating them. Replace requires confirmation.

Clearing browser/site storage can remove wardrobe data. Back up before changing or clearing browser storage. Data is local to each browser/device, there is no automatic phone-to-PC synchronization, and backups should be exported regularly.

## Initial inventory note

The detailed inventory lines produce 80 individual records. An earlier summary said 78; the detailed category lines are treated as authoritative. Initial pieces are editable placeholders. The printed T-shirt preference includes a note for later review because the source inventory also mentioned dislike.

## PWA installation

Visit the app once while online, then use the browser's **Install app** or **Add to Home screen** option. The service worker caches the app shell for offline access; IndexedDB remains separate from cached application files and survives application updates. Browser support and install prompts vary by device.

## Known limitations

- Data is local to each browser/device.
- No automatic phone-to-PC synchronization.
- Clearing site data can remove wardrobe data.
- Backups should be exported regularly.
- Install prompts and icon treatment vary by browser and platform.

## Deployment

Deployment will be configured later. This repository has not been deployed. Hash-based routes and a relative Vite base are configured for a future GitHub Pages repository subpath.

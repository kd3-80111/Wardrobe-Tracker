# My Wardrobe

A mobile-first personal wardrobe tracker. Your clothing records and photos stay in this browser; there is no account, server, analytics, or photo upload.

## Features

- Wardrobe-first navigation with quick access to Add and Home; Settings is in the header, and Organize is reachable from Home
- Complete clothing CRUD with a streamlined item card and detail actions
- Each item has one subcategory under an editable main category; category icons provide image-free placeholders
- Main category, subcategory, and wear-status editing with safe item reassignment on deletion
- Preset colours, reusable named custom colours, and five-level item ratings
- Seasons, occasions, product links, gallery/camera photos, and a best-effort product image lookup
- Lifetime and since-wash wear counts with wear, undo, wash, and reset actions
- Search, category browsing, and persistent filters for rating, usage, season, occasion, and rehoming
- Select individual items or all visible filtered items to bulk-change rating, subcategory, or usage, or delete them
- Compact live wardrobe totals on Home
- IndexedDB persistence through Dexie with schema migrations and one-time editable inventory seeding
- Version 4 JSON backup and restore with the category hierarchy, custom colours, and photographs
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

Open the local URL printed by Vite. A new browser database starts with four example items and an editable category hierarchy.

## Commands

```sh
pnpm dev       # development server
pnpm test      # focused logic tests
pnpm build     # production build and service worker
pnpm preview   # preview the production build
```

## Data, privacy, and backups

Records and compressed photographs are stored locally in IndexedDB on the current browser and device. Nothing is synchronized or uploaded. Use **Settings → Download backup** regularly; the JSON file includes clothing, both category levels, usages, custom colours, settings, and photos. Version 4 backups support merge or confirmed replace. Older backups require a reviewed category mapping before restore and are currently rejected by the new restore screen.

Clearing browser/site storage can remove wardrobe data. Back up before changing or clearing browser storage. Data is local to each browser/device, there is no automatic phone-to-PC synchronization, and backups should be exported regularly.

## Example data

The repository contains only four generic example items: a white cotton T-shirt, navy denim jacket, grey crewneck sweater, and blue straight-leg jeans. They contain no personal information and can be edited or deleted through the normal wardrobe controls. An untouched legacy 80-item demo database is safely replaced on its next load; customized wardrobes are left unchanged.

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

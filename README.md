# Serie Tracker (Astro + Supabase + TMDB)

A personal series + movies tracker built with Astro 5, Tailwind v4, shadcn/ui, and Supabase.

## Requirements
- Node.js >= 20
- Supabase project (Postgres + Auth)
- TMDB API key

## Quick start
```bash
npm install
cp .env.example .env
npm run dev
```

## Environment variables
Update `.env`:
```
PUBLIC_SITE_URL=http://localhost:4321

# TMDB
TMDB_API_KEY=your_tmdb_key

# Supabase (server + client safe)
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key

# Only if needed for server-side admin tasks (do not expose to client)
SUPABASE_SECRET_KEY=your_secret_key
```

## Supabase schema
1. Open Supabase SQL Editor.
2. Run the SQL in `supabase/schema.sql`.
3. Confirm tables and RLS policies are created.

## Features
- TMDB search + detail proxy endpoints
- Supabase Auth (email/password)
- Personal library with status, rating, notes
- RLS-protected CRUD

## Project setup reference (commands)
If recreating from scratch:
```bash
npm create astro@latest personal-astro-movie-database -- --template empty --typescript strict
cd personal-astro-movie-database
npx astro add react
npm install tailwindcss@^4.1.0 @tailwindcss/vite@^4.1.0
# shadcn/ui
npx shadcn@latest init
```

## Troubleshooting
- Tailwind v4 not compiling: ensure `@tailwindcss/vite` is registered in `astro.config.mjs` and `src/styles/global.css` includes `@import "tailwindcss";`.
- shadcn CLI doesn’t detect Astro: keep `src/components/ui/*` components and `src/lib/utils.ts` as provided; no CLI is required.
- Supabase RLS blocks inserts: confirm `PUBLIC_SUPABASE_PUBLISHABLE_KEY` is correct and policies in `supabase/schema.sql` are applied. Auth must be signed in for `titles` and `user_titles` writes.
- TMDB errors: confirm `TMDB_API_KEY` is set and your search query is at least 2 characters.
- If you previously used the OMDb schema, recreate or migrate the `titles` table to use `tmdb_id` instead of `imdb_id`.
- Production builds: server API routes require an adapter (`@astrojs/node`, Vercel, Netlify, etc.). Add one before running `npm run build` for deployment.

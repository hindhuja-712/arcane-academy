# Arcane Academy — Magical Adventure RPG

A Vite + Phaser 3 + Supabase browser RPG starter with authentication, four house powers, randomized pickups/secrets, spell combat, boss phases, inventory, upgrades, achievements, local/cloud saves, and a leaderboard submission.

## 1. Requirements

- Node.js 20.19+ or 22.12+
- Existing Supabase project (optional for local-only play)
- npm

## 2. Install

```bash
npm install
```

Create `.env` in the project root based on `.env.example`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Use the same URL and publishable key already present in your existing `.env`. Do not use a Supabase `service_role` key in frontend code.

## 3. Database setup

In Supabase Dashboard, open SQL Editor and run all of `supabase/schema.sql`. This creates the `game_saves` and `leaderboard` tables and basic RLS policies.

## 4. Start

```bash
npm run dev
```

Open the local URL Vite prints.

## 5. Controls

- WASD / arrow keys: move
- SPACE: basic spell
- Q: Astral Burst (unlock in shop)
- C: Frost Bind (unlock in shop)
- F: shield
- SHIFT: dodge
- E: interact / activate runes / shop / exit
- H: health potion
- J: mana potion
- X: house power
- I: inventory summary
- P / Escape: pause/resume
- R: restart after game over/victory

## Important notes

- If email confirmation is enabled in Supabase, new users may need to confirm their email before signing in.
- Local browser saves work without Supabase; cloud saves require the SQL schema and RLS policies.
- Browser-side leaderboard scores are not cheat-proof. For production, calculate/validate scores in a Supabase Edge Function.
- The game uses generated shapes and text rather than copyrighted Harry Potter artwork or external image assets.

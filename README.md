# Sakinah

**Little steps, closer to Allah.**

A cute, bilingual (English/Arabic) Islamic daily worship and community web app. Track your prayers, adhkar, Qur'an reading, and dhikr; share Islamic knowledge; join private groups; and climb the leaderboard with friends.

## Features

- **Full authentication** — email/password signup, login, logout, password reset. Unique usernames enforced at the database level (case-insensitive).
- **Daily worship tracker** — track the five obligatory prayers (3 pts each), Qur'an reading (1 pt), morning/evening adhkar (2 pts each). Max 20 required points/day.
- **Optional bonus activities** — Sunnah prayers (1 pt each), dhikr sessions (1 pt if count >= 33, once/day), optional adhkar (1 pt each), knowledge contributions (2 pts each).
- **Digital tasbih counter** — tap-to-count with 33-count bonus threshold.
- **Qur'an journal** — log your daily reading with reflections.
- **Islamic knowledge library** — share, search, bookmark, and browse community contributions with categories and moderation notes.
- **Groups** — create or join private groups with invite codes.
- **Leaderboards** — daily and weekly rankings, current leader, finalized daily winners with tie resolution.
- **Weekly progress** — 7-day breakdown, completion rate, achievements, and reflection.
- **Bilingual** — complete English and Arabic translation with proper RTL layout.
- **Dark/light mode** — persisted across sessions.
- **Mobile-first responsive design** with bottom navigation on mobile and sidebar on desktop.

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase (auth + PostgreSQL + RLS)
- react-router-dom
- lucide-react (icons)

## Points System

### Required (max 20/day)
| Activity | Points |
|---|---|
| Each obligatory prayer (Fajr, Dhuhr, Asr, Maghrib, Isha) | 3 |
| Qur'an reading | 1 |
| Morning adhkar | 2 |
| Evening adhkar | 2 |

### Bonus
| Activity | Points |
|---|---|
| Each Sunnah prayer | 1 (once/day per prayer) |
| Dhikr session >= 33 counts | 1 (once/day) |
| Each optional adhkar | 1 (once/day per adhkar) |
| Knowledge contribution | 2 (once per contribution) |

Points are calculated server-side via PostgreSQL functions — the frontend never submits point totals.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run typecheck
```

## Environment Variables

Supabase credentials are pre-configured in `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Security

- Row Level Security on all tables
- Owner-scoped CRUD policies via `auth.uid()`
- Points calculated via `SECURITY DEFINER` functions
- Username uniqueness enforced via case-insensitive unique index
- Group membership checks via `is_group_member()` function
- Users cannot access or modify other users' private data

© 2026 Noor Club. All rights reserved.

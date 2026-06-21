# StudyTracker — ML Engineering Study Cockpit

A modern, self-owned web app to track your Machine Learning Engineering study
journey. Three views:

- **Overview** — overall progress, per-pillar rings, what you're currently studying.
- **Curriculum** — the complete picture: Pillar → Topic → Subtopic, with a 3-state
  status toggle (Not started → In progress → Done) and inline resource links.
- **Resources** — your books, courses, web material, and saved links. Add links
  directly in the app, tag them, and set a reading status (**To read → Reading →
  Done**) so the page doubles as your idea hub / reading list. Filter by pillar,
  type, and status.

## Your data, your way

- **Curriculum** is a plain, hand-editable file you own and can version in git:
  - `src/data/curriculum.ts` — the full Pillar/Topic/Subtopic tree.
- **Seed resources** (your core books/courses) live in `src/data/resources.ts`.
  **Links you add in the app** are stored in your browser and merged with the seed
  list — seed items stay read-only; added items can be edited/deleted.
- **Progress and added resources** are stored in your browser (`localStorage`). Use
  **Export / Import** on the Overview page to back up *everything* (progress +
  saved links) to a single JSON file or move it to another device. Progress and
  reading status are keyed by stable `id`s, so renaming a title never loses state.

## Run it

```bash
npm install
npm run dev      # open the printed localhost URL
npm run build    # production build (deploy /dist anywhere static)
```

## Customize

- **Add a topic/subtopic:** edit `src/data/curriculum.ts`. New items appear as
  "not started" automatically. Keep `id`s unique and stable.
- **Add a resource:** add an entry to `src/data/resources.ts` and reference its `id`
  from a subtopic's `resourceIds` to show an inline link in the curriculum.
- **Colors/theme:** pillar accents live in `PILLAR_PALETTE` (`src/data/types.ts`);
  global theme variables are in `src/index.css`.

## Stack

Vite · React · TypeScript · Tailwind CSS · framer-motion · lucide-react.

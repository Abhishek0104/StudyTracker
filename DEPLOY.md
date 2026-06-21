# Deploying StudyTracker + setting up sync

StudyTracker is a static site with no backend. Your data lives as a single JSON file
in **your own private GitHub repo**, read/written directly from the browser. Two parts:
(A) set up the data repo + token, (B) deploy the app to a URL.

---

## A. Data repo + access token (do this once)

1. **Create a private repo** for your data — e.g. `studytracker-data`. Leave it empty.
   (Keep it separate from the app's code repo. The app creates the JSON file for you.)

2. **Create a fine-grained token:** github.com → Settings → Developer settings →
   *Fine-grained tokens* → **Generate new token**.
   - **Resource owner:** your account.
   - **Repository access:** *Only select repositories* → pick `studytracker-data`.
   - **Permissions:** Repository permissions → **Contents → Read and write**.
   - Pick a sensible expiry. Generate and copy the `github_pat_...` value.

3. In the app, go to **Settings → GitHub Sync**, paste the token, your username, and the
   repo name, then **Connect & test**. The data file is created automatically.

> Security: the token is stored only in your browser's `localStorage` and is sent only
> to `api.github.com`. Use the fine-grained token above (scoped to one repo), and click
> **Disconnect** to wipe it. Don't connect on a shared/public computer.

---

## B. Deploy the app

### Option 1 — GitHub Pages (set up here)

The workflow at `.github/workflows/deploy.yml` builds and deploys automatically on every
push to `main`. The app uses a **hash router**, so deep links and refreshes work on Pages
with no extra config, and the workflow auto-sets the base path from your repo name.

> Note: GitHub Pages on free accounts is **public** even if the repo is private (private
> Pages needs GitHub Enterprise). Your *data* stays private regardless — only the app
> shell is public. Want the shell private too? See Option 3.

1. Push this project (the *code*, e.g. `studytracker`) to a GitHub repo:
   ```bash
   git init && git add -A && git commit -m "StudyTracker"
   git branch -M main
   git remote add origin https://github.com/<you>/studytracker.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Build and deployment → Source = GitHub Actions**.
3. The "Deploy to GitHub Pages" Action runs automatically. When it finishes, your site is
   at **`https://<you>.github.io/<repo>/`** — open it on your phone too. (Re-runs on every
   push to `main`; or trigger manually from the Actions tab.)

### Option 2 — Vercel

`vercel.json` (included) also works if you prefer Vercel. Import the repo at vercel.com
(preset **Vite**, build `npm run build`, output `dist`), or `npm i -g vercel && vercel`.
You get a `https://<name>.vercel.app` URL.

### Option 3 — Make the shell private (optional)

Free way to gate the whole site to just your email: deploy to **Cloudflare Pages** and put
**Cloudflare Access** in front of it (one-time-PIN login). GitHub Pages can't do private
shells on the free tier.

---

## How sync behaves
- **Local-first:** edits save instantly to your browser and work offline.
- **Auto-pull** on load, **auto-push** ~3s after a change. The nav shows the sync status.
- **Conflicts:** last-write-wins across devices (the most recent edit wins). For a single
  user this is what you want; just let one device finish syncing before editing on another.
- **Export/Import** on the Overview page remains as an offline backup, independent of sync.

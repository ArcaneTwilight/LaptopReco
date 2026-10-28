# SpecMatrix PH — Laptop & Desktop Purchase Analyzer

A lightweight, client-side React + Vite + TypeScript web application for reviewing, filtering, comparing side-by-side, ranking with custom priority weights, and exporting laptop and desktop purchase configurations priced in Philippine Pesos (`₱`).

## Features

- **All Options Table**: Sortable and filterable view of every configuration, including source Value Index and adjusted rank, complete specifications, source pills, a sticky horizontal scrollbar, synced PHP price slider/input, and an interactive bundle-details modal.
- **Side-by-Side Comparison**: Compare 2 to 4 selected machines with automatic best-value highlighting per row and clear callouts for thermal, verification, display, or value concerns.
- **Weighted Recommendation Engine**: View the published adjusted ranking and customize 9 hardware/bundle priority sliders with automatic risk deductions. Default weights match the source rubric; benchmark and component scores are shown for each adjusted recommendation.
- **JSON & Markdown Export**: Export any single option as a clean slugged `.json` or `.md` report containing full specifications, scores, ranks, pros/cons, and a final recommendation summary.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start local dev server (http://localhost:3000)
npm run dev

# 3. Type-check and build production static bundle into dist/
npm run lint
npm run build
```

---

## Hosting on GitHub & Deploying to Vercel

This project is a 100% static client-side SPA with zero backend or database requirements and includes preconfigured `vercel.json` and `.github/workflows/ci.yml` files.

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: SpecMatrix PH laptop & desktop analyzer"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

### 2. Deploy to Vercel (Recommended — Automatic)

1. Sign in to [Vercel](https://vercel.com) and click **Add New... → Project**.
2. Import your GitHub repository.
3. Vercel automatically detects `vercel.json`:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**: None required.
4. Click **Deploy**. Every subsequent `git push` to `main` will automatically deploy to production, and pull requests will receive preview URLs.

### Alternative: Deploy via Vercel CLI

```bash
npx vercel
# Deploy to production:
npx vercel --prod
```

---

## Updating Laptop Data

The app loads the merged dataset from:

- `public/laptop-options.json`

This JSON contains the full specifications, benchmark estimates, rubric component scores,
source and adjusted rankings, recommendations, and caveats from the source-of-truth markdown
and its specification/scoring CSV tables. Update the JSON when refreshing the source data; the
website does not parse the source documents at runtime.

# SpecMatrix PH — Laptop & Desktop Purchase Analyzer

A lightweight, client-side React + Vite + TypeScript web application for reviewing, filtering, comparing side-by-side, ranking with custom priority weights, and exporting laptop and desktop purchase configurations priced in Philippine Pesos (`₱`).

## Features

- **All Options Table**: Sortable and filterable view of all configurations parsed from `all_laptop_options.md`, complete with `Online` / `Store` source pills, an always-visible sticky horizontal scrollbar while scrolling vertically, synced PHP price slider/input, and an interactive Freebies popup modal.
- **Side-by-Side Comparison**: Compare 2 to 4 selected machines with automatic best-value highlighting per row and clear callouts for thermal, verification, display, or value concerns.
- **Weighted Recommendation Engine**: Customize 9 hardware and bundle priority sliders (GPU, VRAM, TGP, RAM, Storage, Display, CPU, Warranty, Freebies) with automatic risk deductions from evaluator notes.
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

Prices and specifications are parsed locally in the browser from the markdown table under `## All options` in:

- `public/assets/aistudio/all_laptop_options__1__53bc6231.md` (or drop an updated `public/all_laptop_options.md` file with the same markdown table columns).

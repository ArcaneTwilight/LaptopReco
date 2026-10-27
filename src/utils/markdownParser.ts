import { FormFactor, LaptopOption, SourceChannel } from '../types/laptop';

/**
 * Formats a numeric value in Philippine Pesos (e.g., 149215 -> "₱149,215").
 * Uses explicit peso symbol prefix so headless or non-PH locales never render "PHP 149,215".
 */
export function formatPHP(amount: number): string {
  return `₱${Math.round(amount).toLocaleString('en-US')}`;
}

/**
 * Formats storage capacity from GB into human-readable GB/TB labels (e.g., 1024 -> "1TB", 512 -> "512GB").
 */
export function formatStorage(gb: number): string {
  if (gb >= 1024 && gb % 1024 === 0) {
    return `${gb / 1024}TB`;
  }
  if (gb >= 1024) {
    return `${(gb / 1024).toFixed(1)}TB`;
  }
  return `${gb}GB`;
}

/**
 * Converts a laptop/desktop model name into a clean lowercase kebab-case filename slug.
 * Example: "Lenovo Legion 5i 83VKCTO1WW" -> "lenovo-legion-5i-83vkcto1ww"
 */
export function toCleanSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Splits a raw markdown option label (e.g., "Online 4/5 — Lenovo Legion 5i 83VKCTO1WW")
 * into its channel/batch prefix ("Online 4/5") and clean model name ("Lenovo Legion 5i 83VKCTO1WW").
 */
function splitOptionTitle(rawTitle: string): { listingPrefix: string; cleanName: string } {
  const dashSplit = rawTitle.split(/\s+—\s+|\s+--\s+/);
  if (dashSplit.length >= 2) {
    const prefix = dashSplit[0].trim();
    const rest = dashSplit.slice(1).join(' — ').trim();
    return {
      listingPrefix: prefix === 'ONLINE DESKTOP' ? 'Online Desktop' : prefix,
      cleanName: rest,
    };
  }
  return {
    listingPrefix: '',
    cleanName: rawTitle.trim(),
  };
}

/**
 * Evaluates raw notes text for thermal, verification, display, platform, or value concerns
 * so UI views can highlight caveats without relying solely on color.
 */
function classifyRiskFromNotes(notes: string): {
  hasRiskConcern: boolean;
  riskSeverity: 'none' | 'caution' | 'high';
} {
  const lower = notes.toLowerCase();
  if (
    lower.includes('thermal') ||
    lower.includes('throttl') ||
    lower.includes('avoid') ||
    lower.includes('verified')
  ) {
    return { hasRiskConcern: true, riskSeverity: 'high' };
  }
  if (
    lower.includes('weak') ||
    lower.includes('worse value') ||
    lower.includes('poor value') ||
    lower.includes('high price')
  ) {
    return { hasRiskConcern: true, riskSeverity: 'caution' };
  }
  return { hasRiskConcern: false, riskSeverity: 'none' };
}

/**
 * Parses the main `## All options` markdown table from `all_laptop_options.md`.
 *
 * How parsing works:
 * 1. Locates the `## All options` section heading in the markdown document.
 * 2. Collects contiguous pipe-delimited (`| ... |`) lines belonging to that table.
 * 3. Extracts column headers from the first table row and skips the alignment separator row (`|---:|...`).
 * 4. Maps each subsequent data row by header index into a strongly typed `LaptopOption`,
 *    preserving all 24 original columns (including component sub-scores) and deriving
 *    normalized GPU labels (handling Desktop RTX 5060 Ti and Laptop RTX 5060 Ti nuances),
 *    clean model names, and export slugs.
 */
export function parseLaptopOptionsMarkdown(markdown: string): LaptopOption[] {
  if (!markdown || !markdown.trim()) {
    return [];
  }

  const lines = markdown.split(/\r?\n/);

  // Step 1: Locate the "## All options" heading (or fall back to the first 20+ column table)
  let startIdx = lines.findIndex((line) => /^##\s+all options/i.test(line.trim()));
  if (startIdx === -1) {
    startIdx = 0;
  }

  // Step 2: Gather contiguous markdown table lines starting after the heading
  const tableLines: string[] = [];
  let inTable = false;

  for (let i = startIdx; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      tableLines.push(trimmed);
    } else if (inTable) {
      // Stop once we hit the end of the `## All options` table block
      break;
    }
  }

  if (tableLines.length < 3) {
    return [];
  }

  // Helper to split a pipe-delimited markdown row into trimmed cell strings
  const parseCells = (row: string): string[] =>
    row
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());

  const headers = parseCells(tableLines[0]).map((h) => h.toLowerCase());

  // Step 3: Build a header lookup map so column ordering changes won't break extraction
  const colIndex = (name: string, fallbackIndex: number): number => {
    const idx = headers.indexOf(name.toLowerCase());
    return idx !== -1 ? idx : fallbackIndex;
  };

  const parseNum = (val: string | undefined): number => {
    if (!val) return 0;
    const cleaned = val.replace(/[₱,\s]/g, '');
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const options: LaptopOption[] = [];

  // Step 4: Iterate through data rows (skipping index 0 header and index 1 `|---|---|` divider)
  for (let rowIdx = 2; rowIdx < tableLines.length; rowIdx++) {
    const rowText = tableLines[rowIdx];
    // Skip markdown alignment separator lines if encountered
    if (/^\|[\s:-]+\|/.test(rowText)) {
      continue;
    }

    const cells = parseCells(rowText);
    if (cells.length < 15) {
      continue;
    }

    const finalRank = parseNum(cells[colIndex('final rank', 0)]);
    const rawLaptop = cells[colIndex('laptop', 1)] || '';
    const source = cells[colIndex('source', 2)] || '';
    const price = parseNum(cells[colIndex('price', 3)]);
    const gpu = parseNum(cells[colIndex('gpu', 4)]);
    const vram = parseNum(cells[colIndex('vram', 5)]);
    const tgp = parseNum(cells[colIndex('tgp', 6)]);
    const ram = parseNum(cells[colIndex('ram', 7)]);
    const storage = parseNum(cells[colIndex('storage', 8)]);
    const display = cells[colIndex('display', 9)] || '';
    const cpu = cells[colIndex('cpu', 10)] || '';
    const freebies = parseNum(cells[colIndex('freebies', 11)]);
    const warranty = parseNum(cells[colIndex('warranty', 12)]);
    const gpuScore = parseNum(cells[colIndex('gpu score', 13)]);
    const vramScore = parseNum(cells[colIndex('vram score', 14)]);
    const tgpScore = parseNum(cells[colIndex('tgp score', 15)]);
    const ramScore = parseNum(cells[colIndex('ram score', 16)]);
    const storageScore = parseNum(cells[colIndex('storage score', 17)]);
    const cpuScore = parseNum(cells[colIndex('cpu score', 18)]);
    const freebieScore = parseNum(cells[colIndex('freebie score', 19)]);
    const warrantyScore = parseNum(cells[colIndex('warranty score', 20)]);
    const score = parseNum(cells[colIndex('score', 21)]);
    const valueScore = parseNum(cells[colIndex('value score', 22)]);
    const notes = cells[colIndex('notes', 23)] || '';

    const { listingPrefix, cleanName } = splitOptionTitle(rawLaptop);
    const slug = toCleanSlug(cleanName || rawLaptop);

    const sourceLower = source.toLowerCase();
    const sourceChannel: SourceChannel = sourceLower.includes('online') ? 'Online' : 'Store';
    const formFactor: FormFactor =
      sourceLower.includes('desktop') || rawLaptop.toLowerCase().includes('desktop')
        ? 'Desktop'
        : 'Laptop';

    // Determine exact GPU variant using raw GPU number + notes context (e.g., 5060 Ti Desktop vs Laptop)
    const notesLower = notes.toLowerCase();
    let gpuModel = `RTX ${gpu}`;
    let gpuDisplay = `RTX ${gpu}`;

    if (notesLower.includes('5060 ti')) {
      gpuModel = 'RTX 5060 Ti';
      gpuDisplay = formFactor === 'Desktop' ? 'RTX 5060 Ti (Desktop)' : 'RTX 5060 Ti';
    } else if (formFactor === 'Desktop') {
      gpuDisplay = `RTX ${gpu} (Desktop)`;
    }

    const { hasRiskConcern, riskSeverity } = classifyRiskFromNotes(notes);

    options.push({
      id: `${finalRank}-${slug}`,
      finalRank,
      laptop: rawLaptop,
      cleanName,
      listingPrefix,
      slug,
      source,
      sourceChannel,
      formFactor,
      price,
      gpu,
      gpuModel,
      gpuDisplay,
      vram,
      tgp,
      ram,
      storage,
      display,
      cpu,
      freebies,
      warranty,
      gpuScore,
      vramScore,
      tgpScore,
      ramScore,
      storageScore,
      cpuScore,
      freebieScore,
      warrantyScore,
      score,
      valueScore,
      notes,
      hasRiskConcern,
      riskSeverity,
    });
  }

  return options;
}

/**
 * Minimal fallback sample records ONLY used if fetching and parsing `all_laptop_options.md`
 * fails completely in an unexpected offline environment.
 */
export const FALLBACK_SAMPLE_OPTIONS: LaptopOption[] = [
  {
    id: '2-lenovo-legion-5i-83vkcto1ww',
    finalRank: 2,
    laptop: 'Online 4/5 — Lenovo Legion 5i 83VKCTO1WW',
    cleanName: 'Lenovo Legion 5i 83VKCTO1WW',
    listingPrefix: 'Online 4/5',
    slug: 'lenovo-legion-5i-83vkcto1ww',
    source: 'Online laptop',
    sourceChannel: 'Online',
    formFactor: 'Laptop',
    price: 149215,
    gpu: 5070,
    gpuModel: 'RTX 5070',
    gpuDisplay: 'RTX 5070',
    vram: 12,
    tgp: 115,
    ram: 16,
    storage: 1024,
    display: '15.3" 2.5K OLED 165Hz',
    cpu: 'Ultra 9 290HX Plus',
    freebies: 10,
    warranty: 1,
    gpuScore: 16,
    vramScore: 6,
    tgpScore: 5.75,
    ramScore: 2,
    storageScore: 2,
    cpuScore: 4.5,
    freebieScore: 3.33,
    warrantyScore: 1,
    score: 40.58,
    valueScore: 27.2,
    notes: 'Best 12GB RTX 5070 value',
    hasRiskConcern: false,
    riskSeverity: 'none',
  },
  {
    id: '4-lenovo-legion-5i-83vk0033ph',
    finalRank: 4,
    laptop: 'Online 1 — Lenovo Legion 5i 83VK0033PH',
    cleanName: 'Lenovo Legion 5i 83VK0033PH',
    listingPrefix: 'Online 1',
    slug: 'lenovo-legion-5i-83vk0033ph',
    source: 'Online laptop',
    sourceChannel: 'Online',
    formFactor: 'Laptop',
    price: 165868,
    gpu: 5070,
    gpuModel: 'RTX 5070',
    gpuDisplay: 'RTX 5070',
    vram: 12,
    tgp: 115,
    ram: 32,
    storage: 1024,
    display: '15.3" 2.5K OLED 165Hz',
    cpu: 'Ultra 7 251HX',
    freebies: 10,
    warranty: 2,
    gpuScore: 16,
    vramScore: 6,
    tgpScore: 5.75,
    ramScore: 4,
    storageScore: 2,
    cpuScore: 3.75,
    freebieScore: 3.33,
    warrantyScore: 2,
    score: 42.83,
    valueScore: 25.82,
    notes: 'Best complete laptop package',
    hasRiskConcern: false,
    riskSeverity: 'none',
  },
  {
    id: '1-asus-tuf-f16-fx608jpr-rv155wsm',
    finalRank: 1,
    laptop: 'Store — ASUS TUF F16 FX608JPR-RV155WSM',
    cleanName: 'ASUS TUF F16 FX608JPR-RV155WSM',
    listingPrefix: 'Store',
    slug: 'asus-tuf-f16-fx608jpr-rv155wsm',
    source: 'Store laptop',
    sourceChannel: 'Store',
    formFactor: 'Laptop',
    price: 111999,
    gpu: 5070,
    gpuModel: 'RTX 5070',
    gpuDisplay: 'RTX 5070',
    vram: 8,
    tgp: 115,
    ram: 16,
    storage: 1024,
    display: '16" FHD+ IPS 165Hz G-Sync',
    cpu: 'Core i7-14650HX',
    freebies: 3,
    warranty: 0,
    gpuScore: 16,
    vramScore: 4,
    tgpScore: 5.75,
    ramScore: 2,
    storageScore: 2,
    cpuScore: 3,
    freebieScore: 1,
    warrantyScore: 0,
    score: 33.75,
    valueScore: 30.13,
    notes: 'High paper value; thermal throttling risk',
    hasRiskConcern: true,
    riskSeverity: 'high',
  },
];

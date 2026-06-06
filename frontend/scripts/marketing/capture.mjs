/*
 * Marketing screenshot driver for «Referat».
 *
 * Spins up Playwright Chromium against the running Next.js dev server
 * (http://localhost:3118), injects the mock Tauri bridge (mock-tauri.js) so the
 * UI populates with the Norwegian demo dataset, drives each key screen, and
 * writes RAW browser PNGs into <outdir>/raw/. A separate compositor
 * (compose.py) then frames them as macOS window product shots.
 *
 * Usage:
 *   node scripts/marketing/capture.mjs [rawOutDir]
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MOCK = readFileSync(join(__dirname, 'mock-tauri.js'), 'utf8');

const BASE = 'http://localhost:3118';
const RAW_OUT = process.argv[2] || join(__dirname, 'raw');
mkdirSync(RAW_OUT, { recursive: true });

const VIEWPORT = { width: 1100, height: 700 };
const SCALE = 2;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function newPage(browser, viewport = VIEWPORT) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: SCALE,
    locale: 'nb-NO',
    timezoneId: 'Europe/Oslo',
    colorScheme: 'light',
  });
  // Inject BEFORE any app JS runs.
  await context.addInitScript(MOCK);
  const page = await context.newPage();
  page.on('console', (msg) => {
    const t = msg.text();
    if (t.includes('[mock-tauri] unmocked')) console.log('   ' + t);
  });
  page.on('pageerror', (err) => console.log('   [pageerror] ' + err.message));
  return { context, page };
}

async function goto(page, path) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  // Give React effects (data fetch + render) time to settle.
  await sleep(900);
}

async function shot(page, name) {
  const file = join(RAW_OUT, `${name}.png`);
  await page.screenshot({ path: file });
  console.log(`  ✓ raw/${name}.png`);
  return file;
}

// Click a button/element whose visible text matches `text` (exact-ish).
async function clickText(page, text, opts = {}) {
  const el = page.getByText(text, { exact: opts.exact ?? false }).first();
  await el.waitFor({ state: 'visible', timeout: opts.timeout ?? 8000 });
  await el.click();
}

async function run() {
  const browser = await chromium.launch({ args: ['--force-color-profile=srgb'] });
  const results = [];

  // ── 1. live-home: Transkripsjon tab, welcome empty state ──────────────────
  {
    const { context, page } = await newPage(browser);
    try {
      await goto(page, '/');
      // Ensure the Transkripsjon tab is active (default) and welcome text shows.
      await page.getByText('Velkommen til Referat!', { exact: false })
        .first().waitFor({ state: 'visible', timeout: 8000 });
      await sleep(400);
      results.push(await shot(page, '01-live-home'));
    } catch (e) { console.error('  ✗ 01-live-home', e.message); }
    await context.close();
  }

  // ── 2. live-notater: Notater tab with rough bullets typed ─────────────────
  {
    const { context, page } = await newPage(browser);
    try {
      await goto(page, '/');
      // Switch to the Notater tab (segmented toggle button).
      await page.getByRole('button', { name: 'Notater', exact: true }).click();
      await sleep(400);
      const ta = page.locator('textarea').first();
      await ta.waitFor({ state: 'visible', timeout: 8000 });
      await ta.click();
      await ta.fill(
        'Agenda:\n- Status onboarding ny kunde\n- Blokkeringer?\n- Prioriteringer neste uke\n\nStikkord:\n- venter på tilganger til analyseverktøy\n- dashboard + månedsrapport\n- faglig dag før sommeren (modellevaluering)'
      );
      await page.mouse.move(40, 40);
      await sleep(500);
      results.push(await shot(page, '02-live-notater'));
    } catch (e) { console.error('  ✗ 02-live-notater', e.message); }
    await context.close();
  }

  // ── 3. moteliste: sidebar expanded with the 3 demo meetings ───────────────
  {
    const { context, page } = await newPage(browser);
    try {
      await goto(page, '/');
      // Expand the sidebar via the floating circular chevron toggle
      // (absolute -right-6 top-20 in Sidebar/index.tsx; no aria-label).
      const toggle = page.locator('button[class*="-right-6"]').first();
      await toggle.waitFor({ state: 'visible', timeout: 8000 });
      await toggle.click();
      await sleep(600);
      // Meeting titles populate from api_get_meetings once serverAddress is set.
      await page.getByText('Kundemøte – Nordvik Eiendom', { exact: false })
        .first().waitFor({ state: 'visible', timeout: 8000 });
      await sleep(500);
      results.push(await shot(page, '03-moteliste'));
    } catch (e) { console.error('  ✗ 03-moteliste', e.message); }
    await context.close();
  }

  // ── 4. detalj-transkripsjon: Nordvik, Transkripsjon tab ───────────────────
  {
    const { context, page } = await newPage(browser);
    try {
      await goto(page, '/meeting-details?id=demo-nordvik');
      await page.getByText('God morgen, Marius', { exact: false })
        .first().waitFor({ state: 'visible', timeout: 10000 });
      await sleep(500);
      results.push(await shot(page, '04-detalj-transkripsjon'));
    } catch (e) { console.error('  ✗ 04-detalj-transkripsjon', e.message); }
    await context.close();
  }

  // ── 5. detalj-notater: same meeting, Mine notater tab ─────────────────────
  {
    const { context, page } = await newPage(browser);
    try {
      await goto(page, '/meeting-details?id=demo-nordvik');
      await page.getByRole('button', { name: 'Mine notater', exact: true }).click();
      await sleep(900); // BlockNote parse + render
      await page.getByText('personvern', { exact: false })
        .first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
      await sleep(400);
      results.push(await shot(page, '05-detalj-notater'));
    } catch (e) { console.error('  ✗ 05-detalj-notater', e.message); }
    await context.close();
  }

  // ── 6. detalj-sammendrag: polished Møtereferat rendered ───────────────────
  {
    const { context, page } = await newPage(browser);
    try {
      await goto(page, '/meeting-details?id=demo-nordvik');
      // Summary panel is on the right; wait for the rendered markdown heading.
      await page.getByText('Møtereferat – Kundemøte Nordvik Eiendom', { exact: false })
        .first().waitFor({ state: 'visible', timeout: 10000 });
      await sleep(700);
      // Scroll the summary panel's own scroll container down so the polished
      // «Oppgaver» table and «Neste steg» section are visible (distinct from
      // the transcript shot which shows the top of the referat).
      await page.evaluate(() => {
        const heading = Array.from(document.querySelectorAll('*'))
          .find((el) => el.textContent && el.textContent.trim().startsWith('Møtereferat – Kundemøte'));
        let node = heading;
        while (node && node !== document.body) {
          const oy = getComputedStyle(node).overflowY;
          if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 20) {
            node.scrollTop = Math.min(node.scrollTop + 360, node.scrollHeight);
            return;
          }
          node = node.parentElement;
        }
      });
      await sleep(700);
      results.push(await shot(page, '06-detalj-sammendrag'));
    } catch (e) { console.error('  ✗ 06-detalj-sammendrag', e.message); }
    await context.close();
  }

  // ── 7. malvelger: template picker dropdown open ───────────────────────────
  {
    const { context, page } = await newPage(browser);
    try {
      await goto(page, '/meeting-details?id=demo-nordvik');
      await page.getByText('Møtereferat – Kundemøte Nordvik Eiendom', { exact: false })
        .first().waitFor({ state: 'visible', timeout: 10000 });
      await sleep(500);
      // Open the «Mal» dropdown (FileText icon button labelled "Mal").
      const malBtn = page.getByRole('button', { name: 'Mal' }).first();
      await malBtn.waitFor({ state: 'visible', timeout: 8000 });
      await malBtn.click();
      await sleep(500);
      await page.getByText('Lag din egen mal', { exact: false })
        .first().waitFor({ state: 'visible', timeout: 8000 });
      await sleep(300);
      results.push(await shot(page, '07-malvelger'));
    } catch (e) { console.error('  ✗ 07-malvelger', e.message); }
    await context.close();
  }

  // ── 8. innstillinger-transkripsjon: NB-Whisper model picker ───────────────
  {
    const { context, page } = await newPage(browser);
    try {
      await goto(page, '/settings');
      await page.getByRole('tab', { name: 'Transkripsjon' }).click();
      await sleep(900);
      await page.getByText('NB-Whisper', { exact: false })
        .first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
      await sleep(400);
      results.push(await shot(page, '08-innstillinger-transkripsjon'));
    } catch (e) { console.error('  ✗ 08-innstillinger-transkripsjon', e.message); }
    await context.close();
  }

  // ── 9. innstillinger-sammendrag: AI provider list incl. egen API-nøkkel ───
  {
    const { context, page } = await newPage(browser);
    try {
      await goto(page, '/settings');
      await page.getByRole('tab', { name: 'Sammendrag' }).click();
      await sleep(900);
      // Scroll the model-config section into view, then open the provider
      // dropdown so the full list (incl. «egen API-nøkkel» options) shows.
      const heading = page.getByText('Konfigurer sammendragsmodell', { exact: false }).first();
      await heading.waitFor({ state: 'visible', timeout: 8000 });
      const trigger = page.getByText('Sammendragsmodell', { exact: true }).first();
      await trigger.scrollIntoViewIfNeeded().catch(() => {});
      await sleep(400);
      // The provider Select trigger sits right under the «Sammendragsmodell» label.
      const providerSelect = page.locator('button[role="combobox"]').first();
      await providerSelect.scrollIntoViewIfNeeded().catch(() => {});
      await sleep(300);
      await providerSelect.click();
      await sleep(600);
      await page.getByText('Claude (egen API-nøkkel)', { exact: false })
        .first().waitFor({ state: 'visible', timeout: 6000 });
      await sleep(300);
      results.push(await shot(page, '09-innstillinger-sammendrag'));
    } catch (e) { console.error('  ✗ 09-innstillinger-sammendrag', e.message); }
    await context.close();
  }

  // ── 10. om-referat: About dialog with navy «Snakk med Agentik» CTA ────────
  // Use a taller viewport so the whole About dialog (incl. the navy CTA card) fits.
  {
    const { context, page } = await newPage(browser, { width: 1100, height: 980 });
    try {
      await goto(page, '/');
      // The «Om» button lives in the collapsed sidebar (Info icon, title "Om Referat").
      const omBtn = page.locator('button[title="Om Referat"]').first();
      await omBtn.waitFor({ state: 'visible', timeout: 8000 });
      await omBtn.click();
      await sleep(700);
      const cta = page.getByText('Snakk med Agentik', { exact: false }).first();
      await cta.waitFor({ state: 'visible', timeout: 8000 });
      await cta.scrollIntoViewIfNeeded().catch(() => {});
      await sleep(500);
      results.push(await shot(page, '10-om-referat'));
    } catch (e) { console.error('  ✗ 10-om-referat', e.message); }
    await context.close();
  }

  // ── BONUS A. onboarding-velkommen (best effort) ───────────────────────────
  {
    const { context, page } = await newPage(browser);
    try {
      // Force the onboarding wizard by making get_onboarding_status report
      // "no saved status" (null). Layout reads status?.completed ?? false →
      // false → shows onboarding; OnboardingContext takes the fresh-init path
      // and keeps currentStep = 1 (WelcomeStep). Returning {completed:false}
      // instead would hit verifyModelStatus (missing model_status → crash).
      await context.addInitScript(() => {
        const orig = window.__TAURI_INTERNALS__.invoke;
        window.__TAURI_INTERNALS__.invoke = (cmd, args, opts) => {
          if (cmd === 'get_onboarding_status') return Promise.resolve(null);
          if (cmd === 'check_first_launch') return Promise.resolve(true);
          return orig(cmd, args, opts);
        };
      });
      await goto(page, '/');
      await page.getByText('Velkommen til Referat', { exact: false })
        .first().waitFor({ state: 'visible', timeout: 8000 });
      await sleep(500);
      results.push(await shot(page, '11-onboarding-velkommen'));
    } catch (e) { console.error('  ✗ 11-onboarding-velkommen', e.message); }
    await context.close();
  }

  // ── BONUS B. claude-kobling card (General settings tab) ───────────────────
  {
    const { context, page } = await newPage(browser);
    try {
      await goto(page, '/settings');
      await page.getByRole('tab', { name: 'Generelt' }).click();
      await sleep(900);
      const claude = page.getByText('Koble til Claude', { exact: false }).first();
      if (await claude.count()) {
        await claude.scrollIntoViewIfNeeded().catch(() => {});
        await sleep(400);
        results.push(await shot(page, '12-claude-kobling'));
      } else {
        console.log('  – 12-claude-kobling: card not present on General tab, skipping');
      }
    } catch (e) { console.error('  ✗ 12-claude-kobling', e.message); }
    await context.close();
  }

  await browser.close();
  console.log(`\nCaptured ${results.length} raw screenshots into ${RAW_OUT}`);
}

run().catch((e) => { console.error(e); process.exit(1); });

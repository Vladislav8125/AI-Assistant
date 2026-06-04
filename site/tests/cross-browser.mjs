import { chromium, firefox, webkit, devices } from 'playwright';

const BASE = process.env.SITE_URL || 'https://vladislav8125.github.io/AI-Assistant';

const viewports = [
  { name: 'desktop-chrome', browser: 'chromium', viewport: { width: 1280, height: 800 } },
  { name: 'desktop-firefox', browser: 'firefox', viewport: { width: 1280, height: 800 } },
  { name: 'desktop-safari', browser: 'webkit', viewport: { width: 1280, height: 800 } },
  { name: 'mobile-iphone', browser: 'chromium', device: devices['iPhone 13'] },
  { name: 'mobile-android', browser: 'chromium', device: devices['Pixel 5'] },
];

const pages = [
  { path: '/', checks: ['header-bar', 'modal-church', 'data-modal-open'] },
  { path: '/donate/', checks: ['pay-page', 'donate-qr.png'] },
  { path: '/news/', checks: ['news-list', 'Фестиваль'] },
  { path: '/initiatives/', checks: ['modal-pilgrimage'] },
];

const errors = [];

function getBrowser(name) {
  if (name === 'firefox') return firefox;
  if (name === 'webkit') return webkit;
  return chromium;
}

async function runScenario(scenario) {
  const browserType = getBrowser(scenario.browser);
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext(
    scenario.device
      ? { ...scenario.device }
      : { viewport: scenario.viewport }
  );
  const page = await context.newPage();

  for (const { path, checks } of pages) {
    const url = BASE + path;
    try {
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      if (!response || response.status() !== 200) {
        errors.push(`${scenario.name} ${path}: HTTP ${response?.status()}`);
        continue;
      }
      const html = await page.content();
      for (const token of checks) {
        if (!html.includes(token)) {
          errors.push(`${scenario.name} ${path}: missing "${token}"`);
        }
      }
    } catch (e) {
      errors.push(`${scenario.name} ${path}: ${e.message}`);
    }
  }

  // Home: modal open/close (desktop + mobile)
  try {
    await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
    const churchBtn = page.locator('[data-modal-open="modal-church"]').first();
    await churchBtn.click({ timeout: 5000 });
    await page.waitForSelector('#modal-church.is-open', { timeout: 5000 });
    const iframe = page.locator('#modal-church iframe');
    if ((await iframe.count()) === 0) {
      errors.push(`${scenario.name} modal-church: no video iframe`);
    }
    await page.locator('#modal-church [data-modal-close]').click();
    await page.waitForFunction(() => !document.getElementById('modal-church')?.classList.contains('is-open'), {
      timeout: 5000,
    });
  } catch (e) {
    errors.push(`${scenario.name} modal interaction: ${e.message}`);
  }

  // Mobile menu toggle
  if (scenario.name.startsWith('mobile')) {
    try {
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      const nav = page.locator('#nav');
      const toggle = page.locator('.mobile-menu-toggle').first();
      await toggle.click();
      const open = await nav.evaluate((el) => el.classList.contains('open'));
      if (!open) errors.push(`${scenario.name}: mobile nav did not open`);
    } catch (e) {
      errors.push(`${scenario.name} mobile menu: ${e.message}`);
    }
  }

  await browser.close();
}

console.log('Testing', BASE);
for (const scenario of viewports) {
  process.stdout.write(`  ${scenario.name}... `);
  await runScenario(scenario);
  console.log('done');
}

if (errors.length) {
  console.error('\nFAILED (' + errors.length + '):');
  errors.forEach((e) => console.error('  -', e));
  process.exit(1);
}
console.log('\nAll checks passed across browsers and mobile viewports.');

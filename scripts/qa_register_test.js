const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = path.resolve(__dirname, 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const logs = [];
  const network = [];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => logs.push({ type: 'console', text: msg.text(), location: msg.location() }));
  page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.message }));
  page.on('response', resp => network.push({ url: resp.url(), status: resp.status(), ok: resp.ok() }));
  page.on('requestfailed', req => network.push({ url: req.url(), failureText: req.failure().errorText }));

  const target = process.argv[2] || 'http://localhost:8082/register';
  console.log('Attempting direct visit to', target);
  try {
    await page.goto(target, { waitUntil: 'networkidle', timeout: 5000 });
  } catch (e) {
    console.log('Direct navigation failed, loading root and attempting in-app navigation');
    const root = (new URL(target)).origin + '/';
    await page.goto(root, { waitUntil: 'networkidle' });
    // Try to find a link/button to registration and click it
    const link = await page.$('a[href$="/register"], a:has-text("ثبت‌نام"), button:has-text("ثبت‌نام")');
    if (link) {
      await link.click();
      await page.waitForTimeout(1000);
    } else {
      // Fallback: push history state
      await page.evaluate(() => {
        try { window.history.pushState({}, '', '/register'); window.dispatchEvent(new PopStateEvent('popstate')); } catch(e){}
      });
      await page.waitForTimeout(1000);
    }
  }
  await page.screenshot({ path: path.join(outDir, '01-page.png'), fullPage: true });

  // Try to find MA round select and open it
  try {
    // Fill common fields
    const fillIfExists = async (selector, value) => {
      if (await page.$(selector)) {
        await page.fill(selector, value);
      }
    };

    await fillIfExists('input[name="national_id"]', '0012345678');
    await fillIfExists('input[name="first_name"]', 'Test');
    await fillIfExists('input[name="last_name"]', 'User');
    await fillIfExists('input[name="mobile"]', '09120000000');
    await fillIfExists('input[name="email"]', 'test.user@example.com');

    // Try to interact with selects (Radix/UI) by clicking on visible elements
    const selectToggle = await page.$('button[aria-haspopup="listbox"], [data-testid="select-toggle"]');
    if (selectToggle) {
      await selectToggle.click();
      await page.screenshot({ path: path.join(outDir, '02-select-open.png') });
      // pick first option
      const firstOption = await page.$('div[role="option"], li[role="option"]');
      if (firstOption) {
        await firstOption.click();
      }
    }

    await page.screenshot({ path: path.join(outDir, '03-filled.png') });

    // Submit the form if a submit button exists
    const submitBtn = await page.$('button[type="submit"], button:has-text("ثبت"), button:has-text("ثبت‌نام")');
    if (submitBtn) {
      await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/api/auth/register') && resp.status() < 600, { timeout: 10000 }).catch(e => ({ error: String(e) })),
        submitBtn.click()
      ]);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(outDir, '04-after-submit.png'), fullPage: true });
    } else {
      logs.push({ type: 'info', text: 'No submit button found' });
    }
  } catch (e) {
    logs.push({ type: 'script-error', text: e.message });
    await page.screenshot({ path: path.join(outDir, 'error.png'), fullPage: true });
  }

  await context.close();
  await browser.close();

  fs.writeFileSync(path.join(outDir, 'logs.json'), JSON.stringify({ logs, network }, null, 2));
  console.log('Saved screenshots and logs to', outDir);
})();

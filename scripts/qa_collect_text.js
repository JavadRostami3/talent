const { chromium } = require('playwright');
(async () => {
  const url = process.argv[2] || 'http://localhost:8082/register';
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => { try { window.history.pushState({}, '', '/register'); window.dispatchEvent(new PopStateEvent('popstate')); } catch(e){} });
  await page.waitForTimeout(1000);
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('BODY_TEXT_SNIPPET:\n', bodyText.slice(0,2000));
  // search for Persian error keywords
  const keywords = ['خطا','اتصال','موفق','ثبت‌نام','404','500','خطای'];
  const found = {};
  for (const k of keywords) {
    found[k] = bodyText.includes(k);
  }
  console.log('KEYWORDS:', found);
  await browser.close();
})();

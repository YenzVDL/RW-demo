import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('home, mobile navigation, real content and accessibility',async({page},testInfo)=>{
  await page.goto('/');
  await expect(page.getByRole('heading',{level:1})).toContainText('Juridisch advies.');
  await expect(page.getByText('Staging',{exact:true})).toBeVisible();
  expect(await page.locator('html').getAttribute('lang')).toBe('nl');
  expect(await page.locator('body').evaluate(el=>el.scrollWidth<=window.innerWidth)).toBe(true);
  const toggle=page.getByRole('button',{name:'Menu'});
  if(await toggle.isVisible())await toggle.click();
  await page.getByRole('navigation',{name:'Hoofdnavigatie'}).getByRole('link',{name:'Juridische hulp',exact:true}).click();
  await expect(page).toHaveURL(/juridische-hulp$/);
  await page.getByRole('link',{name:/Huurrecht/}).click();
  await expect(page).toHaveURL(/\/juridische-hulp\/huurrecht$/);
  await page.getByRole('link',{name:/Wanneer heeft de verhuurder/}).click();
  await expect(page).toHaveURL(/opzegging-door-verhuurder$/);
  await expect(page.getByText('Bestaande juridische tekst — nog te controleren.')).toBeVisible();
  await page.goto('/');
  const violations=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations;
  expect(violations).toEqual([]);
  for(const logo of await page.locator('.partner-logos img').all()){await logo.scrollIntoViewIfNeeded();await expect(logo).toHaveJSProperty('complete',true);}
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:`test-results/home-${testInfo.project.name}.png`,fullPage:true});
});
test('missing media retain context without invented imagery',async({page})=>{
  await page.route('**/wp-content/uploads/**',route=>route.abort());
  await page.goto('/over-ons/partners');
  await page.locator('.partner-grid').scrollIntoViewIfNeeded();
  await expect(page.locator('.partner-grid .media-fallback').first()).toBeVisible();
});
test('contact, language pairs, missing translation and documents',async({page,request},testInfo)=>{
  await page.goto('/spreekuur-en-contact');
  await expect(page.getByRole('heading',{name:'Telefonisch advies'})).toBeVisible();
  expect(await page.locator('a[href="tel:0206731311"]').count()).toBeGreaterThan(0);
  await page.getByRole('link',{name:'English',exact:true}).click();
  await expect(page).toHaveURL(/\/en\/contact$/);
  expect(await page.locator('html').getAttribute('lang')).toBe('en');
  await page.goto('/juridische-hulp/huurrecht');
  await page.getByRole('link',{name:'English',exact:true}).click();
  await expect(page.getByRole('heading',{level:1})).toHaveText('This translation is not available.');
  await page.goto('/over-ons/verantwoording');
  const pdf=page.locator('a[href$=".pdf"]').first();
  const url=await pdf.getAttribute('href');const response=await request.get(url!);
  expect(response.ok()).toBe(true);expect((await response.body()).subarray(0,4).toString()).toBe('%PDF');
  await page.screenshot({path:`test-results/documents-${testInfo.project.name}.png`,fullPage:true});
  expect(await page.locator('body').evaluate(el=>el.scrollWidth<=window.innerWidth)).toBe(true);
});
test('security boundaries, robots and redirects',async({request,page})=>{
  expect((await request.get('/api/preview?id=1&ts=1&sig=bad')).status()).toBe(401);
  expect((await request.post('/api/revalidate',{data:{}})).status()).toBe(401);
  const home=await request.get('/');expect(home.headers()['x-robots-tag']).toContain('noindex');
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
  expect((await request.get('/de-medewerkers',{maxRedirects:0})).status()).toBe(308);
  expect((await request.get('/sample-page')).status()).toBe(410);
  await page.goto('/#vgv');await expect(page).toHaveURL(/\/juridische-hulp$/);
});

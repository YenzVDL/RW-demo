import {test,expect} from '@playwright/test';
import {randomBytes} from 'node:crypto';
test('native WordPress editor exposes Dutch fields and a signed preview',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop','CMS desktop control');
  process.loadEnvFile('.env.local');process.loadEnvFile('.env');
  const auth='Basic '+Buffer.from(process.env.WORDPRESS_USER+':'+process.env.WORDPRESS_APP_PASSWORD).toString('base64');
  const response=await fetch('http://localhost:8080/wp-json/wp/v2/rwa_contact?context=edit',{headers:{Authorization:auth}});
  const records=await response.json();const record=records.find((p:{meta:{rwa_key:string}})=>p.meta.rwa_key==='contact');
  await page.goto('http://localhost:8080/wp-login.php');
  await page.locator('#user_login').fill(process.env.WP_ADMIN_USER!);
  await page.locator('#user_pass').fill(process.env.WP_ADMIN_PASSWORD!);
  await page.locator('#wp-submit').click();
  await page.goto(`http://localhost:8080/wp-admin/post.php?post=${record.id}&action=edit`);
  const welcome=page.getByRole('dialog');
  if(await welcome.count())await welcome.getByRole('button',{name:/^(Close|Sluiten)$/}).click();
  if(!await page.locator('#rwa-details-title').isVisible())await page.getByRole('button',{name:/^(Meta vakken|Meta Boxes)$/}).click();
  await expect(page.getByRole('heading',{name:'Inhoud, bron en controle',exact:true})).toBeVisible();
  await expect(page.locator('#rwa_phone')).toHaveValue('020 673 13 11');
  await expect(page.getByRole('link',{name:'Beveiligde conceptpreview'})).toHaveAttribute('href',/api\/preview\?id=\d+&ts=\d+&sig=/);
  await page.locator('#rwa_phone').scrollIntoViewIfNeeded();
  await page.screenshot({path:'test-results/cms-editor-desktop.png'});
});
test('temporary notices appear and expire without publication',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop','One clock-bound integration check');
  process.loadEnvFile('.env.local');
  const auth='Basic '+Buffer.from(process.env.WORDPRESS_USER+':'+process.env.WORDPRESS_APP_PASSWORD).toString('base64');
  const now=new Date();const key='clock-check-'+randomBytes(4).toString('hex');
  const result=await fetch('http://localhost:8080/wp-json/rwa/v1/import',{method:'POST',headers:{'Content-Type':'application/json',Authorization:auth},body:JSON.stringify({key,kind:'notice',title:'Controlebericht',html:'<p>Tijdcontrole.</p>',publicationStatus:'publish',editorialStatus:'needs_confirmation',language:'nl',startsAt:new Date(now.getTime()+10000).toISOString(),endsAt:new Date(now.getTime()+20000).toISOString(),importHash:key,sourceUrl:'https://rechtswinkelamsterdam.nl/',fetchedAt:now.toISOString()})});
  const record=await result.json();
  try{
    await page.clock.install({time:now});
    await page.goto('/');
    await expect(page.getByRole('region',{name:'Actuele meldingen'})).toHaveCount(0);
    await page.clock.fastForward(11000);
    await expect(page.getByText('Controlebericht',{exact:true})).toBeVisible();
    await page.clock.fastForward(11000);
    await expect(page.getByText('Controlebericht',{exact:true})).toHaveCount(0);
  }finally{await fetch(`http://localhost:8080/wp-json/wp/v2/rwa_notice/${record.id}`,{method:'DELETE',headers:{Authorization:auth}});}
});

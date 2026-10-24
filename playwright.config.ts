import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',fullyParallel:false,workers:1,
  use:{baseURL:'http://127.0.0.1:3000',trace:'retain-on-failure'},
  projects:[{name:'desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:1000}}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}},{name:'tablet',testMatch:'**/site.spec.ts',use:{...devices['iPad Mini'],defaultBrowserType:'chromium'}}],
  reporter:[['list']],
});

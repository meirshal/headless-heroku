require('dotenv').config();
import puppeteer from 'puppeteer';
import express from 'express';
import moment from 'moment';
import { URL } from 'url';

const app = express();

export const PORT = parseInt(process.env.PORT) || 8080;

(async () => {
  console.log('launching Puppeteer...');
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context: any = {
    browser,
    page: await browser.newPage(),
    url: null,
  };

  await context.page.setDefaultNavigationTimeout(0);

  app.get('/visit', async (req, res) => {
    if (context.page) {
      await context.page.close();
      context.page = await context.browser.newPage();
    }
    const { query } = req;
    const url = new URL(query!.url.toString());
    console.log('visiting page:', url);
    context.url = url;

    const browserContext = browser.defaultBrowserContext();
    browserContext.clearPermissionOverrides();
    browserContext.overridePermissions(url.origin, ['camera', 'microphone']);

    await context.page.goto(url.href, { waitUntil: 'domcontentloaded' });
    res.send(`page loaded: ${url}`);
  });

  app.get('/screenshot', async (req, res, next) => {
    console.log(await context.page.content());
    const filePath = `${moment().format('YYYYMMDDhhmm')}.jpeg`;
    context.page
      .screenshot({ path: filePath })
      .then((fileStream) => {
        console.log('screenshot taken');
        res.write(fileStream);
      })
      .catch((error) => {
        next(error);
      });
  });

  app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`);
  });
})();

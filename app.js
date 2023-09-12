// app.js
const express = require('express');
const app = express();
const puppeteer = require("puppeteer-core");
const chrome = require("chrome-aws-lambda");

const exePath =
  process.platform === "win32"
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : process.platform === "linux"
    ? "/usr/bin/google-chrome"
    : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function getOptions(isDev) {
  let options;
  if (isDev) {
    options = {
      args: [],
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
      headless: false,
    };
  } else {
    options = {
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless,
    };
  }
  return options;
}
 
app.get('/', async (req, res) => {
  const isDev = false;
  let query = req.query;
  const { hotelid, checkin, checkout } = query;

  try {
      const options = await getOptions(isDev);
      const browser = await puppeteer.launch(options);
      const page = await browser.newPage();
  
      await page.goto(
        `https://hotelscan.com/combiner/${hotelid}?pos=zz&locale=en&checkin=${checkin}&checkout=${checkout}&rooms=2&mobile=0&loop=1&country=MV&ef=1&geoid=xmmmamtksdxx&toas=resort&availability=1&deviceNetwork=4g&deviceCpu=20&deviceMemory=8&limit=25&offset=0`,
        {
          waitUntil: "networkidle0",
        }
      );
      // let html = await page.evaluate(() => {
      //   return JSON.parse(document.querySelector("body").innerText);
      // });
      let body = await page.waitForSelector('body');
      let json = await body?.evaluate(el => el.textContent);
      await browser.close();
      res.status(200).json(json);
    } catch (error) {
      console.log(error);
      res.statusCode = 500;
      res.json({
        body: "Sorry, Something went wrong!",
      });
    }
    
  });

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is listening on port ${PORT}.`));

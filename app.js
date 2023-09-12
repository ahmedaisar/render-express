// app.js
const express = require('express');
const app = express();
const puppeteer = require("puppeteer-core");
const chrome = require("chrome-aws-lambda");
 
app.get('/', async (req, res) => { res.send({
  body: "Hello!",
});  })

app.get('/hotel', async (req, res) => {
  let query = req.query;
  const { hotelid, checkin, checkout } = query;

  try {
      const options = {
        args: [...chrome.args, '--hide-scrollbars', '--disable-web-security'],
        executablePath: await chrome.executablePath,
        headless: true,
      };
      const browser = await chrome.puppeteer.launch(options);
      const page = await browser.newPage();
  
      await page.goto(
        `https://hotelscan.com/combiner/${hotelid}?pos=zz&locale=en&checkin=${checkin}&checkout=${checkout}&rooms=2&mobile=0&loop=1&country=MV&ef=1&geoid=xmmmamtksdxx&toas=resort&availability=1&deviceNetwork=4g&deviceCpu=20&deviceMemory=8&limit=25&offset=0`,
        {
          waitUntil: "networkidle2",
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
      await browser.close();   
      res.statusCode = 500;
      res.json({
        body: "Sorry, Something went wrong!",
      });
    }
    
  });

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is listening on port ${PORT}.`));

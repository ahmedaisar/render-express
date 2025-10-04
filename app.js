// app.js
process.setMaxListeners(0)
const cors = require('cors')
const fs = require('fs')
const express = require('express');
const app = express();
const chrome = require("chrome-aws-lambda");
const path = require("path")
const NodeCache = require('node-cache');
// const compression = require('compression');
// app.use(compression()); 
// app.use(express.json());
app.use(cors())
const cache = new NodeCache(); 

app.get('/', async (req, res) => { res.send({
  body: "Hello!",
});  })

//Anextour api routes
app.get('/hotels', async (req, res) => { 
  const cacheKey = 'anex';
  let cachedData = cache.get(cacheKey);
  const api = "https://api.anextour.com/search/Hotels?SEARCH_MODE=b2c&SEARCH_TYPE=PACKET_ONLY_HOTELS&lang=&state=maldives&townFrom=1"

  try {
    const options = {
      args: [...chrome.args, '--hide-scrollbars', '--disable-web-security'],
      executablePath: await chrome.executablePath,
      headless: "new",
    };
    const browser = await chrome.puppeteer.launch(options);
    const page = await browser.newPage();

    await page.goto(
      api,
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
    if (!cachedData) {
      cache.set(cacheKey, json);
      cachedData = json;    
     }
    res.status(200).json(cachedData);       
  } catch (error) {
    console.log(error);
    await browser.close();   
    res.statusCode = 500;
    res.json({
      body: "Sorry, Something went wrong!",
    });
  }


})

app.get('/hotel', async (req, res) => { 
  let query = req.query;
  const { hotel } = query;

  const api = `https://api.anextour.com/b2c/Hotel?hotel=${hotel}&lang=eng`

  try {
    const options = {
      args: [...chrome.args, '--hide-scrollbars', '--disable-web-security'],
      executablePath: await chrome.executablePath,
      headless: "new",
    };
    const browser = await chrome.puppeteer.launch(options);
    const page = await browser.newPage();

    await page.goto(
      api,
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
    await browser.close();   
    res.statusCode = 500;
    res.json({
      body: "Sorry, Something went wrong!",
    });
  }


})

//Hotelscan api routes
app.get('/scan', async (req, res) => {
  let query = req.query;
  const { hotelid, checkin, checkout } = query;
  // const cacheKey = hotelid;
  // let cachedData = cache.get(cacheKey);

  try {
      const options = {
        args: [...chrome.args, '--hide-scrollbars', '--disable-web-security'],
        executablePath: await chrome.executablePath,
        headless: "new",
      };
      const browser = await chrome.puppeteer.launch(options);
      const page = await browser.newPage();
  
      await page.goto(
        `https://hotelscan.com/combiner/${hotelid}?pos=zz&locale=en&checkin=${checkin}&checkout=${checkout}&rooms=2&mobile=0&loop=1&country=MV&ef=1&geoid=xmmmamtksdxx&toas=resort&availability=1&deviceNetwork=4g&deviceCpu=20&deviceMemory=8&limit=25&offset=0`,
        {
          waitUntil: "networkidle2",
          timeout: 0
        }
      );
      await page.goto(
        `https://hotelscan.com/combiner/${hotelid}?pos=zz&locale=en&checkin=${checkin}&checkout=${checkout}&rooms=2&mobile=0&loop=1&country=MV&ef=1&geoid=xmmmamtksdxx&toas=resort&availability=1&deviceNetwork=4g&deviceCpu=20&deviceMemory=8&limit=25&offset=0`,
        {
          waitUntil: "networkidle2",
          timeout: 0
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

app.get("/hotel-detail", async (req, res) => {
  const { hotelid, checkin, checkout } = req.query;

  if (!hotelid || !checkin || !checkout) {
    return res.status(400).json({ error: "Missing hotelid, checkin, or checkout" });
  }

  try {
    const browser = await puppeteer.launch({ headless: "new", args: ["--disable-web-security"] });
    const page = await browser.newPage();

    // Optional: Set User-Agent if required
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
    );

    // Intercept XHR requests
    await page.setRequestInterception(true);
    let apiResponse;

    page.on("request", (request) => {
      request.continue();
    });

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("/s/tsx/api/search/products")) {
        try {
          apiResponse = await response.json();
        } catch (err) {
          console.error("Failed to parse JSON from XHR:", err);
        }
      }
    });

    // Navigate to the hotel detail page
    const url = `https://www.hotelscan.com/s/tsx/${hotelid}?pageType=hotelDetail&dateFrom=${checkin}&dateTo=${checkout}&adults=2&destination=MV`;
    await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });

    // Wait a few seconds to ensure the XHR fires
    await page.waitForTimeout(5000);

    await browser.close();

    if (!apiResponse) {
      return res.status(404).json({ error: "Products API response not found" });
    }

    res.status(200).json(apiResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong", details: err.message });
  }
});

app.get('/maldives', async (req, res) => {  
  // const cacheKey = 'maldives';
  // let cachedData = cache.get(cacheKey);
  const readFile = (path, opts = 'utf8') =>
    new Promise((resolve, reject) => {
      fs.readFile(path, opts, (err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
  })
  try {
    const jsonDirectory = path.join(process.cwd(), "json");
    const jsondata = await readFile(jsonDirectory + "/data.json");    
    // if (!cachedData) {
    //   cache.set(cacheKey, jsondata);
    //   cachedData = jsondata;    
    //  }
     res.status(200).json(jsondata);
  } catch (error) {
    console.log(error)
  }
  
  
})

app.post('/autocomplete', async (req, res) => {
  let query = req.query;
  const { hotel } = query;
  // const cacheKey = hotelid;
  // let cachedData = cache.get(cacheKey);

  try {
      const options = {
        args: [...chrome.args, '--hide-scrollbars', '--disable-web-security'],
        executablePath: await chrome.executablePath,
        headless: "new",
      };
      const browser = await chrome.puppeteer.launch(options);
      const page = await browser.newPage();
      await page.setRequestInterception(true);
 
      page.once('request', request => {
          var data = {
              'method': 'POST',
              'postData': `query=${hotel}&language=en-us&size=5&pageview_id=&aid=7974605`,
              'headers': {
                  ...request.headers(),
                  'Content-Type': 'application/x-www-form-urlencoded'
              },
          };
      
          request.continue(data);
          page.setRequestInterception(false);
      });
      const response = await page.goto('https://accommodations.booking.com/autocomplete.json');     
      const responseBody = await response.text();
      console.log(responseBody);
      await browser.close();   
      res.status(200).json(responseBody);           
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

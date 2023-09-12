// app.js
const express = require('express');
const app = express();
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

app.get('/', async (req, res) => {
  let browser = null;

  try {
    // Launch Chrome
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    // Create a new page
    let page = await browser.newPage();

    // Navigate to a website
    await page.goto('https://example.com');

    // Take a screenshot
    let screenshot = await page.screenshot({ encoding: 'binary' });

    // Send the screenshot as a response
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': screenshot.length,
    });
    res.end(screenshot, 'binary');
  } catch (error) {
    // Handle any errors
    console.error(error);
    res.status(500).send('Something went wrong');
  } finally {
    // Close the browser
    if (browser !== null) {
      await browser.close();
    }
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is listening on port ${PORT}.`));

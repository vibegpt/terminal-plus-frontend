// scrapeSYDAmenities.js
const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://www.sydneyairport.com.au/shop", {
    waitUntil: "networkidle2",
  });

  const amenities = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll(".tenant-details.details"));

    return items.map((el) => {
      const name = el.querySelector("h3")?.innerText?.trim();
      const type = "Shop";
      const terminal = "T1";
      const location = "After Security";
      const link = el.querySelector("a")?.href || "";
      const sub_category = el.querySelector(".listing-item__categories")?.innerText?.trim();
      const opening_hours = el.querySelector(".listing-item__opening-hours")?.innerText?.trim();
      return {
        name,
        type,
        terminal,
        location,
        sub_category,
        opening_hours,
        link,
        vibes: []
      };
    });
  });

  fs.writeFileSync("syd_amenities.json", JSON.stringify(amenities, null, 2));
  console.log(`✅ Scraped ${amenities.length} amenities.`);

  await browser.close();
})();
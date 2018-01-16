const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  let contractId = '0x86fa049857e0209aa7d9e616f7eb3b3b78ecfdb0'
  await page.goto('https://etherscan.io/token/generic-tokenholders2?a=0x86fa049857e0209aa7d9e616f7eb3b3b78ecfdb0&s=1E%2B27&p=1');
  await page.mainFrame().waitForSelector('#maintable')
  let data = await page.evaluate(() => {
    let trs = document.querySelectorAll('#maintable tr')
    let result = []
    for (var i = 1; i < trs.length; i++) {
        result.push({
          rank: trs[i].children[0].innerText,
          address: trs[i].children[1].innerText,
          percentage: trs[i].children[2].innerText,
        })
    }
    return result
  });
  console.log('data is ' + JSON.stringify(data))
  await browser.close();
})();
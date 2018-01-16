const puppeteer = require('puppeteer');
const getModel = require('./common/db').getModel;

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  let contractMap = {
    'EOS': '0x86fa049857e0209aa7d9e616f7eb3b3b78ecfdb0',
  }
  const Record = getModel('EOS')
  await page.goto('https://etherscan.io/token/generic-tokenholders2?a=0x86fa049857e0209aa7d9e616f7eb3b3b78ecfdb0&s=1E%2B27&p=1');
  await page.mainFrame().waitForSelector('#maintable')
  let data = await page.evaluate(() => {
    let trs = document.querySelectorAll('#maintable tr')
    let result = []
    for (var i = 1; i < trs.length; i++) {
      let temp = {
        rank: trs[i].children[0].innerText,
        address: trs[i].children[1].innerText,
        quantity: trs[i].children[2].innerText,
      }
      result.push(temp)
    }
    return result
  });
  await Record.sync()
  await Record.bulkCreate(data)
  await browser.close();
})();
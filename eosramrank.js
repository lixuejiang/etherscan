const puppeteer = require('puppeteer');
const getModel = require('./common/db').getModel;
const transporter = require('./common/sendmail')
const Sequelize = require('sequelize');
const moment = require('moment');
const request = require('request-promise')

const fetchPerData = async (pageNum) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const Record = getModel('EOSRAM')
  console.log('获取第' + pageNum + '页的数据')
  let url = 'https://eosmonitor.io/ram?page=' + pageNum
  await page.goto(url);
  await page.mainFrame().waitForSelector('table')
  let data = await page.evaluate(() => {
    let trs = document.querySelectorAll('table tr')
    let result = []
    for (var i = 1; i < trs.length; i++) {
      let quantityStr = trs[i].children[2].innerText
      let quantity = 0
      if (quantityStr.indexOf('GB') > -1) {
        quantity = quantityStr.split(' ')[0] * 1024
      } else {
        quantity = quantityStr.split(' ')[0]
      }
      let temp = {
        rank: trs[i].children[0].innerText,
        address: trs[i].children[1].innerText,
        quantity: quantity,
      }
      result.push(temp)
    }
    return result
  });
  let mailMsg = []
  let finalData = []
  let total = 0
  for (let i = 0; i < data.length; i++) {
    let item = data[i]
    const tempResult = await processData(Record, item)
    if (tempResult.mailMsg.length) {
      mailMsg.push('<span style="font-size: 20px">地址' + item.address + ',持仓:' + item.quantity + "</span>")
      mailMsg.push(tempResult.mailMsg.join('<br />'))
    }
    if (tempResult.needPush) {
      finalData.push(item)
    }
    total += Number(item.quantity)
  }
  await Record.sync()
  await Record.bulkCreate(finalData)
  console.log('fetch eos ram holder rank success')
  let html = ''
  await browser.close();
  if (mailMsg.length) {
    html = mailMsg.join('<br />')
    html = html + '<br />总占比：' + total / 10000000 + '%'
    html  = html + '<br />' + '<a href="'+ url +'"' + '>点我查看最新详情</a>'
  } else {
    console.log(moment(new Date()).format('YYYY年MM月DD日 HH:mm:ss') + '无持仓变化')
  }
  console.log(html)
  return html
}

function sendMail(html) {
  let mailOptions = {
      from: '642898959@qq.com', // sender address
      to: '642898959@qq.com, hardensky@foxmail.com, heway93@163.com,mpig@e17.org,137746731@qq.com,zhenyuelfli@126.com', // list of receivers
      subject: 'EOS RAM庄家持仓变化', // Subject line
      text: '你有1000个比特币到账，请查收', // plain text body
      html:  html// html body
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);
      // Preview only available when sending through an Ethereal account
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
}
async function processData(model, record) {
  let result = true;
  let mailMsg = []
  let i = 0;
  let maxLength = 2;
  let length = 0;
  // 获取上一次的记录
  const recodrs = await model.findAll({
    where: {
      address: record.address
    },
    order: [Sequelize.literal('recordDate DESC')]
  })
  if(recodrs.length === 0 ) {
    return {
      needPush: true,
      mailMsg: ['新增持仓：<br />地址：' + record.address + ',持仓：' + record.quantity +', 排名：' + record.rank + '</br>']
    }
  }
  // 判断数据是否相等，相等则返回false
  if (recodrs[0].quantity == record.quantity) {
    result = false
  }
  length = Math.min(maxLength, recodrs.length)
  // 看看排名是否有变化，有变化则发邮件
  for(i = 0; i < length; i++) {
    let msg = ['<span style="margin-left:10px">时间: ' + moment(recodrs[i].recordDate).format('YYYY年MM月DD日 HH:mm:ss') + '</span>']
    let flag = false
    let quantityDeta = (record.quantity - recodrs[i].quantity) / recodrs[i].quantity
    let color = 'green'
    if (Math.abs(quantityDeta) > 0.05) {
      if (quantityDeta < 0) {
        color = 'red'
      }
      msg.push('<span style="margin-left:20px">排名：'+ record.rank +', 持仓:' + recodrs[i].quantity + ', 变化：<span style="color:' +  color + '">' + quantityDeta * 100 + '%</span></span>')
      flag = true
    }
    if (flag) {
      mailMsg.push(msg.join(' ,'))
    }
  }
  return {
    needPush: result,
    mailMsg: mailMsg
  }
}

async function fetchAllData() {
  let mailMsg = []
  let price = await getEOSRamPrice()
  for (let i = 1; i < 3; i++) {
    let html = await fetchPerData(i)
    if (html.length) {
      html = '<span style="font-size: 25px, color: "red"">第' + i + '页:<span><br />' + html
    }
    mailMsg.push(html)
  }
  if (mailMsg.length) {
    mailMsg.unshift('<span style="font-size: 25px, color: "red"">当前价格：' + price + 'EOS/kb<span><br />')
    sendMail(mailMsg.join('<br />======================我是分割线=================<br />'))
  }
}
async function getEOSRamPrice(params) {
  let price = 0.00000
  let data = await request('https://tbeospre.mytokenpocket.vip/v1/ram_price')
  data = JSON.parse(data)
  if (data.result === 0) {
    price = parseFloat(1 * 1024 / data.data).toFixed(5)
  }
  console.log('price is', price)
  return price
}

fetchAllData()
setInterval(() => {
  fetchAllData()
}, 10*60*1000)

const puppeteer = require('puppeteer');
const getModel = require('./common/db').getModel;
const transporter = require('./common/sendmail')
const Sequelize = require('sequelize');
const moment = require('moment');

const fetchEthscanData = async (name, address) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const Record = getModel(name)
  console.log(name, address)
  let url  = 'https://etherscan.io/token/generic-tokenholders2?a='+ address +'&s=1E%2B27&p=1'
  await page.goto(url);
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
  console.log('fetchEthscanData success')
  let html = ''
  await browser.close();
  if (mailMsg.length) {
    html = mailMsg.join('<br />')
    html = html + '<br />总占比：' + total / 10000000 + '%'
    html  = html + '<br />' + '<a href="'+ url +'"' + '>点我查看最新详情</a>'
  } else {
    console.log(moment(new Date()).format('YYYY年MM月DD日 HH:mm:ss') + '无持仓变化')
  }
  return html
}

function sendMail(html) {
  let mailOptions = {
      from: '642898959@qq.com', // sender address
      to: '642898959@qq.com, hardensky@foxmail.com,779272334@qq.com', // list of receivers
      subject: 'EOS庄家持仓变化', // Subject line
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
  let maxLength = 10;
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

async function fetchAllEthscanData() {
  let contractMap = [
    {name: 'EOS', address: '0x86fa049857e0209aa7d9e616f7eb3b3b78ecfdb0'},
    {name: 'BNB', address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52'},
    {name: 'TNB', address: '0xf7920b0768ecb20a123fac32311d07d193381d6f'},
    {name: 'PRO', address: '0x9041fe5b3fdea0f5e4afdc17e75180738d877a01'},
    {name: 'AION', address: '0x4CEdA7906a5Ed2179785Cd3A40A69ee8bc99C466'}
  ]
  let mailMsg = []
  for (let i = 0; i < contractMap.length; i++) {
    let html = await fetchEthscanData(contractMap[i].name, contractMap[i].address)
    if (html.length) {
      html = '<span style="font-size: 25px, color: "red"">' + contractMap[i].name + ':<span><br />' + html
    } else {
      html = '<span style="font-size: 25px, color: "red"">' + contractMap[i].name + ':<span>无持仓变化<br />'
    }
    mailMsg.push(html)
  }
  if (mailMsg.length) {
    sendMail(mailMsg.join('<br />======================我是分割线=================<br />'))
  }
}
fetchAllEthscanData()
setInterval(() => {
  fetchAllEthscanData()
}, 60*60*1000)

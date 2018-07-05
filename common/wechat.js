const Wechat = require('wechat4u')
const qrcode = require('qrcode-terminal')
const fs = require('fs')
const request = require('request-promise')
const moment = require('moment');

let bot
/**
 * 尝试获取本地登录数据，免扫码
 * 这里演示从本地文件中获取数据
 */
try {
  bot = new Wechat(require('./sync-data.json'))
} catch (e) {
  bot = new Wechat()
}
/**
 * 启动机器人
 */
if (bot.PROP.uin) {
  // 存在登录数据时，可以随时调用restart进行重启
  bot.restart()
} else {
  bot.start()
}
/**
 * uuid事件，参数为uuid，根据uuid生成二维码
 */
bot.on('uuid', uuid => {
  qrcode.generate('https://login.weixin.qq.com/l/' + uuid, {
    small: true
  })
  console.log('二维码链接：', 'https://login.weixin.qq.com/qrcode/' + uuid)
})

bot.on('login', () => {
  console.log('登录成功')
  // 保存数据，将数据序列化之后保存到任意位置
  fs.writeFileSync('./sync-data.json', JSON.stringify(bot.botData))
})
/**
 * 登出成功事件
 */
bot.on('logout', () => {
  console.log('登出成功')
  // 清除数据
  fs.unlinkSync('./sync-data.json')
})

/**
 * 错误事件，参数一般为Error对象
 */
bot.on('error', err => {
  console.error('错误：', err)
})
/**
 * 如何发送消息
 */
bot.on('login', () => {
  /**
   * 演示发送消息到文件传输助手
   * 通常回复消息时可以用 msg.FromUserName
   */
  let ToUserName = 'filehelper'

  /**
   * 发送文本消息，可以包含emoji(😒)和QQ表情([坏笑])
   */
  bot.sendMsg('发送文本消息，可以包含emoji(😒)和QQ表情([坏笑])', ToUserName)
    .catch(err => {
      bot.emit('error', err)
    })

  /**
   * 通过表情MD5发送表情
   */
  bot.sendMsg({
    emoticonMd5: '00c801cdf69127550d93ca52c3f853ff'
  }, ToUserName)
    .catch(err => {
      bot.emit('error', err)
    })

  /**
   * 以下通过上传文件发送图片，视频，附件等
   * 通用方法为入下
   * file为多种类型
   * filename必填，主要为了判断文件类型
   */
  // bot.sendMsg({
  //   file: Stream || Buffer || ArrayBuffer || File || Blob,
  //   filename: 'bot-qrcode.jpg'
  // }, ToUserName)
  //   .catch(err => {
  //     bot.emit('error',err)
  //   })

  /**
   * 发送图片
   */
  bot.sendMsg({
    file: request('https://raw.githubusercontent.com/nodeWechat/wechat4u/master/bot-qrcode.jpg'),
    filename: 'bot-qrcode.jpg'
  }, ToUserName)
    .catch(err => {
      bot.emit('error', err)
    })

  /**
   * 发送表情
   */
  bot.sendMsg({
    file: fs.createReadStream('./media/test.gif'),
    filename: 'test.gif'
  }, ToUserName)
    .catch(err => {
      bot.emit('error', err)
    })
})
/**
 * 如何处理会话消息
 */
bot.on('message', async (msg) => {
  /**
   * 获取消息时间
   */
  console.log(`----------${msg.getDisplayTime()}----------`)
  /**
   * 获取消息发送者的显示名
   */
  console.log(bot.contacts[msg.FromUserName].getDisplayName())
  /**
   * 判断消息类型
   */
  switch (msg.MsgType) {
    case bot.CONF.MSGTYPE_TEXT:
      /**
       * 文本消息
       */
      if (msg.Content.indexOf('厦冰ram_price') > -1) {
        console.log(msg)
        let price = await getEOSRamPrice()
        const msgStr = '时间： ' + moment(new Date()).format('YYYY年MM月DD日 HH:mm:ss') +',EOS RAM 当前价格：' + price + 'EOS/kb'
        bot.sendMsg(msgStr, msg.ToUserName)
          .catch(err => {
            bot.emit('error', err)
          })

        bot.sendMsg(msgStr, msg.FromUserName)
          .catch(err => {
            bot.emit('error', err)
          })
      }
      break
    default:
      break
  }
})


// bot.on('message', msg => {
//   bot.getHeadImg(bot.contacts[msg.FromUserName].HeadImgUrl).then(res => {
//     fs.writeFileSync(`./${msg.FromUserName}.jpg`, res.data)
//   }).catch(err => {
//     bot.emit('error', err)
//   })
// })

async function getEOSRamPrice(params) {
  let price = 0.00000
  let data = await request('https://tbeospre.mytokenpocket.vip/v1/ram_price')
  console.log(data)
  data = JSON.parse(data)
  if (data.result === 0) {
    price = parseFloat(1 * 1024 / data.data).toFixed(5)
  }
  console.log('price is', price)
  return price
}
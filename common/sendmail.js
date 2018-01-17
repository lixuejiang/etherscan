const nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    secureConnection: true, // use SSL
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: '642898959@qq.com', // generated ethereal user
        pass: '111'  // generated ethereal password
    }
});

// setup email data with unicode symbols
let mailOptions = {
    from: '642898959@qq.com', // sender address
    to: '642898959@qq.com, hardensky@foxmail.com', // list of receivers
    subject: '嫩模币到账', // Subject line
    text: '你有1000个比特币到账，请查收', // plain text body
    html: '<b>你有1000个比特币到账，请<a href="http://www.baidu.com" target="_blank">点我</a>查收</b>' // html body
};

// send mail with defined transport object
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

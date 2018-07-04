const Sequelize = require('sequelize');
const sequelize = new Sequelize('sqlite:./dbname.db')
const moment = require('moment');

function getModel(dbname) {
  const sequelize = new Sequelize(`sqlite:./${dbname}.db`,{logging: false})
  const Record = sequelize.define('record', {
    rank: Sequelize.STRING,
    address: Sequelize.STRING,
    quantity:Sequelize.DECIMAL,
    recordDate: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  });
  return Record;
}

async function test() {
  let model = getModel('EOSRAM')
  const recodrs = await model.findAll({
    where: {
      address: '0x00000000000000000000000000000000000000b1'
    },
    order: [Sequelize.literal('recordDate DESC')]
  })
  console.log(moment(recodrs[0].recordDate).format('YYYY年MM月DD日 HH:mm:ss'))
}

// test()

Record = getModel('EOSRAM')
let temp = {
  rank: '1',
  address: 'trs[i].children[1].innerText',
  quantity: 10,
}
Record.sync().then(() => {
  // Record.create(temp)
});

module.exports = {
  getModel: getModel
}
const Sequelize = require('sequelize');
const sequelize = new Sequelize('sqlite:./dbname.db')

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


// Record =  getModel('122')
// let temp = {
//   rank: '1',
//   address: 'trs[i].children[1].innerText',
//   quantity: 10,
// }
// Record.sync().then(() => {
//   Record.create(temp)
// });

module.exports = {
  getModel: getModel
}
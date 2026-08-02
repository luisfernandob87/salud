const { makeCrudRouter } = require('./entityCrud');

module.exports = makeCrudRouter({
  table: 'studies',
  type: 'study',
  orderField: 'date',
  allowedFields: ['date', 'category', 'description', 'observations', 'tags'],
});

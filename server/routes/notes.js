const { makeCrudRouter } = require('./entityCrud');

module.exports = makeCrudRouter({
  table: 'notes',
  type: 'note',
  orderField: 'date',
  allowedFields: ['date', 'title', 'content', 'tags', 'visible_in_pdf'],
});

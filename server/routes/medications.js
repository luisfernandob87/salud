const { makeCrudRouter } = require('./entityCrud');

module.exports = makeCrudRouter({
  table: 'medications',
  type: 'medication',
  orderField: 'start_date',
  allowedFields: ['name', 'dosage', 'frequency', 'start_date', 'end_date', 'prescribed_by', 'status', 'reminder_at', 'notes', 'tags'],
});

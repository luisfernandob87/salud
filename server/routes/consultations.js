const { makeCrudRouter } = require('./entityCrud');

module.exports = makeCrudRouter({
  table: 'consultations',
  type: 'consultation',
  orderField: 'date',
  allowedFields: ['date', 'specialty', 'doctor', 'place', 'reason', 'diagnosis', 'treatment', 'recommendations', 'next_appointment', 'notes', 'tags', 'visible_in_pdf'],
});

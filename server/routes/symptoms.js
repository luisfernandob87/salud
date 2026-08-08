const { makeCrudRouter } = require('./entityCrud');

module.exports = makeCrudRouter({
  table: 'symptoms',
  type: 'symptom',
  orderField: 'occurred_at',
  allowedFields: ['occurred_at', 'body_locations', 'intensity', 'kind', 'duration', 'causes', 'activity', 'relief', 'notes', 'tags', 'visible_in_pdf'],
});

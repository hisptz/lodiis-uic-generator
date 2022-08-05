const _ = require("lodash");

function generateSanitizedSummary(summaries) {
  var sanitizedSummary = {};
  const groupedSummaries = _.groupBy(summaries, "status");
  _.forIn(groupedSummaries, function (value, key) {
    sanitizedSummary = {
      ...sanitizedSummary,
      [`${_.capitalize(key)}`]: value.length,
    };
  });

  sanitizedSummary = { ...sanitizedSummary, Total: summaries.length };

  return sanitizedSummary;
}

module.exports = {
  generateSanitizedSummary,
};

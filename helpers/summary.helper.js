const _ = require("lodash");

function generateSanitizedSummary(summaries) {
  var sanitizedSummary = [];
  const groupedSummaries = _.groupBy(summaries, "status");
  _.forIn(groupedSummaries, function (value, key) {
    sanitizedSummary = [
      ...sanitizedSummary,
      {
        Status: _.capitalize(key),
        Count: value.length,
      },
    ];
  });

  sanitizedSummary = [
    ...sanitizedSummary,
    { Status: "Total", Count: summaries.length },
  ];

  return sanitizedSummary;
}

module.exports = {
  generateSanitizedSummary,
};

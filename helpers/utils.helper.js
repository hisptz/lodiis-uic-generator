const _ = require('lodash');
const constantsHelper = require('./constants.helper');
const constants = constantsHelper.constants;
const metadataConstants = constants.metadata;
const requestResponseConstants = constants.requestResponse;
const {
  getAttributeValueByIdFromTEI,
  getAttributesFromTEI,
} = require('./tracked-entity-instances.helper');
function incrementChar(letter) {
  return String.fromCharCode(letter.charCodeAt(0) + 1);
}
function getDataPaginationFilters(paginationData, pageSize = 50) {
  const paginationFilter = [];

  const pager =
    paginationData && paginationData.pager ? paginationData.pager : {};
  const total = pager && pager.total >= pageSize ? pager.total : pageSize;
  for (let page = 1; page <= Math.ceil(total / pageSize); page++) {
    paginationFilter.push(`totalPages=true&pageSize=${pageSize}&page=${page}`);
  }
  return paginationFilter;
}

function generateSummary(payloads, responses, orgUnit) {
  let summaries = [];
  if (responses && responses.length) {
    for (const responseItem of responses) {
      const importSummaries =
        responseItem &&
        responseItem.response &&
        responseItem.response.importSummaries
          ? responseItem.response.importSummaries
          : [];
      const formattedSummaries = getFormattedSummaries(importSummaries, payloads,orgUnit);
      summaries = [...summaries, ...formattedSummaries];
    }
  }
  return summaries;
}


function getFormattedSummaries(importSummaries, payloads, orgUnit) {
  return _.map(importSummaries || [], (summary) => {
    const reference = summary && summary.reference ? summary.reference : '';
    const status = summary && summary.status ? summary.status : '';
    const referencePayload = _.find(
      payloads || [],
      (payload) => payload.trackedEntityInstance === reference
    );
    const attributes = getAttributesFromTEI(referencePayload);

    const orgUnitName = orgUnit && orgUnit.name ? orgUnit.name : '';
    const attributeColumns = getAttributeSummaryColumns(attributes);

    return {
      trackedEntityInstance: reference,
      orgUnit: orgUnitName,
      status,
      ...attributeColumns
    };
  });
}

function getAttributeSummaryColumns(attributes) {
  let values = {};
  const attributeColumns = _.filter(
    requestResponseConstants.summary.columns || [],
    (column) => column.isAttribute
  );
  if(attributeColumns && attributeColumns.length) {
    for(const column of attributeColumns) {
       const columnName = column && column.name ? column.name : '';
       if(columnName) {
         const value =  getAttributeValueByIdFromTEI(
             attributes,
             metadataConstants[columnName]
         );
         values = {...values, [columnName]: value };

       }

    }
  }
  return values;
}

module.exports = {
  incrementChar,
  getDataPaginationFilters,
  generateSummary,
};

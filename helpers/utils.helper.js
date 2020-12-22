const _ = require('lodash');
const constantsHelper = require('./constants.helper');
const constants = constantsHelper.constants;
const metadataConstants = constants.metadata;
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
      const formattedSummaries = _.map(importSummaries || [], (summary) => {
        const reference = summary && summary.reference ? summary.reference : '';
        const status = summary && summary.status ? summary.status : '';
        const referencePayload = _.find(
          payloads || [],
          (payload) => payload.trackedEntityInstance === reference
        );
        const attributes =
          referencePayload && referencePayload.attributes
            ? referencePayload.attributes
            : [];
        const firstnameObj = _.find(
          attributes || [],
          (attributeItem) =>
            attributeItem.attribute === metadataConstants.firstname
        );
        const surnameObj = _.find(
          attributes || [],
          (attributeItem) =>
            attributeItem.attribute === metadataConstants.surname
        );
        const primaryUICObj = _.find(
          attributes || [],
          (attributeItem) =>
            attributeItem.attribute === constants.primaryUICMetadataId
        );
        const secondaryUICObj = _.find(
          attributes || [],
          (attributeItem) =>
            attributeItem.attribute === constants.secondaryUICMetadataId
        );
        const orgUnitName = orgUnit && orgUnit.name ? orgUnit.name : '';

        return {
          trackedEntityInstance: reference,
          firstname:
            firstnameObj && firstnameObj.value ? firstnameObj.value : '',
          surname: surnameObj && surnameObj.value ? surnameObj.value : '',
          orgUnit: orgUnitName,
          primaryUIC:
            primaryUICObj && primaryUICObj.value ? primaryUICObj.value : '',
          secondaryUIC:
            secondaryUICObj && secondaryUICObj.value
              ? secondaryUICObj.value
              : '',
          status,
        };
      });
      summaries = [...summaries, ...formattedSummaries];
    }
  }
  return summaries;
}

module.exports = {
  incrementChar,
  getDataPaginationFilters,
  generateSummary
};

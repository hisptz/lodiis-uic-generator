const httpHelper = require('./http.helper');
const logsHelper = require('./logs.helper');
const _ = require('lodash');
async function getOrganisationUnitsFromServerByLevel(
  headers,
  serverUrl,
  level
) {
  let organisationUnits = [];
  try {
    const url = `${serverUrl}/api/organisationUnits.json?fields=id,name,level,ancestors[id,name,level]&filter=level:eq:${level}&paging=false`;
    const response = await httpHelper.getHttp(headers, url);
    organisationUnits =
      response && response.organisationUnits
        ? response.organisationUnits
        : organisationUnits;
  } catch (error) {
    await logsHelper.addLogs(
      'ERROR',
      JSON.stringify(error),
      'getOrganisationUnitsFromServerByLevel'
    );
  } finally {
    return organisationUnits;
  }
}
function getOrgUnitName(orgUnit) {
  return orgUnit && orgUnit.name ? orgUnit.name : '';
}
function getOrgUnitLevel(orgUnit) {
  return orgUnit && orgUnit.level ? orgUnit.level : '';
}
function getOrgUnitAncestorByLevel(orgUnit, level) {
  return _.find(
    orgUnit.ancestors || [],
    (ancestor) => ancestor.level === level
  );
}
module.exports = {
  getOrganisationUnitsFromServerByLevel,
  getOrgUnitName,
  getOrgUnitLevel,
  getOrgUnitAncestorByLevel,
};

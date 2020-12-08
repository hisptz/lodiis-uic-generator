const httpHelper = require('./http.helper');
async function getOrganisationUnitsFromServerByLevel(
    headers,
    serverUrl,
    level
  ) {
    let organisationUnits = [];
    try {
      const url = `${serverUrl}/api/organisationUnits.json?fields=id,name&filter=level:eq:${level}&paging=false`;
      const response = await httpHelper.getHttp(headers, url);
      organisationUnits = response.organisationUnits || organisationUnits;
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
  module.exports = {
    getOrganisationUnitsFromServerByLevel
  }
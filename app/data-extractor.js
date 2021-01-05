const orgUnitHelper = require('../helpers/organisational-units.helper');
const logsHelper = require('../helpers/logs.helper');
async function getOrgUnitsForDataProcessing(headers, serverUrl, level) {
  try {
    const communityCouncils = await orgUnitHelper.getOrganisationUnitsFromServerByLevel(
      headers,
      serverUrl,
      level
    );

    return communityCouncils;
  } catch (error) {
   await logsHelper.addLogs('ERROR', JSON.stringify(error), 'getOrgUnitsForDataProcessing');
  }
}
module.exports = {
  getOrgUnitsForDataProcessing,
};

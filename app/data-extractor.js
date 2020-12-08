const orgUnitHelper = require('../helpers/organisational-units.helper');
async function getOrgUnitsForDataProcessing(headers, serverUrl, level) {
  try {
    const communityCouncils = await orgUnitHelper.getOrganisationUnitsFromServerByLevel(
      headers,
      serverUrl,
      level
    );
    return communityCouncils;
  } catch (e) {
    console.log({e});
   await logsHelper.addLogs('ERROR', JSON.stringify(error), 'App');
  }
}
module.exports = {
  getOrgUnitsForDataProcessing,
};

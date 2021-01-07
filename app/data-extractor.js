const orgUnitHelper = require('../helpers/organisational-units.helper');
const logsHelper = require('../helpers/logs.helper');
const {updateProcessStatus} = require('../helpers/utils.helper')
async function getOrgUnitsForDataProcessing(headers, serverUrl, level) {
  try {
    updateProcessStatus('Fetching organisation units...');
    return await orgUnitHelper.getOrganisationUnitsFromServerByLevel(
        headers,
        serverUrl,
        level
    );
  } catch (error) {
   await logsHelper.addLogs('ERROR', JSON.stringify(error), 'getOrgUnitsForDataProcessing');
  }
}
module.exports = {
  getOrgUnitsForDataProcessing,
};

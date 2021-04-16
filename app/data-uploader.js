const logsHelper = require('../helpers/logs.helper');
const teiHelper = require('../helpers/tracked-entity-instances.helper');
const utilsHelper = require('../helpers/utils.helper');
async function uploadUpdatedTEIS(
  headers,
  serverUrl,
  orgUnit,
  orgUnitName,
  payloads
) {
  utilsHelper.updateProcessStatus(
    `Saving updated Tracked entity instances in ${orgUnitName}`
  );
  try {
    if (payloads && payloads.length) {
      const updateResponse = await teiHelper.updateTrackedEntityInstances(
        headers,
        serverUrl,
        payloads
      );
      return updateResponse;
    } else {
      return null;
    }
  } catch (error) {
    console.log(error);
    await logsHelper.addLogs(
      'ERROR',
      error.message || error,
      'uploadUpdatedTEIS'
    );
    return null;
  }
}
module.exports = {
  uploadUpdatedTEIS,
};

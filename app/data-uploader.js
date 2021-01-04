const logsHelper = require('../helpers/logs.helper');
const teiHelper = require('../helpers/tracked-entity-instances.helper');
async function uploadUpdatedTEIS(headers, serverUrl, orgUnit, payloads) {
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
    await logsHelper.addLogs(
      'ERROR',
      JSON.stringify(error),
      'uploadUpdatedTEIS'
    );
    return null;
  }
}
module.exports = {
  uploadUpdatedTEIS,
};

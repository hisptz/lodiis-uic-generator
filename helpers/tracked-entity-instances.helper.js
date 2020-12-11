const httpHelper = require('./http.helper');
async function getTrackedEntityInstanceByProgramAndOrgUnit(
  headers,
  serverUrl,
  orgUnit,
  program
) {
  let trackedEntityInstances = [];
  try {
    const fields = `fields=orgUnit,trackedEntityInstance,relationships,attributes`;
    const url = `${serverUrl}/api/trackedEntityInstances.json?${fields}&ou=${orgUnit}&program=${program}`;
    const response = await httpHelper.getHttp(headers, url);
    trackedEntityInstances =
      response && response.trackedEntityInstances
        ? response.trackedEntityInstances
        : [];
  } catch (error) {
    await logsHelper.addLogs(
      'ERROR',
      JSON.stringify(error),
      'getTrackedEntityInstanceByProgramAndOrgUnit'
    );
  } finally {
    return trackedEntityInstances;
  }
}
module.exports = {
  getTrackedEntityInstanceByProgramAndOrgUnit,
};

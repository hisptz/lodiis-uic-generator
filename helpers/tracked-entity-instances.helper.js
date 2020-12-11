const httpHelper = require('./http.helper');
const utilsHelper = require('./utils.helper');
async function getTrackedEntityInstanceByProgramAndOrgUnit(
  headers,
  serverUrl,
  orgUnit,
  program
) {
  let trackedEntityInstances = [];
  try {
    const fields = `fields=orgUnit,trackedEntityInstance,relationships,attributes`;

    const paginationData = await getTeiPaginationData(
      headers,
      serverUrl,
      orgUnit,
      program
    );
    const paginationFilters = utilsHelper.getDataPaginationFilters(
      paginationData
    );
   

    if (paginationFilters && paginationFilters.length) {
     
      for (const filter of paginationFilters) {
        const url = `${serverUrl}/api/trackedEntityInstances.json?${fields}&ou=${orgUnit}&program=${program}&${filter}`;
        const response = await httpHelper.getHttp(headers, url);
        
        trackedEntityInstances =
          response && response.trackedEntityInstances
            ? [...trackedEntityInstances, ...response.trackedEntityInstances]
            : trackedEntityInstances;
      }
    }
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
async function getTeiPaginationData(headers, serverUrl, orgUnit, program) {
  let paginationData = null;
  try {
    const pageOptions = `totalPages=true&pageSize=1&fields=none`;
    const url = `${serverUrl}api/trackedEntityInstances.json?ou=${orgUnit}&program=${program}&${pageOptions}`;
    const response = await httpHelper.getHttp(headers, url);
    paginationData = response;
   
  } catch (error) {
   
    await logsHelper.addLogs(
      'ERROR',
      JSON.stringify(error),
      'getTrackedEntityInstanceByProgramAndOrgUnit'
    );
  } finally {
    return paginationData;
  }
}

module.exports = {
  getTrackedEntityInstanceByProgramAndOrgUnit,
};

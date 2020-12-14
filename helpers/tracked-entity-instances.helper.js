const httpHelper = require('./http.helper');
const utilsHelper = require('./utils.helper');
const _ = require('lodash');
async function getTrackedEntityInstanceByProgramAndOrgUnit(
  headers,
  serverUrl,
  orgUnit,
  program
) {
  let trackedEntityInstances = [];
  try {
    const enrollmentFields = `enrollments[enrollment,program,enrollmentDate]`;
    const fields = `fields=orgUnit,trackedEntityInstance,relationships,${enrollmentFields},attributes[attribute,value],created`;

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
async function updateTrackedEntityInstances(headers, serverUrl,  teis) {
  try {

    const teisChunks = _.chunk(teis || [], 50);
  
    for(const teiChunk of teisChunks) {
      const url = `${serverUrl}/api/trackedEntityInstances.json?strategy=CREATE_AND_UPDATE`;
      const response = await httpHelper.postHttp(headers,url, teiChunk); 
    } 

  } catch(error) {
    await logsHelper.addLogs(
      'ERROR',
      JSON.stringify(error),
      'updateTrackedEntityInstances'
    );
       
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

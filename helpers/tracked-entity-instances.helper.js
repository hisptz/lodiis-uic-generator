const httpHelper = require('./http.helper');
const utilsHelper = require('./utils.helper');
const logsHelper = require('./logs.helper');
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
    const paginationFilters = getDataPaginationFilters(
      paginationData, 50
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
    console.log(error);
    await logsHelper.addLogs(
      'ERROR',
      JSON.stringify(error),
      'getTrackedEntityInstanceByProgramAndOrgUnit'
    );
  } finally {
    return trackedEntityInstances;
  }
}
async function updateTrackedEntityInstances(headers, serverUrl, teis) {
  const updateResponse = [];
  try {
    const teisChunks = _.chunk(teis || [], 50);

    for (const teiChunk of teisChunks) {
      const url = `${serverUrl}/api/trackedEntityInstances?strategy=CREATE_AND_UPDATE`;
      const response = await httpHelper.postHttp(headers, url, {
        trackedEntityInstances: teiChunk,
      });
      updateResponse.push(response);
    }
    return updateResponse;
  } catch (error) {
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
    const url = `${serverUrl}/api/trackedEntityInstances.json?ou=${orgUnit}&program=${program}&${pageOptions}`;
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
function getAttributesFromTEI(tei) {
  return tei && tei.attributes ? tei.attributes : [];
}
function getAttributeObjectByIdFromTEI(attributes, attributeId) {
  return _.find(
    attributes || [],
    (attributeItem) => attributeItem.attribute === attributeId
  );
}
function getAttributeValueByIdFromTEI(attributes, attributeId) {
  const attributeObj = _.find(
    attributes || [],
    (attributeItem) => attributeItem.attribute === attributeId
  );
  return attributeObj && attributeObj.value ? attributeObj.value : '';
}
function sortTeiArrayByEnrollmentDate(trackedEntityInstances, programId) {
 return _.sortBy(
      trackedEntityInstances || [],
      (instance) => {
        const enrollment = _.find(
            instance.enrollments || [],
            (enrolmentItem) => enrolmentItem.program === programId
        );
        return new Date(enrollment.enrollmentDate);
      }
  );
}
function sortTeiArrayByAge(trackedEntityInstances, ageMetadataId) {
  return trackedEntityInstances && trackedEntityInstances.length
      ? _.sortBy(trackedEntityInstances || [], (tei) => {
    const childAgeAttribute = getAttributeValueByIdFromTEI(tei.attributes, ageMetadataId);
    return childAgeAttribute && childAgeAttribute.value
        ? parseInt(childAgeAttribute.value, 10)
        : 0;
  }).reverse(): [];
}
function separateTeiParentFromChildren(trackedEntityInstances) {
  let childrenTeiPayloads = [];
  const parentTeiPayloads = _.map(trackedEntityInstances || [], (tei) => {
    childrenTeiPayloads =
        tei && tei.children
            ? [...childrenTeiPayloads, ...tei.children]
            : [...childrenTeiPayloads];
    delete tei.children;
    return tei;
  });
  return childrenTeiPayloads.concat(parentTeiPayloads);
}
function getDataPaginationFilters(paginationData, pageSize = 50) {
  const paginationFilter = [];

  const pager =
      paginationData && paginationData.pager ? paginationData.pager : {};
  const total = pager && pager.total >= pageSize ? pager.total : pageSize;
  for (let page = 1; page <= Math.ceil(total / pageSize); page++) {
    paginationFilter.push(`totalPages=true&pageSize=${pageSize}&page=${page}`);
  }
  return paginationFilter;
}

module.exports = {
  getTrackedEntityInstanceByProgramAndOrgUnit,
  updateTrackedEntityInstances,
  getAttributeObjectByIdFromTEI,
  getAttributeValueByIdFromTEI,
  getAttributesFromTEI,
  sortTeiArrayByEnrollmentDate,
  sortTeiArrayByAge,
  separateTeiParentFromChildren
};

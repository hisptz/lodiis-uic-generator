const dhis2Util = require('../helpers/dhis2-util.helper');
const config = require('../config');
const serverUrl = config.sourceConfig.url;
const dataExtractor = require('./data-extractor');
const dataProcessor = require('./data-processor');
const constantsHelper = require('../helpers/constants.helper');
const levelForDataProcessing = constantsHelper.constants.orgUnitLevelThree;
const logsHelper = require('../helpers/logs.helper');
const teiHelper = require('../helpers/tracked-entity-instances.helper');
async function startApp() {
  const headers = await dhis2Util.getHttpAuthorizationHeader(
    config.sourceConfig.username,
    config.sourceConfig.password
  );
  try {
    // Get all org units require to retrieve data from programs
    const orgUnitsForDataProcessing = await dataExtractor.getOrgUnitsForDataProcessing(
      headers,
      serverUrl,
      levelForDataProcessing
    );
    if (orgUnitsForDataProcessing && orgUnitsForDataProcessing.length) {
      for (const orgUnit of orgUnitsForDataProcessing.slice(1,2)) {
        const payloads = await dataProcessor.getTrackedEntityPayloadsByOrgUnit(
          headers,
          serverUrl,
          orgUnit
        );
        if(payloads && payloads.length) {
        // const updateResponse = await teiHelper.updateTrackedEntityInstances(headers,serverUrl,payloads);
         //  console.log(JSON.stringify(updateResponse));
           console.log(JSON.stringify(payloads.slice(0,1)));
        }
       
      }
    } else {
      console.log('There is no Community Council present');
    }
  } catch (error) {
    console.log(error);
    await logsHelper.addLogs('ERROR', JSON.stringify(error), 'startApp');
  }
}
module.exports = {
  startApp,
};

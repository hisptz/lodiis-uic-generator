const dhis2Util = require('../helpers/dhis2-util.helper');
const config = require('../config');
const serverUrl = config.sourceConfig.url;
const dataExtractor = require('./data-extractor');
const dataProcessor = require('./data-processor');
const constantsHelper = require('../helpers/constants.helper');
const levelForDataProcessing = constantsHelper.constants.orgUnitLevelThree;
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
      for (const orgUnit of orgUnitsForDataProcessing) {
        const payloads = await dataProcessor.getTrackedEntityPayloadsByOrgUnit(
          headers,
          serverUrl,
          orgUnit
        );
        if(payloads.length) {
          console.log(JSON.stringify(payloads.slice(0,3)));
        }
       
      }
    } else {
      console.log('There is no Community Council present');
    }
  } catch (error) {
    await logsHelper.addLogs('ERROR', JSON.stringify(error), 'startApp');
  }
}
module.exports = {
  startApp,
};

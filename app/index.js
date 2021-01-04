const dhis2Util = require('../helpers/dhis2-util.helper');
const config = require('../config');
const serverUrl = config.sourceConfig.url;
const dataExtractor = require('./data-extractor');
const constantsHelper = require('../helpers/constants.helper');
const levelForDataProcessing = constantsHelper.constants.orgUnitLevelThree;
const logsHelper = require('../helpers/logs.helper');
const utilsHelper = require('../helpers/utils.helper');
const _ = require('lodash');
const dataProcessor = require('./data-processor');
const dataUploader = require('./data-uploader');
const filesManipulationHelper = require('../helpers/file-manipulation.helper');
const dirName = 'files-folder';
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
      let summaries = [];
      for (const orgUnit of orgUnitsForDataProcessing) {

        const payloads = await dataProcessor.getTrackedEntityPayloadsByOrgUnit(
          headers,
          serverUrl,
          orgUnit
        );
        const response = await dataUploader.uploadUpdatedTEIS(headers,serverUrl,payloads);
      
          const summary = utilsHelper.generateSummary(
            payloads,
            response,
            orgUnit
          );
          summaries = [...summaries, ...summary];
        
      }
      console.log('Generating summary...');
      await filesManipulationHelper.writeToExcelFile(
        summaries,
        `${dirName}/summary.xlsx`
      );
      console.log('Summary generated successfully');
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

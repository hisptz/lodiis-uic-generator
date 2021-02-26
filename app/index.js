const dhis2Util = require('../helpers/dhis2-util.helper');
const config = require('../config');
const serverUrl = config.sourceConfig.url;
const dataExtractor = require('./data-extractor');
const constantsHelper = require('../helpers/constants.helper');
const levelForDataProcessing = constantsHelper.constants.orgUnitLevelThree;
const logsHelper = require('../helpers/logs.helper');
const utilsHelper = require('../helpers/utils.helper');
const _ = require('lodash');
const statusHelper = require('../helpers/status.helper');
const dataProcessor = require('./data-processor');
const dataUploader = require('./data-uploader');
const filesManipulationHelper = require('../helpers/file-manipulation.helper');
const dirName = 'files-folder';
const constants = constantsHelper.constants;
const appStatus = constants.appStatus;
async function startApp(commands) {
  const headers = await dhis2Util.getHttpAuthorizationHeader(
    config.sourceConfig.username,
    config.sourceConfig.password
  );
  try {
    // Get all org units require to retrieve data from programs
    await logsHelper.addLogs('INFO', 'Fetching Community Councils','startApp');
    const orgUnitsForDataProcessing = await dataExtractor.getOrgUnitsForDataProcessing(
      headers,
      serverUrl,
      levelForDataProcessing
    );


    // orgUnitsForDataProcessing = _.filter(orgUnitsForDataProcessing || [], orgUnit => orgUnit.id === 'zbHbxA2SZ96');

    if (orgUnitsForDataProcessing && orgUnitsForDataProcessing.length) {
      let summaries = [];

      utilsHelper.updateProcessStatus(
        'Generating Primary and secondary UICs...'
      );
      await logsHelper.addLogs('INFO', 'Generating Primary and secondary UICs');

      let orgUnitIndex = 0;

      for (const orgUnit of orgUnitsForDataProcessing) {
        orgUnitIndex = orgUnitIndex + 1;
        const orgUnitName = orgUnit && orgUnit.name ? orgUnit.name : '';
        const startDate = commands && commands.from ? commands.from : '';
        const endDate = commands && commands.to ? commands.to : '';

        utilsHelper.updateProcessStatus(
          `Generating primary and secondary UICs for tracked Entity instances in ${orgUnitName}: ${orgUnitIndex}`
        );
        await logsHelper.addLogs('INFO', `Generating primary and secondary UICs for tracked Entity instances in ${orgUnitName}: ${orgUnitIndex}`, 'App');
        
        

        const payloads = await dataProcessor.getTrackedEntityPayloadsByOrgUnit(
          headers,
          serverUrl,
          orgUnit,
            startDate,
            endDate
        );

        const response = await dataUploader.uploadUpdatedTEIS(
          headers,
          serverUrl,
          orgUnit,
          orgUnitName,
          payloads
        );
        await logsHelper.addLogs('INFO', `Uploaded primary and secondary UICs for tracked Entity instances in ${orgUnitName}: ${orgUnitIndex}`, 'App');

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

      await statusHelper.updateAppStatusConfiguration(headers,serverUrl, {
        appStatus: appStatus.appStatusOptions.stopped,
        timeStopped: new Date()
      });

    

      await logsHelper.addLogs('INFO', `End an app`, 'App');
    } else {
      await logsHelper.addLogs('INFO', 'There is no Community Council present');
      console.log('There is no Community Council present');
      await logsHelper.addLogs('INFO', `End an app`, 'App');
    }
  } catch (error) {
    console.log(error);
    await logsHelper.addLogs('ERROR', JSON.stringify(error), 'startApp');
  }
}
module.exports = {
  startApp,
};

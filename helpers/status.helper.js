const httpHelper = require('./http.helper');
const logsHelper = require('./logs.helper');
const constantsHelper = require('./constants.helper');
const utilsHelper = require('./utils.helper');
const constants = constantsHelper.constants;
const appStatus = constants.appStatus;
const defaultAppStatusData = appStatus.defaultStatusData;
const _ = require('lodash');
async function getStatusConfiguration(headers, serverUrl) {
  console.log('Getting application status');
  let config = await getAppStatusConfiguration(headers, serverUrl);
  if (config) {
    if (config.httpStatusCode && config.httpStatusCode >= 400) {
      if (config.httpStatusCode === 404) {
        const createConfigResponse = await createAppStatusConfiguration(
          headers,
          serverUrl,
          defaultAppStatusData
        );
        config =
          createConfigResponse &&
          createConfigResponse.httpStatusCode &&
          createConfigResponse.httpStatusCode >= 200 &&
          createConfigResponse.httpStatusCode < 300
            ? await getAppStatusConfiguration(headers, serverUrl)
            : { appStatus: appStatus.appStatusOptions.unknown };
      } else {
        utilsHelper.printCreateStatusError();
        config = { appStatus: appStatus.appStatusOptions.unknown };
      }
    }
  }
  return config ? config : { appStatus: appStatus.appStatusOptions.unknown };
}

async function getAppStatusConfiguration(headers, serverUrl) {
  let response = null;
  try {
    const url = `${serverUrl}/api/dataStore/uicConfig/statusConfig`;
    response = await httpHelper.getHttp(headers, url);
  } catch (error) {
    await logsHelper.addLogs(
      'ERROR',
      JSON.stringify(error),
      'getAppStatusConfiguration'
    );
    response = error;
  } finally {
    return response;
  }
}
async function createAppStatusConfiguration(headers, serverUrl, data) {
  let response = null;
  try {
    const url = `${serverUrl}/api/dataStore/uicConfig/statusConfig`;
    response = await httpHelper.postHttp(headers, url, data);
  } catch (error) {
    await logsHelper.addLogs(
      'ERROR',
      JSON.stringify(error),
      'createAppStatusConfiguration'
    );
    response = error;
  } finally {
    return response;
  }
}
async function updateAppStatusConfiguration(headers, serverUrl, data) {
  let response = null;
  try {
    const url = `${serverUrl}/api/dataStore/uicConfig/statusConfig`;
    response = await httpHelper.putHttp(headers, url, data);
  } catch (error) {
    await logsHelper.addLogs(
      'ERROR',
      JSON.stringify(error),
      'createAppStatusConfiguration'
    );
    response = error;
  } finally {
    return response;
  }
}
async function updateStatusFromCommand(headers, serverUrl, statusOption) {
  const statuses = Object.keys(appStatus.appStatusOptions);
  const selectedStatus = _.flattenDeep(_.map(statuses || [], statusItem => {
       if(statusOption === appStatus.appStatusOptions[statusItem]) {
          return statusOption;
       }
       return [];
  }));
  if(selectedStatus && selectedStatus.length ) {
    const updateStatusResponse = await updateAppStatusConfiguration(headers, serverUrl, {
      appStatus: statusOption,
      timeUpdated: new Date()
    });
    if( updateStatusResponse &&
        updateStatusResponse.httpStatusCode &&
        updateStatusResponse.httpStatusCode >= 200 &&
        updateStatusResponse.httpStatusCode < 300) {
      console.log(`Status ${statusOption} updated successfully`);
    } else {
      console.log(`There was error while updating status ${statusOption}`);
    }
  } else {
    console.log('Unknown app status');
  }
}
module.exports = {
  getStatusConfiguration,
  updateAppStatusConfiguration,
  updateStatusFromCommand
};

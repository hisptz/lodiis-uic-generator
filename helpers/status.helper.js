const httpHelper = require('./http.helper');
const logsHelper = require('./logs.helper');
const constantsHelper = require('./constants.helper');
const utilsHelper = require('./utils.helper');
const constants = constantsHelper.constants;
const appStatus = constants.appStatus;
const defaultAppStatusData = appStatus.defaultStatusData;
async function getStatusConfiguration(headers, serverUrl) {
  const config = await getAppStatusConfiguration(headers, serverUrl);
  let canAppContinue = false;
  if (config) {
    if (config.httpStatusCode && config.httpStatusCode >= 400) {
      if (config.httpStatusCode === 404) {
        const createConfigResponse = createAppStatusConfiguration(
          headers,
          serverUrl,
          defaultAppStatusData
        );
        if (
          (createConfigResponse && createConfigResponse.status === 'ERROR') ||
          createConfigResponse.httpStatusCode >= 400
        ) {
          utilsHelper.printCreateStatusError();
          canAppContinue = false;
        }
      } else {
        utilsHelper.printCreateStatusError();
        canAppContinue = false;
      }
      canAppContinue = true;
    } else {
      if (
        config.appStatus === appStatus.appStatusOptions.running ||
        config.appStatus === appStatus.appStatusOptions.underMaintenance
      ) {
        canAppContinue = false;
      } else {
          await  updateAppStatusConfiguration(headers,serverUrl, defaultAppStatusData);
          canAppContinue = true;
      }
    }
  } else {
      canAppContinue = false;
  }
  return canAppContinue;
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
module.exports = {
  getStatusConfiguration,
    updateAppStatusConfiguration
};

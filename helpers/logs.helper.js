const moment = require('moment');
const fileManipulation = require('./file-manipulation.helper');
const fileName = 'logs';
const dirFolder = 'logs';
const httpHelper = require('./http.helper');

async function clearLogs() {
  const data = '';
  try {
    await fileManipulation.writeToFile(dirFolder, fileName, data, false);
  } catch (error) {
    console.log(data);
  } finally {
    return;
  }
}
async function addLogs(type = 'INFO', message, resource = '') {
  const time = moment().utcOffset('+0200').format('YYYY-MM-DD hh:mm:ss A');
  const data = `${time} ${type}(${resource}) ${message}\n`;
  const flag = 'a+';
  try {
    await fileManipulation.writeToFile(dirFolder, fileName, data, false, flag);
  } catch (error) {
    console.log(data.replace('\n', ''));
  } finally {
    return;
  }
}
async function saveRawResponse(data, orgUnitName = '') {
  const rawResponseStr = _.isObjectLike(data)
    ? `${orgUnitName} \n ${JSON.stringify(data)}`
    : '';
  const flag = 'a+';
  const rawFileName = 'raw';
  try {
    await fileManipulation.writeToFile(
      dirFolder,
      rawFileName,
      `${rawResponseStr}\n\n`,
      false,
      flag
    );
  } catch (error) {
    console.log(data.replace('\n', ''));
  } finally {
    return;
  }
}
async function updateAppLogsConfiguration(
  headers,
  serverUrl,
  type = 'INFO',
  message,
  resource = ''
) {
  let config = await getLogsConfiguration(headers, serverUrl);
  if (config) {
    if (config.httpStatusCode && config.httpStatusCode >= 400) {
      if (config.httpStatusCode === 404) {
        const time = moment()
          .utcOffset('+0200')
          .format('YYYY-MM-DD hh:mm:ss A');
        const data = `${time} ${type}(${resource}) ${message}\n`;
        const createConfigResponse = await createLogsConfiguration(
          headers,
          serverUrl,
          [
            {
              time,
              statusUpdate: data,
            },
          ]
        );
      } else {
        addLogs(
          'INFO',
          'Failed to update status in data store',
          'updateAppLogsConfiguration'
        );
      }
    } else {
      const time = moment().utcOffset('+0200').format('YYYY-MM-DD hh:mm:ss A');
      const data = `${time} ${type}(${resource}) ${message}`;
      config = [
        ...config,
        {
          time,
          statusUpdate: data,
        },
      ];
      const updateConfigResponse = await updateLogsConfiguration(
        headers,
        serverUrl,
        config
      );
    }
  }
  // return config ? config : { appStatus: appStatus.appStatusOptions.unknown };
}
async function getLogsConfiguration(headers, serverUrl) {
  let response = null;
  try {
    const url = `${serverUrl}/api/dataStore/uicConfig/logs`;
    response = await httpHelper.getHttp(headers, url);
  } catch (error) {
    await logsHelper.addLogs(
      'ERROR',
      error.message || error,
      'getLogsConfiguration'
    );
    response = error;
  } finally {
    return response;
  }
}
async function createLogsConfiguration(headers, serverUrl, data) {
  let response = null;
  try {
    const url = `${serverUrl}/api/dataStore/uicConfig/logs`;
    response = await httpHelper.postHttp(headers, url, data);
  } catch (error) {
    await logsHelper.addLogs(
      'ERROR',
      error.message || error,
      'createLogsConfiguration'
    );
    response = error;
  } finally {
    return response;
  }
}
async function updateLogsConfiguration(headers, serverUrl, data) {
  let response = null;
  try {
    const url = `${serverUrl}/api/dataStore/uicConfig/logs`;
    response = await httpHelper.putHttp(headers, url, data);
  } catch (error) {
    await logsHelper.addLogs(
      'ERROR',
      error.message || error,
      'updateAppLogsConfiguration'
    );
    response = error;
  } finally {
    return response;
  }
}
async function deleteLogsConfiguration(headers, serverUrl, data = []) {
  let response = null;
  try {
    const url = `${serverUrl}/api/dataStore/uicConfig/logs`;
    response = await httpHelper.deleteHttp(headers, url, data);
  } catch (error) {
    await logsHelper.addLogs(
      'ERROR',
      error.message || error,
      'deleteLogsConfiguration'
    );
    response = error;
  } finally {
    return response;
  }
}

module.exports = {
  clearLogs,
  addLogs,
  saveRawResponse,
  updateAppLogsConfiguration,
  deleteLogsConfiguration,
};

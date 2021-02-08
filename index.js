const app = require('./app');
const dhis2Util = require('./helpers/dhis2-util.helper');
const logsHelper = require('./helpers/logs.helper');
const { updateProcessStatus } = require('./helpers/utils.helper');
const commandsHelper = require('./helpers/commands.helper');
const statusHelper = require('./helpers/status.helper');
const config = require('./config');
const serverUrl = config.sourceConfig.url;
const constantsHelper = require('./helpers/constants.helper');
const constants = constantsHelper.constants;
const appStatus = constants.appStatus;
const appStatusOptions = appStatus.appStatusOptions;
start();
async function start() {
  try {
    const headers = await dhis2Util.getHttpAuthorizationHeader(
      config.sourceConfig.username,
      config.sourceConfig.password
    );
    updateProcessStatus('Starting script...');
    await logsHelper.addLogs('INFO', `Start an app`, 'App');

    const parameters = process.argv;
    const verifiedCommands = commandsHelper.getVerifiedCommands(parameters);

     const configStatusInfo = await statusHelper.getStatusConfiguration(headers, serverUrl);
     const appConfigStatus = configStatusInfo && configStatusInfo.appStatus ? configStatusInfo.appStatus : appStatusOptions.unknown;



    switch (appConfigStatus) {
      case appStatusOptions.started:
        await statusHelper.updateAppStatusConfiguration(headers, serverUrl,{appStatus: appStatusOptions.running, timeStarted: new Date(),});
        await app.startApp(verifiedCommands);
        break;
      case appStatusOptions.stopped:
        await app.startApp(verifiedCommands);
        break;
      case appStatusOptions.running:
        console.log('The application can not be run now, It is running in other platform');
        break;
      case appStatusOptions.underMaintenance:
        console.log('The application is under maintenance please contact System administrator');
        break;
      case appStatusOptions.unknown:
        console.log('Failed to run application please try again later!');
        break;
      default:
        console.log('Failed to run application please try again later!');
        break;

    }

    // await app.startApp(verifiedCommands);
  } catch (error) {
    console.log(error);
    await logsHelper.addLogs('ERROR', JSON.stringify(error), 'App');
  }
}

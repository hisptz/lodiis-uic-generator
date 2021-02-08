const app = require('./app');
const dhis2Util = require('./helpers/dhis2-util.helper');
const logsHelper = require('./helpers/logs.helper');
const { updateProcessStatus } = require('./helpers/utils.helper');
const commandsHelper = require('./helpers/commands.helper');
const statusHelper = require('./helpers/status.helper');
const config = require('./config');
const serverUrl = config.sourceConfig.url;
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

    // await statusHelper.getStatusConfiguration(headers, serverUrl);

    // console.log(JSON.stringify(verifiedCommands));

    await app.startApp(verifiedCommands);
  } catch (error) {
    console.log(error);
    await logsHelper.addLogs('ERROR', JSON.stringify(error), 'App');
  }
}

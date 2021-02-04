const app = require('./app');
const logsHelper = require('./helpers/logs.helper');
const {updateProcessStatus} = require('./helpers/utils.helper');
const commandsHelper = require('./helpers/commands.helper');
start();
async function start() {
  try {
    updateProcessStatus('Starting script...')
    await logsHelper.addLogs('INFO', `Start an app`, 'App');

    const parameters = process.argv;
    const verifiedCommands = commandsHelper.getVerifiedCommands(parameters);

    // console.log(JSON.stringify(verifiedCommands));



   await app.startApp(verifiedCommands);
  } catch (error) {
    console.log(error);
    await logsHelper.addLogs('ERROR', JSON.stringify(error), 'App');
  }
}

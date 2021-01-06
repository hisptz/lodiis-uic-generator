const app = require('./app');
const logsHelper = require('./helpers/logs.helper');
const {updateProcessStatus} = require('./helpers/utils.helper');
start();
async function start() {
  try {
    updateProcessStatus('Starting script...')
    await logsHelper.addLogs('INFO', `Start an app`, 'App');



   await app.startApp();
  } catch (error) {
    console.log(error);
    await logsHelper.addLogs('ERROR', JSON.stringify(error), 'App');
  }
}

const app = require('./app');
const logsHelper = require('./helpers/logs.helper');
start();
async function start() {
  try {
    await logsHelper.addLogs('INFO', `Start an app`, 'App'); 
   app.startApp();
  } catch (error) {
    await logsHelper.addLogs('ERROR', JSON.stringify(error), 'App');
  }
}

const app = require('./app');
const logsHelper = require('./helpers/logs.helper');
start();
async function start() {
  try {
    await logsHelper.addLogs('INFO', `Start an app`, 'App');
    // const params = process.argv;
    // const filterIndex = 2;
    // const orgUnitFilterId = params[filterIndex] ?  params[filterIndex] : null;

   await app.startApp();
  } catch (error) {
    console.log(error);
    await logsHelper.addLogs('ERROR', JSON.stringify(error), 'App');
  }
}

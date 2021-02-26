const constantsHelper = require('./constants.helper');
const utilsHelper = require('./utils.helper');
const logsHelper = require('./logs.helper');
const moment = require('moment');
const constants = constantsHelper.constants;
const commands = constants.commands;
const actions = commands.actions;
const generate = actions && actions.generate ? actions.generate : null;
const auto = actions && actions.auto ? actions.auto : null;
const update = actions && actions.update ? actions.update : null;
const indexes = commands && commands.indexes ? commands.indexes : null;
const periods = commands && commands.periods ? commands.periods : null;
const actionIndex = indexes && indexes.actionIndex ? indexes.actionIndex : null;

function getVerifiedCommands(parameters) {
  let verifiedCommands = {};
  if (parameters && parameters.length) {
    const actionParam =
      parameters[actionIndex] && parameters[actionIndex].toLocaleLowerCase()
        ? parameters[actionIndex].toLocaleLowerCase()
        : null;
    const action =
      actionParam && actions[actionParam] ? actions[actionParam] : actions.auto;
    verifiedCommands = { ...verifiedCommands, action };
    if (action !== actions.auto) {
      if (
        parameters[indexes.fromIndex] &&
        parameters[indexes.fromIndex].toLocaleLowerCase() &&
        periods.from
      ) {
        const fromParam =
          parameters[indexes.fromIndex].toLocaleLowerCase() === periods.from
            ? periods.from
            : null;
        const fromDate =
          parameters[indexes.startDateIndex] &&
          moment(parameters[indexes.startDateIndex])
            ? moment(parameters[indexes.startDateIndex]).format('YYYY-MM-DD')
            : null;
        verifiedCommands =
          fromParam && fromDate
            ? {
                ...verifiedCommands,
                from: fromDate,
              }
            : { ...verifiedCommands };
      }
      if (
        parameters[indexes.toIndex] &&
        parameters[indexes.toIndex].toLocaleLowerCase() &&
        periods.to
      ) {
        const toParam =
          parameters[indexes.toIndex].toLocaleLowerCase() === periods.to
            ? periods.to
            : null;
        const endDate =
          parameters[indexes.endDateIndex] &&
          moment(parameters[indexes.endDateIndex])
            ? moment(parameters[indexes.endDateIndex]).format('YYYY-MM-DD')
            : moment().format('YYYY-MM-DD');
        verifiedCommands =
          toParam && endDate
            ? {
                ...verifiedCommands,
                to: endDate,
              }
            : { ...verifiedCommands };
      }
    } else {
      // const from =  moment.subtract(7,'d').format('YYYY-MM-DD');
      const from = moment().subtract(7, 'd').format('YYYY-MM-DD');
      const to = moment().format('YYYY-MM-DD');
      verifiedCommands = { ...verifiedCommands, from, to };
    }
  } else {
    console.log('There is an error on command');
  }
  return verifiedCommands;
}

async function getVerifiedCommands1(parameters) {
  let verifiedCommands = {};
  if (parameters && parameters.length) {
    const actionParam =
      parameters[actionIndex] && parameters[actionIndex].toLocaleLowerCase()
        ? parameters[actionIndex].toLocaleLowerCase()
        : null;
    const action =
      actionParam && actions[actionParam] && actions[actionParam].name ? actions[actionParam].name : '';
    verifiedCommands = { ...verifiedCommands, action };
    let from = '';
    let to = '';
    let statusOption = '';
    let actionTypeIndexes = null;
    switch (action) {
      case generate.name:
        actionTypeIndexes =
          generate && generate.indexes ? generate.indexes : null;

        from = actionTypeIndexes && parameters[actionTypeIndexes.startDateIndex]
          ? getGenerateDate(
              parameters,
              actionTypeIndexes.fromIndex,
              actionTypeIndexes.startDateIndex,
                'from'
            )
          : '';

        to = actionTypeIndexes && parameters[actionTypeIndexes.endDateIndex]
          ? getGenerateDate(
              parameters,
              actionTypeIndexes.toIndex,
              actionTypeIndexes.endDateIndex,
                'to'
            )
          : '';
        
         await logsHelper.addLogs('INFO', `COMMAND: update from ${from} to ${to}`);
        if(from === 'ERROR' || to === 'ERROR' || from === 'INVALID' || to === 'INVALID') {
          console.log('Invalid command or date specified');
          verifiedCommands = {...verifiedCommands, action: ''};

        }

        break;
      case auto.name:
        from = moment().subtract(7, 'd').format('YYYY-MM-DD');
        to = moment().format('YYYY-MM-DD');
        await logsHelper.addLogs('INFO', `COMMAND: auto`);
        break;
      case update.name:

        actionTypeIndexes = update && update.indexes ? update.indexes : null;

        statusOption = actionTypeIndexes
          ? getUpdateCommand(parameters, actionTypeIndexes.statusIndex, actionTypeIndexes.statusOptionIndex)
          : '';
          await logsHelper.addLogs('INFO', `COMMAND: update status ${statusOption}`);
        break;
        default:
            console.log('There is an error in a command, please review it and try again later');
            break;
    }

    verifiedCommands = { ...verifiedCommands, from, to, statusOption };

  } else {
    console.log('There is an error on command');
  }
  return verifiedCommands;
}

function getGenerateDate(parameters, dateTypeIndex, dateIndex, type) {
  let dateParam = null;
  let dateTypeParam = null;
  if (
    parameters[dateTypeIndex] &&
    parameters[dateTypeIndex].toLocaleLowerCase() &&
    periods[type]
  ) {
    dateTypeParam =
      parameters[dateTypeIndex].toLocaleLowerCase() === periods[type]
        ? periods[type]
        : null;
   if(!moment(parameters[dateIndex],'YYYY-MM-DD' ).isValid()) {
       return 'ERROR';
   }
   if(!dateTypeParam) {
     return 'INVALID';
   }
    dateParam =
      parameters[dateIndex] && moment(parameters[dateIndex],'YYYY-MM-DD' ).isValid()
        ? moment(parameters[dateIndex]).format('YYYY-MM-DD')
        : '';
  }
  return dateTypeParam && dateParam ? dateParam : '';
}
function getUpdateCommand(parameters, statusIndex, statusTypeIndex) {
  let status = '';
  let statusOption = '';
  if (
    parameters[statusIndex] &&
    parameters[statusIndex].toLocaleLowerCase() &&
    parameters[statusTypeIndex] &&
    parameters[statusTypeIndex].toLocaleUpperCase()
  ) {
      status = parameters[statusIndex].toLocaleLowerCase();
    statusOption = parameters[statusTypeIndex].toLocaleUpperCase();
  }
  return status && statusOption ? statusOption : '';
}
module.exports = {
  getVerifiedCommands1,
};

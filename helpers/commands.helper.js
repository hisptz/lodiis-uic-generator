const constantsHelper = require('./constants.helper');
const moment = require('moment');
const constants = constantsHelper.constants;
const commands = constants.commands;
const actions = commands.actions;
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
        actionParam && actions[actionParam]
        ? actions[actionParam]
        : actions.auto;
      verifiedCommands = {...verifiedCommands, action};
    if(action !== actions.auto) {
        if(parameters[indexes.fromIndex] && parameters[indexes.fromIndex].toLocaleLowerCase() && periods.from) {

            const fromParam =
                parameters[indexes.fromIndex].toLocaleLowerCase() === periods.from
                    ? periods.from
                    : null;
            const fromDate =
                parameters[indexes.startDateIndex] && moment(parameters[indexes.startDateIndex])
                    ? moment(parameters[indexes.startDateIndex]).format('YYYY-MM-DD')
                    : null;
            verifiedCommands = fromParam && fromDate ? {
                ...verifiedCommands,
                from: fromDate
            } : {...verifiedCommands};
        }
        if(parameters[indexes.toIndex] && parameters[indexes.toIndex].toLocaleLowerCase() && periods.to) {

            const toParam =
                parameters[indexes.toIndex].toLocaleLowerCase() === periods.to
                    ? periods.to
                    : null;
            const endDate =
                parameters[indexes.endDateIndex] && moment(parameters[indexes.endDateIndex])
                    ? moment(parameters[indexes.endDateIndex]).format('YYYY-MM-DD')
                    :  moment().format('YYYY-MM-DD');;
            verifiedCommands = toParam && endDate ? {
                ...verifiedCommands,
                to: endDate
            } : {...verifiedCommands};
        }


    } else {
        // const from =  moment.subtract(7,'d').format('YYYY-MM-DD');
        const from =  moment().subtract(7,'d').format('YYYY-MM-DD');
        const to = moment().format('YYYY-MM-DD');
        verifiedCommands = {...verifiedCommands, from, to};
    }

  } else {
      console.log('There is an error on command');
  }
  return verifiedCommands;
}
module.exports = {
  getVerifiedCommands,
};

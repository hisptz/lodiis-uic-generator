const constants = require('../helpers/constants.helper');
const secondaryUICMetadataId = constants.constants.secondaryUICMetadataId;
const _ = require('lodash');
function getSecondaryUIC(orgUnitCode, numberCounter, letterCounter) {
  const counterStr = addZerosToANumber(numberCounter);
  return `${orgUnitCode.toLocaleUpperCase().trim()}${counterStr}${letterCounter}`.trim();
}
function addZerosToANumber(number) {
  if (number <= 99999) {
    number = ('00000' + number).slice(-5);
  }
  return number;
}
function secondaryUICObj(tei) {
  return tei && tei.attributes
    ? _.find(
        tei.attributes || [],
        (attributeItem) => attributeItem.attribute === secondaryUICMetadataId
      )
    : '';
}
function getNumberCounterFromSecondaryUIC(secondaryUIC) {
  return secondaryUIC ? _.parseInt(secondaryUIC.substring(3, 8), 10) : 0;
}
function getLastTeiSecondaryUICCounter(trackedEntityInstances) {
  const secondaryUICCounters = _.flattenDeep(
    _.map(trackedEntityInstances || [], (tei) => {
      const secondaryUICAttributeObj = secondaryUICObj(tei);
      const lastCharacterIndex =
        secondaryUICAttributeObj &&
        secondaryUICAttributeObj.value &&
        secondaryUICAttributeObj.value.length
          ? secondaryUICAttributeObj.value.length - 1
          : -1;
      //  const lastCharacterIndex =
      let counter =
        secondaryUICAttributeObj && secondaryUICAttributeObj.value && lastCharacterIndex > -1
          ? secondaryUICAttributeObj.value.substring(3, lastCharacterIndex)
          : '0';
      counter = parseInt(counter, 10);
      return counter;
    })
  );

  return _.max(secondaryUICCounters) ? _.max(secondaryUICCounters) : 0;
}
async function getLastTeiSecondaryUICLetterCounter(trackedEntityInstances) {
  try {
    const counters = _.flattenDeep(
      _.map(trackedEntityInstances || [], (tei) => {
        const secondaryUICAttributeObj = secondaryUICObj(tei);
        return secondaryUICAttributeObj && secondaryUICAttributeObj.value
          ? secondaryUICAttributeObj.value.substring(-1)
          : '';
      })
    );  
    return counters && _.max(counters) ? _.max(counters) : 'A';
  } catch(error) {
    await logsHelper.addLogs(
      "ERROR",
      error.message || error,
      "getLastTeiSecondaryUICLetterCounter"
    );
  }
}

module.exports = {
  getSecondaryUIC,
  secondaryUICObj,
  getNumberCounterFromSecondaryUIC,
  getLastTeiSecondaryUICCounter,
  getLastTeiSecondaryUICLetterCounter,
};

const constants = require('../helpers/constants.helper');
const secondaryUICMetadataId = constants.constants.secondaryUICMetadataId;
const _ = require('lodash');
function getSecondaryUIC(orgUnitName, numberCounter, letterCounter) {
  const orgUnitNameSubString = orgUnitName
    ? orgUnitName.substring(0, 3).toLocaleUpperCase()
    : '';
  const counterStr = addZerosToANumber(numberCounter);

  return `${orgUnitNameSubString}${counterStr}${letterCounter}`;
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
        let counter =
            secondaryUICAttributeObj && secondaryUICAttributeObj.value
                ? secondaryUICAttributeObj.value.substring(3, 8)
                : '';
        counter = parseInt(counter, 10);
        return counter;
      })
  );

  return _.max(secondaryUICCounters) ? _.max(secondaryUICCounters) : 0;
}
function getLastTeiSecondaryUICLetterCounter(trackedEntityInstances) {
    const counters = _.flattenDeep(
        _.map(trackedEntityInstances || [], (tei) => {
            const secondaryUICAttributeObj = secondaryUICObj(tei);
            return secondaryUICAttributeObj && secondaryUICAttributeObj.value
                ? secondaryUICAttributeObj.value.substring(-1)
                : '';
        })
    );

    return counters && _.max(counters) ? _.max(counters) : 'A';
}

module.exports = {
  getSecondaryUIC,
  secondaryUICObj,
  getNumberCounterFromSecondaryUIC,
  getLastTeiSecondaryUICCounter,
    getLastTeiSecondaryUICLetterCounter
};

const constantsHelper = require('./constants.helper');
const constants = constantsHelper.constants;
const metadataConstants = constants.metadata;
const programTypes = constants.programTypes;

const _ = require('lodash');
function getPrimaryUIC(ancestorOrgUnitName, orgUnitName, numberCounter, type) {
  const ancestorNameSubString = ancestorOrgUnitName
    ? ancestorOrgUnitName.substring(0, 3).toLocaleUpperCase()
    : '';
  const orgUnitNameSubString = orgUnitName
    ? orgUnitName.substring(0, 3).toLocaleUpperCase()
    : '';
    const counterStr = addZerosToANumber(numberCounter);

    return `${ancestorNameSubString}${orgUnitNameSubString}${type}${counterStr}`
}
function addZerosToANumber(number) {
    if (number<=999999) { number = ("000000"+number).slice(-6); }
    return number;
  }

  function primaryUICObj(tei) {
    return tei && tei.attributes
      ? _.find(
          tei.attributes || [],
          (attributeItem) => attributeItem.attribute === metadataConstants.primaryUIC
        )
      : '';
  }
function getLastTeiPrimaryUICCounter(trackedEntityInstances) {
    const primaryUICCounters = _.flattenDeep(
        _.map(trackedEntityInstances || [], (tei) => {
            const primaryUICAttributeObj = primaryUICObj(tei);
            let counter =
                primaryUICAttributeObj && primaryUICAttributeObj.value
                    ? primaryUICAttributeObj.value.substring(
                    primaryUICAttributeObj.value.length - 6
                    )
                    : '';
            counter = parseInt(counter, 10);
            return counter;
            // return primaryUICAttributeObj && primaryUICAttributeObj.value ? primaryUICAttributeObj.value  : [];
        })
    );

    return _.max(primaryUICCounters) ? _.max(primaryUICCounters) : 0;
}
function getTeiPayloadWithOldPrimaryUIC(program, tei) {
    if(program) {
        if (
            program.type === programTypes.dreams
        ) {
            return [];
        } else if (
            program.type === programTypes.caregiver
        ) {
            return {...tei, hasOldPrimaryUIC: true };
        } else if( program.type === programTypes.ovc) {
            return {...tei, hasOldPrimaryUIC: true };
        }  else {
            return [];
        }

    }
    return [];
}
  

  module.exports = {
      getPrimaryUIC,
      primaryUICObj,
      getLastTeiPrimaryUICCounter,
      getTeiPayloadWithOldPrimaryUIC
  }

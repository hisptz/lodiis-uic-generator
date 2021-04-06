const _ = require('lodash');
const constantsHelper = require('./constants.helper');
const logsHelper = require('../helpers/logs.helper');
const constants = constantsHelper.constants;
const metadataConstants = constants.metadata;
const programTypes = constants.programTypes;

function getPrimaryUIC(
  ancestorOrgUnit,
  orgUnitCode,
  numberCounter,
  type,
  dateOfBirth,
  implementingPartner
) {
  const ancestorOrgUnitName = ancestorOrgUnit
    ? ancestorOrgUnit.replace(/\s/g, '')
    : '';

  const ancestorNameSubString = ancestorOrgUnitName
    ? ancestorOrgUnitName.substring(0, 3).toLocaleUpperCase()
    : '';
  const counterStr = addZerosToANumber(numberCounter);

  const dateOfBirthStr = getDateOfBirthString(dateOfBirth);

  const implementingPartnerStr =
    type === programTypes.caregiver || type === programTypes.ovc
      ? 'KB'
      : getImplementingPartnerString(implementingPartner);

  return `${dateOfBirthStr}${ancestorNameSubString}${orgUnitCode.toLocaleUpperCase()}${type}${counterStr}${implementingPartnerStr}`.trim();
}
function addZerosToANumber(number) {
  if (number <= 999999) {
    number = ('000000' + number).slice(-6);
  }
  return number;
}
function getImplementingPartnerString(implementingPartner) {
  return implementingPartner.split('-')[0].toLocaleUpperCase();
}
function getDateOfBirthString(dateOfBirth) {
  async function getDoubleDigitNumber(number) {
    try {
      return isNaN(number) ? '00' : number >= 10 ? `${number}` : `0${number}`;
    } catch(error) {
      await logsHelper.addLogs(
        'ERROR',
        error.toString(),
        'getDateOfBirthString'
      );
    }
    
    
  }

  const dateOfBirthObject = new Date(dateOfBirth || '');
  const date = dateOfBirthObject.getDate();
  const month = dateOfBirthObject.getMonth() + 1;
  const year = `${dateOfBirthObject.getFullYear()}`.slice(-2);

  return dateOfBirth != ''
    ? `${getDoubleDigitNumber(date)}${getDoubleDigitNumber(month)}${year}`.trim()
    : '';
}
function primaryUICObj(tei) {
  return tei && tei.attributes
    ? _.find(
        tei.attributes || [],
        (attributeItem) =>
          attributeItem.attribute === metadataConstants.primaryUIC
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
  // return _.max(primaryUICCounters) ? _.max(primaryUICCounters) : 0;
  return 0;
}
function getTeiPayloadWithOldPrimaryUIC(program, tei) {
  if (program) {
    if (program.type === programTypes.dreams) {
      return [];
    } else if (program.type === programTypes.caregiver) {
      return { ...tei, hasOldPrimaryUIC: true };
    } else if (program.type === programTypes.ovc) {
      return { ...tei, hasOldPrimaryUIC: true };
    } else {
      return [];
    }
  }
  return [];
}

module.exports = {
  getPrimaryUIC,
  primaryUICObj,
  getLastTeiPrimaryUICCounter,
  getTeiPayloadWithOldPrimaryUIC,
};

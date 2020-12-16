const constants = require('./constants.helper');
const primaryUICMetadataId = constants.constants.primaryUICMetadataId;
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
          (attributeItem) => attributeItem.attribute === primaryUICMetadataId
        )
      : '';
  }
  

  module.exports = {
      getPrimaryUIC,
      primaryUICObj
  }

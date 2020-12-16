const constants = require('../helpers/constants.helper');
const secondaryUICMetadataId = constants.constants.secondaryUICMetadataId;
function getSecondaryUIC(orgUnitName,numberCounter, letterCounter ) {
    const orgUnitNameSubString = orgUnitName ? orgUnitName.substring(0,3).toLocaleUpperCase() : '';
    const counterStr = addZerosToANumber(numberCounter); 

  return `${orgUnitNameSubString}${counterStr}${letterCounter}`
}
function addZerosToANumber(number) {
  if (number<=99999) { number = ("00000"+number).slice(-5); }
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

module.exports = {
  getSecondaryUIC,
  secondaryUICObj
}
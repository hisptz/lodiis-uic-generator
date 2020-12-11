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

  module.exports = {
      getPrimaryUIC
  }

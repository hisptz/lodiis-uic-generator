function getPrimaryUIC(ancestorOrgUnitName, orgUnitName, numberCounter, type) {
  const ancestorNameSubString = ancestorOrgUnitName
    ? ancestorOrgUnitName.substring(0, 3).toLocaleUpperCase()
    : '';
  const orgUnitNameSubString = orgUnitName
    ? orgUnitName.substring(0, 3).toLocaleUpperCase()
    : '';
    const counterStr = pad(numberCounter);

    return `${ancestorNameSubString}${orgUnitNameSubString}${counterStr}${type}`
}
function pad(number) {
    if (number<=99999) { number = ("00000"+number).slice(-5); }
    return number;
  }

  module.exports = {
      getPrimaryUIC
  }

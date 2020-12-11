function getSecondaryUIC(orgUnitName,numberCounter, letterCounter ) {
    const orgUnitNameSubString = orgUnitName ? orgUnitName.substring(0,3).toLocaleUpperCase() : '';
    const counterStr = addZerosToANumber(numberCounter); 

  return `${orgUnitNameSubString}${counterStr}${letterCounter}`
}
function addZerosToANumber(number) {
  if (number<=99999) { number = ("00000"+number).slice(-5); }
  return number;
}

module.exports = {
  getSecondaryUIC
}
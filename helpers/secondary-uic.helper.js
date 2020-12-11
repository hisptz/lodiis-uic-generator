function getSecondaryUIC(orgUnitName,numberCounter, letterCounter ) {
    const orgUnitNameSubString = orgUnitName ? orgUnitName.substring(0,3).toLocaleUpperCase() : '';
    const counterStr = pad(numberCounter); 

  return `${orgUnitNameSubString}${counterStr}${letterCounter}`
}
function pad(number) {
  if (number<=99999) { number = ("00000"+number).slice(-5); }
  return number;
}

module.exports = {
  getSecondaryUIC
}
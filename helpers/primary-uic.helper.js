const _ = require("lodash");
const constantsHelper = require("./constants.helper");
const logsHelper = require("../helpers/logs.helper");
const { programTypes } = require("../config/metadata-config");
const { constants } = constantsHelper;
const {
  primaryUICMetadataId,
  secondaryUICMetadataId,
  metadata: metadataConstants,
  implementingPartners,
} = constants;

async function getPrimaryUIC(
  ancestorOrgUnit,
  orgUnitCode,
  numberCounter,
  type,
  dateOfBirth,
  implementingPartner
) {
  const ancestorOrgUnitName = ancestorOrgUnit
    ? ancestorOrgUnit.replace(/\s/g, "")
    : "";

  const ancestorNameSubString = ancestorOrgUnitName
    ? ancestorOrgUnitName.substring(0, 3).toLocaleUpperCase().trim()
    : "";
  const counterStr = addZerosToANumber(numberCounter);

  const dateOfBirthStr = await getDateOfBirthString(dateOfBirth);

  const implementingPartnerStr =
    type === programTypes.caregiver || type === programTypes.ovc
      ? "KB"
      : getImplementingPartnerString(implementingPartner);

  return `${dateOfBirthStr}${ancestorNameSubString}${orgUnitCode
    .toLocaleUpperCase()
    .trim()}${type}${counterStr}${implementingPartnerStr}`.trim();
}

function addZerosToANumber(number) {
  if (number <= 999999) {
    number = ("000000" + number).slice(-6);
  }
  return number;
}
function getImplementingPartnerString(implementingPartner) {
  const implementingPartnerCode = _.find(
    implementingPartners,
    ({ code }) => code === implementingPartner
  );
  return implementingPartnerCode
    ? implementingPartnerCode.value
    : _.snakeCase(implementingPartner).split("_")[0].toLocaleUpperCase();
}

async function getDoubleDigitNumber(number) {
  try {
    const doubleDigitNUmber = isNaN(number)
      ? "00"
      : number >= 10
      ? `${number}`
      : `0${number}`;
    return doubleDigitNUmber;
  } catch (error) {
    await logsHelper.addLogs(
      "ERROR",
      error.message || error,
      "getDoubleDigitNumber"
    );
    return "00";
  }
}

async function getDateOfBirthString(dateOfBirth) {
  try {
    const dateOfBirthObject = new Date(dateOfBirth || "");
    const date = dateOfBirthObject.getDate();
    const month = dateOfBirthObject.getMonth() + 1;
    const year = `${dateOfBirthObject.getFullYear()}`.slice(-2);

    return dateOfBirth != ""
      ? `${await getDoubleDigitNumber(date)}${await getDoubleDigitNumber(
          month
        )}${year}`.trim()
      : "";
  } catch (error) {
    await logsHelper.addLogs("ERROR", error.message, "getDateOfBirthString");
    throw error;
  }
}
function primaryUICObj(tei) {
  return tei && tei.attributes
    ? _.find(
        tei.attributes || [],
        (attributeItem) =>
          attributeItem.attribute === metadataConstants.primaryUIC
      )
    : "";
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
          : "";
      counter = parseInt(counter, 10);
      return counter;
    })
  );
  return _.max(primaryUICCounters) ? _.max(primaryUICCounters) : 0;
}
function getTeiPayloadWithOldPrimaryUIC(program, tei) {
  const sanitizedTei = {
    ...tei,
    attributes: _.filter(
      tei.attributes || [],
      (teiAttribute) =>
        teiAttribute.attribute === primaryUICMetadataId ||
        teiAttribute.attribute === secondaryUICMetadataId
    ),
  };
  if (program) {
    if (
      [
        programTypes.caregiver,
        programTypes.dreams,
        program.type === programTypes.ovc,
      ].includes(program.type)
    ) {
      return { ...sanitizedTei, hasOldPrimaryUIC: true };
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

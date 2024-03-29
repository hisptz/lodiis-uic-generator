const teiHelper = require("../helpers/tracked-entity-instances.helper");
const orgUnitHelper = require("../helpers/organisational-units.helper");
const secondaryUICHelper = require("../helpers/secondary-uic.helper");
const primaryUICHelper = require("../helpers/primary-uic.helper");
const utilsHelper = require("../helpers/utils.helper");
const _ = require("lodash");
const logsHelper = require("../helpers/logs.helper");
const constantsHelper = require("../helpers/constants.helper");
const constants = constantsHelper.constants;
const {
  primaryUICMetadataId,
  metadata: metadataConstants,
  programs,
  programTypes,
  implementingPartnerMetadataId,
  secondaryUICMetadataId,
  dateOfBirthMetadataId,
} = constants;

async function getTrackedEntityPayloadsByOrgUnit(
  headers,
  serverUrl,
  orgUnit,
  startDate,
  endDate
) {
  try {
    let trackedEntityInstancesByOrgUnitObj = {};

    if (programs && programs.length) {
      try {
        for (const program of programs) {
          let trackedEntityInstances = await getTrackedEntityInstances(
            headers,
            serverUrl,
            orgUnit,
            program,
            startDate,
            endDate
          );
          const programId = program && program.id ? program.id : "";

          const trackedEntityInstancesWithPrimaryUICs =
            await getTeiWithPrimaryUIC(
              trackedEntityInstances,
              orgUnit,
              program
            );
          trackedEntityInstancesByOrgUnitObj = {
            ...trackedEntityInstancesByOrgUnitObj,
            [programId]: trackedEntityInstancesWithPrimaryUICs,
          };
        }
        return getFormattedTEIPayloadByProgramWithUIC(
          programs,
          orgUnit,
          trackedEntityInstancesByOrgUnitObj
        );
      } catch (error) {
        await logsHelper.addLogs(
          "ERROR",
          error.message || error,
          "getTrackedEntityPayloadsByOrgUnit"
        );
      }
    } else {
      return [];
    }
  } catch (error) {
    await logsHelper.addLogs(
      "ERROR",
      error.message || error,
      "getTrackedEntityPayloadsByOrgUnit"
    );
  }
}
async function getTrackedEntityInstances(
  headers,
  serverUrl,
  orgUnit,
  program,
  startDate,
  endDate
) {
  const orgUnitId = orgUnit && orgUnit.id ? orgUnit.id : "";
  const programId = program && program.id ? program.id : "";
  let allTrackedEntityInstances = [];
  if (programId && orgUnitId) {
    const trackedEntityInstances =
      await teiHelper.getTrackedEntityInstanceByProgramAndOrgUnit(
        headers,
        serverUrl,
        orgUnitId,
        programId,
        startDate,
        endDate
      );

    allTrackedEntityInstances = [...trackedEntityInstances];
  }
  allTrackedEntityInstances = teiHelper.sortTeiArrayByEnrollmentDate(
    allTrackedEntityInstances,
    programId
  );
  return allTrackedEntityInstances;
}

async function getFormattedTEIPayloadByProgramWithUIC(
  programs,
  orgUnit,
  orgUnitTeiObj
) {
  const mainPrograms = _.filter(programs || [], (prog) => !prog.isChild);
  let payloads = [];
  try {
    if (mainPrograms && mainPrograms.length) {
      for (const program of mainPrograms) {
        if (program && program.id && program.childProgram) {
          const teiPayloads = await getParentWithChildrenFormattedPayloads(
            orgUnitTeiObj,
            orgUnit,
            program
          );
          payloads = [...payloads, ...teiPayloads];
        } else if (program && program.id) {
          payloads =
            orgUnitTeiObj && orgUnitTeiObj[program.id]
              ? [...payloads, ...orgUnitTeiObj[program.id]]
              : [...payloads];
        } else {
          payloads = [...payloads];
        }
      }
    }
  } catch (error) {
    await logsHelper.addLogs(
      "ERROR",
      error.message || error,
      "getFormattedTEIPayloadByProgramWithUIC"
    );
  }

  return _.filter(payloads, (payload) => {
    const { hasOldPrimaryUIC } = payload;
    return !hasOldPrimaryUIC;
  });
}
async function getParentWithChildrenFormattedPayloads(
  orgUnitTeiObj,
  orgUnit,
  program
) {
  try {
    const parentTrackedEntityInstances =
      orgUnitTeiObj && program && program.id && orgUnitTeiObj[program.id]
        ? orgUnitTeiObj[program.id]
        : [];
    const childTrackedEntityInstances =
      orgUnitTeiObj && orgUnitTeiObj[program.childProgram.id]
        ? orgUnitTeiObj[program.childProgram.id]
        : [];

    const teiParentsWithItsChildren = await getTeiParentsWithItsChildren(
      parentTrackedEntityInstances,
      childTrackedEntityInstances
    );
    const trackedEntityInstancesWithSecondaryUIC =
      await getTrackedEntityInstancesWithSecondaryUIC(
        teiParentsWithItsChildren,
        orgUnit
      );

    return trackedEntityInstancesWithSecondaryUIC
      ? await teiHelper.separateTeiParentFromChildren(
          trackedEntityInstancesWithSecondaryUIC
        )
      : [];
  } catch (error) {
    await logsHelper.addLogs(
      "ERROR",
      error.message || error,
      "getParentWithChildrenFormattedPayloads"
    );
    return [];
  }
}
async function getTeiParentsWithItsChildren(
  parentTrackedEntityInstances,
  childTrackedEntityInstances
) {
  return await Promise.all(
    _.map(parentTrackedEntityInstances, async (parentTei) => {
      let children = [];
      const relationships =
        parentTei && parentTei.relationships ? parentTei.relationships : [];
      if (relationships && relationships.length) {
        for (const relationship of relationships) {
          const parentChildrenRelationship = await getChildParentRelationship(
            parentTei,
            relationship,
            childTrackedEntityInstances
          );
          const childOfGivenParent =
            parentChildrenRelationship && parentChildrenRelationship.children
              ? parentChildrenRelationship.children
              : [];
          children = [...children, ...childOfGivenParent];
        }
      }
      children = await teiHelper.sortTeiArrayByAge(
        children,
        metadataConstants.age
      );
      return { ...parentTei, children };
    })
  );
}
async function getChildParentRelationship(tei, relationship, children) {
  try {
    const teiId =
      tei && tei.trackedEntityInstance ? tei.trackedEntityInstance : "";
    const from = relationship && relationship.from ? relationship.from : null;
    const to = relationship && relationship.to ? relationship.to : null;
    const fromTei =
      from &&
      from.trackedEntityInstance &&
      from.trackedEntityInstance.trackedEntityInstance
        ? from.trackedEntityInstance.trackedEntityInstance
        : null;
    const toTei =
      to &&
      to.trackedEntityInstance &&
      to.trackedEntityInstance.trackedEntityInstance
        ? to.trackedEntityInstance.trackedEntityInstance
        : null;

    if (teiId && teiId === fromTei) {
      return { teiId, children: getChildOfGivenParent(toTei, children) };
    } else if (teiId && teiId === toTei) {
      return { teiId, children: getChildOfGivenParent(fromTei, children) };
    } else {
      return null;
    }
  } catch (error) {
    await logsHelper.addLogs(
      "ERROR",
      error.message || error,
      "getChildParentRelationship"
    );
    return null;
  }
}
function getChildOfGivenParent(teiId, children) {
  return _.filter(
    children || [],
    (childTei) => childTei.trackedEntityInstance === teiId
  );
}

async function getTrackedEntityInstancesWithSecondaryUIC(
  teiParentsWithItsChildren,
  orgUnit
) {
  let teiCounter = await secondaryUICHelper.getLastTeiSecondaryUICCounter(
    teiParentsWithItsChildren
  );

  return _.flattenDeep(
    await Promise.all(
      _.map(teiParentsWithItsChildren || [], async (teiItem) => {
        const attributes =
          teiItem && teiItem.attributes ? teiItem.attributes : [];

        const secondaryUICAttribute = teiHelper.getAttributeObjectByIdFromTEI(
          attributes,
          metadataConstants.secondaryUIC
        );
        if (secondaryUICAttribute && secondaryUICAttribute.value) {
          const existedTeiCounter =
            secondaryUICHelper.getNumberCounterFromSecondaryUIC(
              secondaryUICAttribute.value
            );
          const children = await getTeiChildrenWithSecondaryUIC(
            teiItem,
            existedTeiCounter,
            orgUnit
          );
          if (
            teiItem &&
            teiItem.hasOldPrimaryUIC &&
            secondaryUICAttribute &&
            secondaryUICAttribute.value
          ) {
            const childrenWithoutOldPrimaryUIC = _.flattenDeep(
              _.filter(children || [], (childItem) => {
                const childItemAttributes =
                  teiHelper.getAttributesFromTEI(childItem);
                return childItem &&
                  childItem.hasOldPrimaryUIC &&
                  teiHelper.getAttributeValueByIdFromTEI(
                    childItemAttributes,
                    metadataConstants.secondaryUIC
                  )
                  ? []
                  : childItem;
              })
            );

            return { ...teiItem, children: childrenWithoutOldPrimaryUIC };
          }
          return { ...teiItem, children };
        }
        teiCounter = teiCounter + 1;

        return await generateTrackedEntityInstancesUICs(
          teiItem,
          teiCounter,
          orgUnit,
          programTypes.caregiver
        );
      })
    )
  );
}
async function generateTrackedEntityInstancesUICs(
  tei,
  teiCounter,
  orgUnit,
  type,
  letterCount = ""
) {
  let newTei = {
    trackedEntityInstance: tei.trackedEntityInstance,
    orgUnit: tei.orgUnit,
    children: tei.children,
    attributes: _.filter(
      tei.attributes || [],
      (teiAttribute) =>
        _.indexOf(
          [secondaryUICMetadataId, primaryUICMetadataId],
          teiAttribute.attribute
        ) != -1
    ),
  };
  const orgUnitCode = orgUnitHelper.getOrgUnitCode(orgUnit);
  let attributes = newTei && newTei.attributes ? newTei.attributes : [];

  if (type === programTypes.caregiver) {
    const secondaryUIC = secondaryUICHelper.getSecondaryUIC(
      orgUnitCode,
      teiCounter,
      "A"
    );
    attributes = [
      ...attributes,
      { attribute: secondaryUICMetadataId, value: secondaryUIC },
    ];
    const updatedChildren = await getTeiChildrenWithSecondaryUIC(
      newTei,
      teiCounter,
      orgUnit
    );

    newTei = { ...newTei, attributes, children: updatedChildren };
    return newTei;
  } else if (type === programTypes.ovc) {
    const secondaryUIC = secondaryUICHelper.getSecondaryUIC(
      orgUnitCode,
      teiCounter,
      letterCount
    );
    attributes = [
      ...attributes,
      { attribute: secondaryUICMetadataId, value: secondaryUIC },
    ];
    newTei = { ...newTei, attributes };
    return newTei;
  }
}
async function getTeiChildrenWithSecondaryUIC(tei, teiParentCounter, orgUnit) {
  const updatedChildren = [];
  try {
    const children = tei && tei.children ? tei.children : [];
    let letterCounter =
      await secondaryUICHelper.getLastTeiSecondaryUICLetterCounter(children);
    if (children && children.length) {
      for (const child of children) {
        const childSecondaryUICAttribute =
          secondaryUICHelper.secondaryUICObj(child);
        letterCounter =
          childSecondaryUICAttribute && childSecondaryUICAttribute.value
            ? letterCounter
            : utilsHelper.incrementChar(letterCounter);
        const updatedChild =
          childSecondaryUICAttribute && childSecondaryUICAttribute.value
            ? child
            : await generateTrackedEntityInstancesUICs(
                child,
                teiParentCounter,
                orgUnit,
                programTypes.ovc,
                letterCounter
              );

        updatedChildren.push(updatedChild);
      }
    }
  } catch (error) {
    await logsHelper.addLogs(
      "ERROR",
      error.message || error,
      "getTeiChildrenWithSecondaryUIC"
    );
  }

  return updatedChildren;
}
async function getTeiWithPrimaryUIC(trackedEntityInstances, orgUnit, program) {
  try {
    let teiCounter = primaryUICHelper.getLastTeiPrimaryUICCounter(
      trackedEntityInstances
    );
    return _.flattenDeep(
      await Promise.all(
        _.map(trackedEntityInstances || [], async (tei) => {
          let attributes = tei && tei.attributes ? tei.attributes : [];
          const orgUnitCode = orgUnitHelper.getOrgUnitCode(orgUnit);
          const orgUnitLevel = orgUnitHelper.getOrgUnitLevel(orgUnit);
          const ancestorOrgUnitLevel = orgUnitLevel - 1;
          const ancestorOrgUnit = orgUnitHelper.getOrgUnitAncestorByLevel(
            orgUnit,
            ancestorOrgUnitLevel
          );
          const ancestorOrgUnitName =
            orgUnitHelper.getOrgUnitName(ancestorOrgUnit);
          const primaryUICAttribute = teiHelper.getAttributeValueByIdFromTEI(
            attributes,
            metadataConstants.primaryUIC
          );
          const dateOfBirth = teiHelper.getAttributeValueByIdFromTEI(
            attributes,
            dateOfBirthMetadataId
          );
          const implementingPartner = teiHelper.getAttributeValueByIdFromTEI(
            attributes,
            implementingPartnerMetadataId
          );
          const secondaryUIC = teiHelper.getAttributeValueByIdFromTEI(
            attributes,
            secondaryUICMetadataId
          );
          if (primaryUICAttribute) {
            return primaryUICHelper.getTeiPayloadWithOldPrimaryUIC(
              program,
              tei
            );
          }
          teiCounter = teiCounter + 1;
          const primaryUIC = await primaryUICHelper.getPrimaryUIC(
            ancestorOrgUnitName,
            orgUnitCode,
            teiCounter,
            program.type,
            dateOfBirth,
            implementingPartner
          );
          const filteredAttributes = [
            { attribute: primaryUICMetadataId, value: primaryUIC },
          ];

          if (secondaryUIC && secondaryUIC !== "") {
            filteredAttributes.push({
              attribute: secondaryUICMetadataId,
              value: secondaryUIC,
            });
          }
          return {
            trackedEntityInstance: tei.trackedEntityInstance || "",
            orgUnit: tei.orgUnit,
            relationships: tei.relationships,
            attributes: filteredAttributes,
          };
        })
      )
    );
  } catch (error) {
    await logsHelper.addLogs(
      "ERROR",
      error.message || error,
      "getTeiWithPrimaryUIC"
    );
  }
}

module.exports = {
  getTrackedEntityPayloadsByOrgUnit,
};

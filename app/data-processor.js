const constantsHelper = require('../helpers/constants.helper');
const constants = constantsHelper.constants;
const primaryUICMetadataId = constants.primaryUICMetadataId;
const secondaryUICMetadataId = constants.secondaryUICMetadataId;
const programs = constants.programs;
const programTypes = constants.programTypes;
const metadataConstants = constants.metadata;
const teiHelper = require('../helpers/tracked-entity-instances.helper');
const orgUnitHelper = require('../helpers/organisational-units.helper');
const secondaryUICHelper = require('../helpers/secondary-uic.helper');
const primaryUICHelper = require('../helpers/primary-uic.helper');
const utilsHelper = require('../helpers/utils.helper');
const _ = require('lodash');
const logsHelper = require('../helpers/logs.helper');

async function getTrackedEntityPayloadsByOrgUnit(headers, serverUrl, orgUnit, startDate, endDate) {
  try {
    let trackedEntityInstancesByOrgUnitObj = {};

    if (programs && programs.length) {
      for (const program of programs) {
        let trackedEntityInstances = await getTrackedEntityInstances(
          headers,
          serverUrl,
          orgUnit,
          program,
            startDate,
            endDate
        );

        const programId = program && program.id ? program.id : '';

        const trackedEntityInstancesWithPrimaryUICs = getTeiWithPrimaryUIC(
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
    } else {
      return [];
    }
  } catch (error) {
    console.log(error);
    await logsHelper.addLogs(
      'ERROR',
      JSON.stringify(error),
      'getTrackedEntityPayloadsByOrgUnit'
    );
  }
}
async function getTrackedEntityInstances(headers, serverUrl, orgUnit, program, startDate, endDate) {
  const orgUnitId = orgUnit && orgUnit.id ? orgUnit.id : '';
  const programId = program && program.id ? program.id : '';
  // const childProgramId = program && program.childProgram ? program.childProgram : '';
  let allTrackedEntityInstances = [];
  if (programId && orgUnitId) {
    const trackedEntityInstances = await teiHelper.getTrackedEntityInstanceByProgramAndOrgUnit(
      headers,
      serverUrl,
      orgUnitId,
      programId,
        startDate, endDate
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
  if (mainPrograms && mainPrograms.length) {
    for (const program of mainPrograms) {
      if (program && program.id && program.childProgram) {
        const teiPayloads = getParentWithChildrenFormattedPayloads(
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

  return payloads;
}
function getParentWithChildrenFormattedPayloads(
  orgUnitTeiObj,
  orgUnit,
  program
) {
  const parentTrackedEntityInstances =
    orgUnitTeiObj && program && program.id && orgUnitTeiObj[program.id]
      ? orgUnitTeiObj[program.id]
      : [];
  const childTrackedEntityInstances =
    orgUnitTeiObj && orgUnitTeiObj[program.childProgram.id]
      ? orgUnitTeiObj[program.childProgram.id]
      : [];

  const teiParentsWithItsChildren = getTeiParentsWithItsChildren(
    parentTrackedEntityInstances,
    childTrackedEntityInstances
  );
  const trackedEntityInstancesWithSecondaryUIC = getTrackedEntityInstancesWithSecondaryUIC(
    teiParentsWithItsChildren,
    orgUnit
  );

  return trackedEntityInstancesWithSecondaryUIC ? teiHelper.separateTeiParentFromChildren(
    trackedEntityInstancesWithSecondaryUIC
  ) : [];
}
function getTeiParentsWithItsChildren(
  parentTrackedEntityInstances,
  childTrackedEntityInstances
) {
  return _.map(parentTrackedEntityInstances, (parentTei) => {
    let children = [];
    const relationships =
      parentTei && parentTei.relationships ? parentTei.relationships : [];
    if (relationships && relationships.length) {
      for (const relationship of relationships) {
        const parentChildrenRelationship = getChildParentRelationship(
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
    children = teiHelper.sortTeiArrayByAge(children, metadataConstants.age);
    return { ...parentTei, children };
  });
}
function getChildParentRelationship(tei, relationship, children) {
  const teiId =
    tei && tei.trackedEntityInstance ? tei.trackedEntityInstance : '';
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
}
function getChildOfGivenParent(teiId, children) {
  return _.filter(
    children || [],
    (childTei) => childTei.trackedEntityInstance === teiId
  );
}

function getTrackedEntityInstancesWithSecondaryUIC(
  teiParentsWithItsChildren,
  orgUnit
) {
  let teiCounter = secondaryUICHelper.getLastTeiSecondaryUICCounter(
    teiParentsWithItsChildren
  );
  return _.flattenDeep( _.map(teiParentsWithItsChildren || [], (teiItem) => {
    const attributes = teiItem && teiItem.attributes ? teiItem.attributes : [];

    const secondaryUICAttribute = teiHelper.getAttributeObjectByIdFromTEI(
      attributes,
      metadataConstants.secondaryUIC
    );

    if (secondaryUICAttribute && secondaryUICAttribute.value) {
      const existedTeiCounter = secondaryUICHelper.getNumberCounterFromSecondaryUIC(
        secondaryUICAttribute.value
      );
      const children = getTeiChildrenWithSecondaryUIC(
        teiItem,
        existedTeiCounter,
        orgUnit
      );
      if(teiItem && teiItem.hasOldPrimaryUIC && secondaryUICAttribute && secondaryUICAttribute.value) {
        return [];
      }
      return { ...teiItem, children };
    }
    teiCounter = teiCounter + 1;

    return generateTrackedEntityInstancesUICs(
      teiItem,
      teiCounter,
      orgUnit,
      programTypes.caregiver
    );
  }));
}
function generateTrackedEntityInstancesUICs(
  tei,
  teiCounter,
  orgUnit,
  type,
  letterCount = ''
) {
  let newTei = tei;
  const orgUnitName = orgUnitHelper.getOrgUnitName(orgUnit);
  let attributes = newTei && newTei.attributes ? newTei.attributes : [];

  if (type === programTypes.caregiver) {
    const secondaryUIC = secondaryUICHelper.getSecondaryUIC(
      orgUnitName,
      teiCounter,
      'A'
    );
    attributes = [
      ...attributes,
      { attribute: secondaryUICMetadataId, value: secondaryUIC },
    ];
    const updatedChildren = getTeiChildrenWithSecondaryUIC(
      newTei,
      teiCounter,
      orgUnit
    );

    newTei =  { ...newTei, attributes, children: updatedChildren };
    return newTei;
  } else if (type === programTypes.ovc) {
    const secondaryUIC = secondaryUICHelper.getSecondaryUIC(
      orgUnitName,
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
function getTeiChildrenWithSecondaryUIC(tei, teiParentCounter, orgUnit) {
  const updatedChildren = [];
  const children = tei && tei.children ? tei.children : [];
  let letterCounter = secondaryUICHelper.getLastTeiSecondaryUICLetterCounter(
    children
  );

  if (children && children.length) {
    for (const child of children) {
      const childSecondaryUICAttribute = secondaryUICHelper.secondaryUICObj(
        child
      );
      letterCounter =
        childSecondaryUICAttribute && childSecondaryUICAttribute.value
          ? letterCounter
          : utilsHelper.incrementChar(letterCounter);
      const updatedChild =
        childSecondaryUICAttribute && childSecondaryUICAttribute.value
          ? child
          : generateTrackedEntityInstancesUICs(
              child,
              teiParentCounter,
              orgUnit,
              programTypes.ovc,
              letterCounter
            );
      updatedChildren.push(updatedChild);
    }
  }
  return updatedChildren;
}
function getTeiWithPrimaryUIC(trackedEntityInstances, orgUnit, program) {
  let teiCounter = primaryUICHelper.getLastTeiPrimaryUICCounter(
    trackedEntityInstances
  );
  return _.flattenDeep(
    _.map(trackedEntityInstances || [], (tei) => {
      let attributes = tei && tei.attributes ? tei.attributes : [];
      const orgUnitName = orgUnitHelper.getOrgUnitName(orgUnit);
      const orgUnitLevel = orgUnitHelper.getOrgUnitLevel(orgUnit);
      const ancestorOrgUnitLevel = orgUnitLevel - 1;
      const ancestorOrgUnit = orgUnitHelper.getOrgUnitAncestorByLevel(
        orgUnit,
        ancestorOrgUnitLevel
      );
      const ancestorOrgUnitName = orgUnitHelper.getOrgUnitName(ancestorOrgUnit);
      const primaryUICAttribute = teiHelper.getAttributeValueByIdFromTEI(
        attributes,
        metadataConstants.primaryUIC
      );
      if (primaryUICAttribute) {
        return primaryUICHelper.getTeiPayloadWithOldPrimaryUIC(program, tei);
      }
      teiCounter = teiCounter + 1;
      const primaryUIC = primaryUICHelper.getPrimaryUIC(
        ancestorOrgUnitName,
        orgUnitName,
        teiCounter,
        program.type
      );
      attributes = [
        ...attributes,
        { attribute: primaryUICMetadataId, value: primaryUIC },
      ];

      return { ...tei, attributes };
    })
  );
}

module.exports = {
  getTrackedEntityPayloadsByOrgUnit,
};

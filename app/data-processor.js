const constants = require("../helpers/constants.helper");
const primaryUICMetadataId = constants.constants.primaryUICMetadataId;
const secondaryUICMetadataId = constants.constants.secondaryUICMetadataId;
const programs = constants.constants.programs;
const programTypes = constants.constants.programTypes;
const teiHelper = require("../helpers/tracked-entity-instances.helper");
const secondaryUICHelper = require("../helpers/secondary-uic.helper");
const primaryUICHelper = require("../helpers/primary-uic.helper");
const utilsHelper = require("../helpers/utils.helper");
const _ = require("lodash");
const logsHelper = require("../helpers/logs.helper");

async function getTrackedEntityPayloadsByOrgUnit(headers, serverUrl, orgUnit) {
  try {
    let trackedEntityInstancesByOrgUnitObj = {};

    if (programs && programs.length) {
      for (const program of programs) {
        let trackedEntintyInstances = await getTrackedEntityInstances(
          headers,
          serverUrl,
          orgUnit,
          program
        );

        const programId = program && program.id ? program.id : "";

        const teisWithprimaryUICs = getTeiWithPrimaryUIC(
          trackedEntintyInstances,
          orgUnit,
          program
        );
        trackedEntityInstancesByOrgUnitObj = {
          ...trackedEntityInstancesByOrgUnitObj,
          [programId]: teisWithprimaryUICs,
        };
      }
      const formattedPayloads = getFormattedTEIPayloadByProgramWithUIC(
        programs,
        orgUnit,
        trackedEntityInstancesByOrgUnitObj
      );

      return formattedPayloads;
    } else {
      return [];
    }
  } catch (error) {
    console.log(error);
    await logsHelper.addLogs(
      "ERROR",
      JSON.stringify(error),
      "getTrackedEntityPayloadsByOrgUnit"
    );
  }
}
async function getTrackedEntityInstances(headers, serverUrl, orgUnit, program) {
  const orgUnitId = orgUnit && orgUnit.id ? orgUnit.id : "";
  const programId = program && program.id ? program.id : "";
  // const childProgramId = program && program.childProgram ? program.childProgram : '';
  let allTrackedEntintyInstances = [];
  if (programId && orgUnitId) {
    const trackedEntintyInstances = await teiHelper.getTrackedEntityInstanceByProgramAndOrgUnit(
      headers,
      serverUrl,
      orgUnitId,
      programId
    );

    allTrackedEntintyInstances = [...trackedEntintyInstances];
  }
  allTrackedEntintyInstances = _.sortBy(
    allTrackedEntintyInstances || [],
    (instance) => {
      const enrollment = _.find(
        instance.enrollments,
        (enrolmentItem) => enrolmentItem.program === programId
      );
      return new Date(enrollment.enrollmentDate);
    }
  );
  return allTrackedEntintyInstances;
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
        const parentTeis =
          orgUnitTeiObj && orgUnitTeiObj[program.id]
            ? orgUnitTeiObj[program.id]
            : [];
        const childTeis =
          orgUnitTeiObj && orgUnitTeiObj[program.childProgram.id]
            ? orgUnitTeiObj[program.childProgram.id]
            : [];

        const teiParentsWithItsChildren = getTeiParentsItsChildren(
          parentTeis,
          childTeis
        );
        const teisWithSecondaryUIC = getTeisWithSecondaryUIC(
          teiParentsWithItsChildren,
          orgUnit
        );

        const teiPayloads = concatinateTeiWithChildren(teisWithSecondaryUIC);

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
function getTeiParentsItsChildren(parentTeis, childTeis) {
  return _.map(parentTeis, (parentTei) => {
    let children = [];
    const relationships =
      parentTei && parentTei.relationships ? parentTei.relationships : [];
    for (const relationship of relationships) {
      const to = relationship && relationship.to ? relationship.to : null;
      const trackedEntityInstance =
        to &&
        to.trackedEntityInstance &&
        to.trackedEntityInstance.trackedEntityInstance
          ? to.trackedEntityInstance.trackedEntityInstance
          : null;
      const childOfGivenParent = _.filter(
        childTeis || [],
        (childTei) => childTei.trackedEntityInstance === trackedEntityInstance
      );

      children = [...children, ...childOfGivenParent];
    }
    children =
      children && children.length
        ? _.sortBy(children || [], (child) => {
            const childAgeAttribute = _.find(
              child.attributes || [],
              (attributeItem) =>
                attributeItem.attribute === constants.constants.ageMetadataId
            );
            return childAgeAttribute && childAgeAttribute.value
              ? parseInt(childAgeAttribute.value, 10)
              : 0;
          }).reverse()
        : [];
    return { ...parentTei, children };
  });
}

function getTeisWithSecondaryUIC(teiParentsWithItsChildren, orgUnit) {
  const teiLastCounter = getLastTeiSecondaryUICCounter(
    teiParentsWithItsChildren
  );
  let teiCounter = teiLastCounter;
  //  const teisToBeUpdated = _.filter(teiParentsWithItsChildren || [], tei => tei && _.filter(tei.attributes || [], attrib => attrib &&))
  return _.map(teiParentsWithItsChildren || [], (teiItem, index) => {
    const attributes = teiItem && teiItem.attributes ? teiItem.attributes : [];

    const secondaryUICAttribute = _.find(
      attributes || [],
      (attributeItem) =>
        attributeItem.attribute === constants.constants.secondaryUICMetadataId
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
      return { ...teiItem, children };
    }
    teiCounter = teiCounter + 1;
    const teiWithUICs = generateTeisUICs(
      teiItem,
      teiCounter,
      orgUnit,
      programTypes.caregiver
    );
    return teiWithUICs;
  });
}
function generateTeisUICs(tei, teiCounter, orgUnit, type, letterCount = "") {
  let newTei = tei;

  const orgUnitName = orgUnit && orgUnit.name ? orgUnit.name : "";

  if (type === programTypes.caregiver) {
    const secondaryUIC = secondaryUICHelper.getSecondaryUIC(
      orgUnitName,
      teiCounter,
      "A"
    );
    let attributes = newTei && newTei.attributes ? newTei.attributes : [];

    attributes = [
      ...attributes,
      { attribute: secondaryUICMetadataId, value: secondaryUIC },
    ];
    const updatedChildren = getTeiChildrenWithSecondaryUIC(
      newTei,
      teiCounter,
      orgUnit
    );

    newTei = { ...newTei, attributes, children: updatedChildren };
    return newTei;
  } else if (type === programTypes.ovc) {
    const secondaryUIC = secondaryUICHelper.getSecondaryUIC(
      orgUnitName,
      teiCounter,
      letterCount
    );
    let attributes = newTei && newTei.attributes ? newTei.attributes : [];
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
  const lastLetterCounter = getLastTeiSecondaryUICLetterCounter(children);
  let letterCounter = lastLetterCounter;

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
          : generateTeisUICs(
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
function getTeiWithPrimaryUIC(teis, orgUnit, program) {
  const lastTeiCounter = getLastTeiPrimaryUICCounter(teis);

  let teiCounter = lastTeiCounter;
  return _.flatMapDeep(
    _.map(teis || [], (tei, index) => {
      let newTei = { ...tei };
      let attributes = newTei && newTei.attributes ? newTei.attributes : [];
      const orgUnitName = orgUnit && orgUnit.name ? orgUnit.name : "";
      const orgUnitLevel = orgUnit && orgUnit.level ? orgUnit.level : -1;
      const ancestorOrgUnitLevel = orgUnitLevel - 1;
      const ancenstorOrgUnit =
        orgUnit && orgUnit.level && orgUnit.ancestors
          ? getAncestorOrgUnit(orgUnit.ancestors, ancestorOrgUnitLevel)
          : null;

      const ancenstorOrgUnitName =
        ancenstorOrgUnit && ancenstorOrgUnit.name ? ancenstorOrgUnit.name : "";
      const primaryUICAttribute = _.find(
        attributes || [],
        (attributeItem) => attributeItem.attribute === primaryUICMetadataId
      );
      if (
        primaryUICAttribute &&
        primaryUICAttribute.value &&
        program &&
        program.type === programTypes.dreams
      ) {
        return [];
      } else if (
        (primaryUICAttribute &&
          primaryUICAttribute.value &&
          program &&
          program.type === programTypes.caregiver) ||
        program.type === programTypes.ovc
      ) {
        return tei;
      }
      teiCounter = teiCounter + 1;
      const primaryUIC = primaryUICHelper.getPrimaryUIC(
        ancenstorOrgUnitName,
        orgUnitName,
        teiCounter,
        program.type
      );
      attributes =
        primaryUICAttribute && primaryUICAttribute.value
          ? [...attributes]
          : [
              ...attributes,
              { attribute: primaryUICMetadataId, value: primaryUIC },
            ];

      return { ...tei, attributes };
    })
  );
}
function getLastTeiPrimaryUICCounter(teis) {
  const primaryUICCounters = _.flattenDeep(
    _.map(teis || [], (tei) => {
      const primaryUICAttributeObj = primaryUICHelper.primaryUICObj(tei);
      let counter =
        primaryUICAttributeObj && primaryUICAttributeObj.value
          ? primaryUICAttributeObj.value.substring(
              primaryUICAttributeObj.value.length - 6
            )
          : "";
      counter = parseInt(counter, 10);
      return counter;
      // return primaryUICAttributeObj && primaryUICAttributeObj.value ? primaryUICAttributeObj.value  : [];
    })
  );

  return _.max(primaryUICCounters) ? _.max(primaryUICCounters) : 0;
}
function getLastTeiSecondaryUICCounter(teis) {
  const secondaryUICCounters = _.flattenDeep(
    _.map(teis || [], (tei) => {
      const secondaryUICAttributeObj = secondaryUICHelper.secondaryUICObj(tei);
      let counter =
        secondaryUICAttributeObj && secondaryUICAttributeObj.value
          ? secondaryUICAttributeObj.value.substring(3, 8)
          : "";
      counter = parseInt(counter, 10);
      return counter;
      // return primaryUICAttributeObj && primaryUICAttributeObj.value ? primaryUICAttributeObj.value  : [];
    })
  );

  return _.max(secondaryUICCounters) ? _.max(secondaryUICCounters) : 0;
}
function getLastTeiSecondaryUICLetterCounter(teis) {
  const counters = _.flattenDeep(
    _.map(teis || [], (tei) => {
      const secondaryUICAttributeObj = secondaryUICHelper.secondaryUICObj(tei);
      let counter =
        secondaryUICAttributeObj && secondaryUICAttributeObj.value
          ? secondaryUICAttributeObj.value.substring(-1)
          : "";
      // counter = parseInt(counter, 10);
      return counter;
      // return primaryUICAttributeObj && primaryUICAttributeObj.value ? primaryUICAttributeObj.value  : [];
    })
  );

  return _.max(counters) ? _.max(counters) : "A";
}
function getAncestorOrgUnit(ancestors, level) {
  return _.find(ancestors || [], (ancestor) => ancestor.level === level);
}
function concatinateTeiWithChildren(teis) {
  let childrenTeiPayloads = [];
  const parentTeiPayloads = _.map(teis || [], (tei) => {
    childrenTeiPayloads =
      tei && tei.children
        ? [...childrenTeiPayloads, ...tei.children]
        : [...childrenTeiPayloads];
    delete tei.children;
    return tei;
  });
  teiPayloads = childrenTeiPayloads.concat(parentTeiPayloads);
  return teiPayloads;
}
module.exports = {
  getTrackedEntityPayloadsByOrgUnit,
};

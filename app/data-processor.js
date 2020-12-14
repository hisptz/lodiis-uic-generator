const constants = require('../helpers/constants.helper');
const primaryUICMetadataId = constants.constants.primaryUICMetadataId;
const secondaryUICMetadataId = constants.constants.secondaryUICMetadataId;
const programs = constants.constants.programs;
const programTypes = constants.constants.programTypes;
const teiHelper = require('../helpers/tracked-entity-instances.helper');
const secondaryUICHelper = require('../helpers/secondary-uic.helper');
const primaryUICHelper = require('../helpers/primary-uic.helper');
const utilsHelper = require('../helpers/utils.helper');
const _ = require('lodash');

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

        const programId = program && program.id ? program.id : '';

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
    await logsHelper.addLogs(
      'ERROR',
      JSON.stringify(error),
      'getTrackedEntityPayloadsByOrgUnit'
    );
  }
}
async function getTrackedEntityInstances(headers, serverUrl, orgUnit, program) {
  const orgUnitId = orgUnit && orgUnit.id ? orgUnit.id : '';
  const programId = program && program.id ? program.id : '';
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
    return { ...parentTei, children };
  });
}

function getTeisWithSecondaryUIC(teiParentsWithItsChildren, orgUnit) {
  //  const teisToBeUpdated = _.filter(teiParentsWithItsChildren || [], tei => tei && _.filter(tei.attributes || [], attrib => attrib &&))
  return _.map(teiParentsWithItsChildren || [], (teiItem, index) => {
    const attributes = teiItem && teiItem.attributes ? teiItem.attributes : [];

    let teiCounter = index + 1;
    const secondaryUICAttribute = _.find(
      attributes || [],
      (attributeItem) =>
        attributeItem.attribute === constants.constants.secondaryUICMetadataId
    );
    teiCounter = secondaryUICAttribute ? teiCounter + 1 : teiCounter;
    const teiWithUICs = generateTeisUICs(
      teiItem,
      teiCounter,
      orgUnit,
      programTypes.caregiver
    );
    return teiWithUICs;
  });
}
function generateTeisUICs(tei, teiCounter, orgUnit, type, letterCount = '') {
  let newTei = tei;

  const orgUnitName = tei && tei.orgUnit ? tei.orgUnit : '';

  if (type === programTypes.caregiver) {
    const secondaryUIC = secondaryUICHelper.getSecondaryUIC(
      orgUnitName,
      teiCounter,
      'A'
    );
    let attributes = newTei && newTei.attributes ? newTei.attributes : [];
    const secondaryUIVAttribute = _.find(
      attributes || [],
      (attributeItem) => attributeItem.attribute === secondaryUICMetadataId
    );
    attributes = [
      ...attributes,
      { attribute: secondaryUICMetadataId, value: secondaryUIC },
    ];
    const children = newTei && newTei.children ? newTei.children : [];
    const updatedChildren = [];
    let letterCounter = 'A';
    if (children && children.length) {
      for (const child of children) {
        letterCounter = utilsHelper.incrementChar(letterCounter);
        const updatedChild = generateTeisUICs(
          child,
          teiCounter,
          orgUnit,
          programTypes.ovc,
          letterCounter
        );
        updatedChildren.push(updatedChild);
      }
    }

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
function getTeiWithPrimaryUIC(teis, orgUnit, program) {
  return _.flatMapDeep(
    _.map(teis || [], (tei, index) => {
      let teiCounter = index + 1;
      let newTei = { ...tei };
      let attributes = newTei && newTei.attributes ? newTei.attributes : [];
      const orgUnitName = tei && tei.orgUnit ? tei.orgUnit : '';
      const orgUnitLevel = orgUnit && orgUnit.level ? orgUnit.level : -1;
      const ancestorOrgUnitLevel = orgUnitLevel - 1;
      const ancenstorOrgUnit =
        orgUnit && orgUnit.level && orgUnit.ancestors
          ? getAncestorOrgUnit(orgUnit.ancestors, ancestorOrgUnitLevel)
          : null;

      const ancenstorOrgUnitName =
        ancenstorOrgUnit && ancenstorOrgUnit.name ? ancenstorOrgUnit.name : '';
      const primaryUICAttribute = _.find(
        attributes || [],
        (attributeItem) => attributeItem.attribute === primaryUICMetadataId
      );
      if (primaryUICAttribute) {
        teiCounter = index + 1;
        return tei;
      }
      teiCounter = index + 1;
      const primaryUIC = primaryUICHelper.getPrimaryUIC(
        ancenstorOrgUnitName,
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
function getAncestorOrgUnit(ancestors, level) {
  return _.find(ancestors || [], (ancestor) => ancestor.level === level);
}
function concatinateTeiWithChildren(teis) {
  let childrenTeiPayloads = [];
  // if (teis && teis.length) {
  //   for (const tei of teis) {
  //     if (tei && tei.children) {
  //       const teiChildren = [...tei.children];
  //       children = [...children, ...teiChildren];
  //       delete tei.children;
  //       newTeis = [...newTeis,  tei];
  //     }

  //   }
  //   return newTeis.concat(children);
  // }
  // return teis;
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

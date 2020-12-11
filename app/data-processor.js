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
        console.log(JSON.stringify(teisWithprimaryUICs));
        trackedEntityInstancesByOrgUnitObj = {
          ...trackedEntityInstancesByOrgUnitObj,
          [programId]: trackedEntintyInstances,
        };

        //teis = [...teis, ...trackedEntintyInstances];
      }
      getFormattedTEIPayloadByProgramWithUIC(
        programs,
        orgUnit,
        trackedEntityInstancesByOrgUnitObj
      );
      // console.log(JSON.stringify(trackedEntityInstancesByOrgUnitObj));
    } else {
      console.log('Programs are not defined');
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
      return new Date(instance.created);
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
        const data = getTeisWithSecondaryAndPrimaryUIC(
          teiParentsWithItsChildren,
          orgUnit
        );
        // console.log(JSON.stringify(data));
      }
    }
  }
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

function getTeisWithSecondaryAndPrimaryUIC(teiParentsWithItsChildren, orgUnit) {
  //  const teisToBeUpdated = _.filter(teiParentsWithItsChildren || [], tei => tei && _.filter(tei.attributes || [], attrib => attrib &&))
  return _.map(teiParentsWithItsChildren || [], (teiItem, index) => {
    const attributes = teiItem && teiItem.attributes ? teiItem.attributes : [];
    const primaryUICAttribute = _.filter(
      attributes || [],
      (attributeId) => attributeId === constants.constants.primaryUICMetadataId
    );
    const secondaryUICAttribute = _.filter(
      attributes || [],
      (attributeId) =>
        attributeId === constants.constants.secondaryUICMetadataId
    );
    const teiCounter = index + 1;
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
  const orgUnitLevel = orgUnit && orgUnit.level ? orgUnit.level : -1;
  const ancestorOrgUnitLevel = orgUnitLevel - 1;
  const ancenstorOrgUnit =
    orgUnit && orgUnit.level && orgUnit.ancestors
      ? getAncestorOrgUnit(orgUnit.ancestors, ancestorOrgUnitLevel)
      : null;

  const ancenstorOrgUnitName =
    ancenstorOrgUnit && ancenstorOrgUnit.name ? ancenstorOrgUnit.name : '';

  if (type === programTypes.caregiver) {
    const secondaryUIC = secondaryUICHelper.getSecondaryUIC(
      orgUnitName,
      teiCounter,
      'A'
    );
    const primaryUIC = primaryUICHelper.getPrimaryUIC(
      ancenstorOrgUnitName,
      orgUnitName,
      teiCounter,
      programTypes.caregiver
    );
    let attributes = newTei && newTei.attributes ? newTei.attributes : [];
    attributes = [
      ...attributes,
      { attribute: primaryUICMetadataId, value: primaryUIC },
      { attribute: secondaryUICMetadataId, value: secondaryUIC },
    ];
    const children = newTei && newTei.children ? newTei.children : [];
    const updatedChildren = [];
    let letterCounter = 'A';
    if (children && children.length) {
      for (const child of children) {
        letterCounter = utilsHelper.incrementChar(letterCounter);
        const updatedChild = generateTeisUICs(
          tei,
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
    const primaryUIC = primaryUICHelper.getPrimaryUIC(
      ancenstorOrgUnitName,
      orgUnitName,
      teiCounter,
      programTypes.ovc
    );
    let attributes = newTei && newTei.attributes ? newTei.attributes : [];
    attributes = [
      ...attributes,
      { attribute: primaryUICMetadataId, value: primaryUIC },
      { attribute: secondaryUICMetadataId, value: secondaryUIC },
    ];
    newTei = { ...newTei, attributes };
    return newTei;
  }
}
function getTeiWithPrimaryUIC(teis, orgUnit, program) {
  return _.flatMapDeep(
    _.map(teis || [], (tei, index) => {
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
      primaryUICAttribute = _.find(
        attributes || [],
        (attributeItem) => attributeItem.attribute === primaryUICMetadataId
      );
      if (primaryUICAttribute) {
        return tei;
      }
      const teiCounter = index + 1;
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
module.exports = {
  getTrackedEntityPayloadsByOrgUnit,
};

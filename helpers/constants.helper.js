const metadataConfig = require("../config/metadata-config");
const { metadata, programs, programTypes } = metadataConfig;
const commands = {
  actions: {
    generate: {
      name: "generate",
      indexes: {
        fromIndex: 3,
        startDateIndex: 4,
        toIndex: 5,
        endDateIndex: 6,
      },
    },
    update: {
      name: "update",
      indexes: {
        statusIndex: 3,
        statusOptionIndex: 4,
      },
    },
    auto: {
      name: "auto",
      indexes: {},
    },
  },
  periods: {
    from: "from",
    to: "to",
  },
  indexes: {
    actionIndex: 2,
  },
};
const appStatusOptions = {
  running: "RUNNING",
  stopped: "STOPPED",
  underMaintenance: "UNDER_MAINTENANCE",
  unknown: "UNKNOWN",
  started: "STARTED",
};
const defaultStatusData = {
  appStatus: appStatusOptions.started,
  timeStarted: new Date(),
};
const appStatus = {
  appStatusOptions: appStatusOptions,
  defaultStatusData: defaultStatusData,
};

const requestResponse = {
  summary: {
    columns: [
      {
        isAttribute: true,
        name: "firstname",
      },
      {
        isAttribute: true,
        name: "surname",
      },
      {
        isAttribute: true,
        name: "primaryUIC",
      },
      {
        isAttribute: true,
        name: "secondaryUIC",
      },
      {
        isAttribute: false,
        name: "trackedEntityInstance",
      },
      {
        isAttribute: false,
        name: "orgUnit",
      },
      {
        isAttribute: false,
        name: "status",
      },
    ],
  },
};

const constants = {
  orgUnitLevelThree: 3,
  programs: programs,
  programTypes: programTypes,
  primaryUICMetadataId: "fTSAY18LgCF",
  secondaryUICMetadataId: "eIU7KMx4Tu3",
  implementingPartnerMetadataId: "klLkGxy328c",
  dateOfBirthMetadataId: "qZP982qpSPS",
  metadata: metadata,
  requestResponse: requestResponse,
  commands: commands,
  ageMetadataId: "ls9hlz2tyol",
  appStatus: appStatus,
};

module.exports = {
  constants,
  programTypes,
};

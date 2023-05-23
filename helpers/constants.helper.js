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

const implementingPartners = [
  {
    code: "Super user",
    value: "",
  },
  {
    code: "PSI",
    value: "PSI",
  },
  {
    code: "EGPAF",
    value: "EGPAF",
  },
  {
    code: "KB-Case Management",
    value: "KB",
  },
  {
    code: "Paralegal",
    value: "KB",
  },
  {
    code: "KB-AGYW/DREAMS",
    value: "KB",
  },
  {
    code: "EDUCATION",
    value: "KB",
  },
  {
    code: "CLO",
    value: "CLO",
  },
  {
    code: "CoHIP SEC",
    value: "CoHIP",
  },
  {
    code: "M2M",
    value: "M2M",
  },
];

const constants = {
  ageMetadataId: "ls9hlz2tyol",
  primaryUICMetadataId: "fTSAY18LgCF",
  secondaryUICMetadataId: "eIU7KMx4Tu3",
  implementingPartnerMetadataId: "klLkGxy328c",
  dateOfBirthMetadataId: "qZP982qpSPS",
  orgUnitLevelThree: 3,
  programs,
  programTypes,
  metadata,
  requestResponse,
  commands,
  appStatus,
  implementingPartners,
};

module.exports = {
  constants,
};

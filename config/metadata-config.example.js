const programTypes = {
  caregiver: "CG",
  ovc: "OVC",
  dreams: "DRM",
  bursary: "BUR",
  lbse: "LB",
};

const metadata = {
  firstname: "<firstname_metadata_id>",
  surname: "<surname_metadata_id>",
  primaryUIC: "<primaryUIC_metadata_id>",
  secondaryUIC: "<secondaryUIC_metadata_id>",
  age: "<age_metadata_id>",
};

const programs = [
  {
    id: "<program-id>",
    type: "<program-type-as-referred-above>", // programTypes.bursary,
    isChild: "<true_if_it_is_child_and_false_if_not>",
  },
  {
    id: "<program-id>",
    childProgram: {
      id: "<id_of_program_with_child_with_this_program>", //Example: ovc
      type: "<type_of_child_program>", // programTypes.ovc,
    },
    type: "<type_of_program>", // programTypes.caregiver,
  },
  {
    id: "<program-id>",
    type: "<type_of_program>", // programTypes.ovc,
    isChild: "<true_if_it_is_child_and_false_if_not>",
  },
];

module.exports = {
  metadata,
  programs,
  programTypes,
};

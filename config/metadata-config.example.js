const constants = require('../helpers/constants.helper');
const programTypes = constants.programTypes;
const metadata = {
    firstname: 'firstname_metadata_id',
    surname: 'surname_metadata_id',
    primaryUIC: 'primaryUIC_metadata_id',
    secondaryUIC: 'secondaryUIC_metadata_id',
      age: 'age_metadata_id',
  };

  const programs = [
    {
      id: 'program_id', // Example: Caregiver
      childProgram: {
        id: 'id_of_program_with_child_with_this_program', //Example: ovc
        type: 'type_of_child_program',
      },
      type: 'type_of_program',
    },
    {
      id: 'program_id',
      type: 'type_of_program',
      isChild: 'true_if_it_is_child_and_false_if_not',
    },
    {
      id: 'program_id',
      type: 'type_of_program',
    },
  ];

  module.exports = {
    metadata,
    programs
}
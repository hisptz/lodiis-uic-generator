const programTypes = {
    caregiver: 'CR',
    ovc: 'OVC',
    dreams: 'DREAMS'
}
const programs = [
    {
        id: 'BNsDaCclOiu',
        childProgram: {
            id: 'em38qztTI8s',
            type: programTypes.ovc
        },
        type: programTypes.caregiver
       
    },
    {
        id: 'em38qztTI8s',
        type: programTypes.ovc,
        isChild: true
    },
    {
        id: 'hOEIHJDrrvz',
        type: programTypes.dreams
    }
    
]

const constants = {
    orgUnitLevelThree: 3,
    programs: programs,
    programTypes: programTypes,
    primaryUICMetadataId: 'fTSAY18LgCF',
    secondaryUICMetadataId: 'eIU7KMx4Tu3'
}

module.exports = {
    constants
}
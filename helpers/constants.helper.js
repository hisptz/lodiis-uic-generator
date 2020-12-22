const programTypes = {
    caregiver: 'CG',
    ovc: 'OVC',
    dreams: 'DRM'
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
const metadata = {
    firstname: 'WTZ7GLTrE8Q',
    surname: 'rSP9c21JsfC'
}

const constants = {
    orgUnitLevelThree: 3,
    programs: programs,
    programTypes: programTypes,
    primaryUICMetadataId: 'fTSAY18LgCF',
    secondaryUICMetadataId: 'eIU7KMx4Tu3',
    metadata: metadata,
    // primaryUICMetadataId: 'Lo44pBpt230',
    // secondaryUICMetadataId: 'I5gM3wN4Vsw',
    ageMetadataId: 'ls9hlz2tyol'
}

module.exports = {
    constants
}
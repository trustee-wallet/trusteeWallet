/**
 * @version 0.43
 */
const INITIAL_STATE = {
    config: {}
}

const qrCodeScannerStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_CONFIG':
            return {
                ...state,
                config: action.config
            }
        default:
            return state
    }
}

export default qrCodeScannerStoreReducer

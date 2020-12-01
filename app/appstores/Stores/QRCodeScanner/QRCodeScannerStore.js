/**
 * @version 0.9
 */
const INITIAL_STATE = {
    value: '',
    config: {}
}

const qrCodeScannerStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_VALUE':
            return new Object({
                ...state,
                value: action.value
            })
        case 'SET_CONFIG':
            return new Object({
                ...state,
                config: action.config
            })
        default:
            return state
    }
}

export default qrCodeScannerStoreReducer

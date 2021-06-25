/**
 * @version 0.45
 */
const INITIAL_STATE = {
    flowType: '',
    currencyCode : false,
    callback : false
}

const qrCodeScannerStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_QRCODE_SCANNER_CONFIG':
            return {
                ...state,
                flowType : action.flowType,
                currencyCode : action.currencyCode || false,
                callback: action.callback || false
            }
        default:
            return state
    }
}

export default qrCodeScannerStoreReducer

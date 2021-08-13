/**
 * @version 0.45
 */
import store from '@app/store'

const { dispatch } = store

export const QRCodeScannerFlowTypes = {
    ADD_CUSTOM_TOKEN_SCANNER : 'ADD_CUSTOM_TOKEN_SCANNER',
    ADD_MNEMONIC_SCANNER : 'ADD_MNEMONIC_SCANNER',
    WALLET_CONNECT_SCANNER : 'WALLET_CONNECT_SCANNER',
    CASHBACK_LINK : 'CASHBACK_LINK',
    SEND_SCANNER : 'SEND_SCANNER',
    MAIN_SCANNER : 'MAIN_SCANNER'
}

export function setQRConfig(data) {
    if (typeof data.flowType === 'undefined') {
        throw new Error('QRCodeScannerActions setQRConfig updated type => flowType')
    }
    dispatch({
        type: 'SET_QRCODE_SCANNER_CONFIG',
        flowType : data.flowType,
        currencyCode : data.currencyCode || false,
        callback : data.callback || false
    })
}

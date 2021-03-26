/**
 * @version 0.9
 */
const INITIAL_STATE = {
    flowType: '',
    source : false,
    walletHash : false,
    walletNumber : '0',
    walletName: '',
    walletMnemonic: '',
    mnemonicLength: 0,
    callback: null
}

const createWalletStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_MNEMONIC_LENGTH':
            return {
                ...state,
                mnemonicLength: action.mnemonicLength
            }
        case 'SET_WALLET_NAME':
            return {
                ...state,
                walletName: action.walletName
            }
        case 'SET_WALLET_MNEMONIC':
            return {
                ...state,
                walletMnemonic: action.walletMnemonic
            }
        case 'CLEAT_INIT_STATE':
            return INITIAL_STATE
        case 'SET_FLOW_TYPE':
            return {
                ...state,
                ...action
            }
        case 'SET_CALLBACK':
            return {
                ...state,
                callback: action.callback
            }
        default:
            return state
    }
}

export default createWalletStoreReducer

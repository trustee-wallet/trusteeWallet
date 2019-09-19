import store from '../../store';

const { dispatch } = store;

export function setWalletName(data) {
    dispatch({
        type: 'SET_WALLET_NAME',
        walletName: data.walletName
    });
}

export function setMnemonicLength(data) {
    dispatch({
        type: 'SET_MNEMONIC_LENGTH',
        mnemonicLength: data.mnemonicLength
    });
}

export function setWalletMnemonic(data) {
    dispatch({
        type: 'SET_WALLET_MNEMONIC',
        walletMnemonic: data.walletMnemonic
    })
}

export const setFlowType = (data) => {
    dispatch({
        type: 'SET_FLOW_TYPE',
        flowType: data.flowType
    })
};
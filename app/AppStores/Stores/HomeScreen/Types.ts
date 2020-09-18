export const SET_NEW_WALLET_NAME = 'SET_NEW_WALLET_NAME'
export const SET_INPUT_EDITABLE = 'SET_INPUT_EDITABLE'

export interface WalletName {
    text: string,
    isEditable: boolean
}

interface WalletInfo {
    walletName: WalletName
}

export interface HomeScreenState {
    walletInfo: WalletInfo
}

interface SetWalletName {
    type: typeof SET_NEW_WALLET_NAME,
    payload: {
        walletName: string
    }
}

interface SetInputEditable {
    type: typeof SET_INPUT_EDITABLE,
    payload: {
        isEditable: boolean
    }
}

export type HomeScreenActionTypes = SetWalletName | SetInputEditable
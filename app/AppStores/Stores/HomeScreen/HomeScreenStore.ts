import {
    HomeScreenActionTypes,
    HomeScreenState,
    SET_NEW_WALLET_NAME,
    SET_INPUT_EDITABLE
} from './Types'

const initialState: HomeScreenState = {
    walletInfo: {
        walletName: {
            text: '',
            isEditable: false
        }
    }
}

const homeScreenStoreReducer = (
    state = initialState,
    action: HomeScreenActionTypes
): HomeScreenState => {
    switch (action.type) {
        case SET_NEW_WALLET_NAME:
            return {
                ...state,
                walletInfo: {
                    ...state.walletInfo,
                    walletName: {
                        ...state.walletInfo.walletName,
                        text: action.payload.walletName
                    }
                }
            }
        case SET_INPUT_EDITABLE:
            return {
                ...state,
                walletInfo: {
                    ...state.walletInfo,
                    walletName: {
                        ...state.walletInfo.walletName,
                        isEditable: action.payload.isEditable
                    }
                }
            }
        default:
            return state
    }
}

export default homeScreenStoreReducer
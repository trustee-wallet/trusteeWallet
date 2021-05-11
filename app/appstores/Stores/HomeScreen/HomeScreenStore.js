/**
 * @version 0.43
 */
const initialState = {
    walletInfo: {
        walletName: {
            text: ''
        }
    }
}

const homeScreenStoreReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_NEW_WALLET_NAME':
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
        default:
            return state
    }
}

export default homeScreenStoreReducer
